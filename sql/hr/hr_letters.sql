-- DRAFT ONLY. Isolated test DB, never apply directly to production.
begin;
create table public.hr_letters (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.profiles(id),
 series_id uuid not null,
 revision integer not null check (revision > 0),
 kind text not null check(kind in ('offer','contract','confirmation','increment','show_cause','warning','general')),
 state text not null check(state in ('draft','issued')),
 subject text not null check(length(btrim(subject)) between 1 and 200),
 recipient text not null check(length(btrim(recipient)) between 1 and 200),
 body text not null check(length(btrim(body)) between 1 and 20000),
 effective_date date,
 reason text not null check(length(btrim(reason)) between 1 and 1000),
 created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(),
 check (state<>'issued' or (subject||' '||recipient||' '||body) !~* '\[ISI[[:space:]]+[^]]*\]'),
 unique(series_id,revision)
);
create index hr_letters_staff on public.hr_letters(staff_id,created_at desc);
alter table public.hr_letters enable row level security;
revoke all on public.hr_letters from public,anon,authenticated;
grant select on public.hr_letters to authenticated;
grant insert(staff_id,series_id,revision,kind,state,subject,recipient,body,effective_date,reason) on public.hr_letters to authenticated;
create policy hr_letter_read on public.hr_letters for select to authenticated using(public.att_role()='owner' or (state='issued' and staff_id=auth.uid() and public.att_role() is not null));
create policy hr_letter_owner_insert on public.hr_letters for insert to authenticated with check(public.att_role()='owner' and created_by=auth.uid());
-- Invoker: owner can see all versions under RLS. Lock one series per transaction.
create function public.hr_letter_validate() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.hr_letters%rowtype;
begin
 if public.att_role() is distinct from 'owner' then raise exception 'Owner required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.series_id::text,0));
 select * into p from public.hr_letters where series_id=new.series_id order by revision desc limit 1;
 if not found then
  if new.revision<>1 or new.state<>'draft' then raise exception 'Start with draft revision 1'; end if;
 else
  if new.revision<>p.revision+1 or new.staff_id<>p.staff_id or new.kind<>p.kind then raise exception 'Invalid revision or recipient; reload'; end if;
  if new.state='issued' and (p.state<>'draft' or new.subject is distinct from p.subject or new.recipient is distinct from p.recipient or new.body is distinct from p.body or new.effective_date is distinct from p.effective_date) then raise exception 'Issue only the exact latest reviewed draft'; end if;
 end if;
 return new;
end; $$;
revoke all on function public.hr_letter_validate() from public,anon,authenticated;
create trigger hr_letters_validate before insert on public.hr_letters for each row execute function public.hr_letter_validate();
-- No application update/delete grants: previous versions stay intact.
commit;
