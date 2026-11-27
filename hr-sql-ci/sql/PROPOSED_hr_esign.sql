-- Draft for isolated testing only. Requires Fasa 3A.
begin;
create table public.hr_letter_signatures (
 letter_id uuid primary key references public.hr_letters(id),
 signer_id uuid not null default auth.uid() references public.profiles(id),
 typed_name text not null check (length(btrim(typed_name)) between 1 and 200),
 intent text not null check (intent in ('receipt','acceptance')),
 consent_version text not null default 'hr-esign-v1' check(consent_version='hr-esign-v1'),
 signed_at timestamptz not null default clock_timestamp(),
 document_sha256 text not null check(document_sha256 ~ '^[a-f0-9]{64}$')
);
alter table public.hr_letter_signatures enable row level security;
revoke all on public.hr_letter_signatures from public,anon,authenticated;
grant select on public.hr_letter_signatures to authenticated;
grant insert(letter_id,typed_name,intent) on public.hr_letter_signatures to authenticated;
create policy hr_signature_read on public.hr_letter_signatures for select to authenticated using (public.att_role()='owner' or (signer_id=auth.uid() and public.att_role() is not null));
create policy hr_signature_insert on public.hr_letter_signatures for insert to authenticated with check (signer_id=auth.uid() and public.att_role() is not null);
create function public.hr_signature_validate() returns trigger language plpgsql security invoker set search_path='' as $$
declare doc public.hr_letters%rowtype; account_name text;
begin
 if auth.uid() is null or public.att_role() is null or new.signer_id is distinct from auth.uid() then raise exception 'Authenticated active recipient required'; end if;
 select * into doc from public.hr_letters where id=new.letter_id and staff_id=auth.uid() and state='issued';
 if not found then raise exception 'Issued document for own account required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(doc.series_id::text,0));
 if exists(select 1 from public.hr_letters where series_id=doc.series_id and state='issued' and revision>doc.revision) then raise exception 'Document superseded'; end if;
 select full_name into account_name from public.profiles where id=auth.uid() and enabled is true;
 if account_name is null or lower(btrim(new.typed_name)) is distinct from lower(btrim(account_name)) then raise exception 'Name must match account'; end if;
 if new.intent='acceptance' and doc.kind not in ('offer','contract') then raise exception 'Receipt only for this document'; end if;
 new.typed_name:=btrim(account_name);
 new.signed_at:=clock_timestamp();
 new.document_sha256:=encode(sha256(convert_to(jsonb_build_array(doc.id,doc.series_id,doc.revision,doc.staff_id,doc.kind,doc.subject,doc.recipient,doc.body,doc.effective_date)::text,'UTF8')),'hex');
 return new;
end; $$;
revoke all on function public.hr_signature_validate() from public,anon,authenticated;
create trigger hr_signature_validate before insert on public.hr_letter_signatures for each row execute function public.hr_signature_validate();
-- No update/delete privileges for application roles. Receipt is not acceptance.
commit;
