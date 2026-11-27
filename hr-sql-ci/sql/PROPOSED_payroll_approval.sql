-- Fasa 1D. Apply after PROPOSED_staff_payroll_records.sql in disposable staging ONLY.
begin;
create table public.hr_payroll_reviewers (
 staff_id uuid primary key references public.profiles(id),
 enabled boolean not null default true,
 granted_by uuid not null references public.profiles(id),
 granted_at timestamptz not null default now()
);
alter table public.hr_payroll_reviewers enable row level security;
revoke all on public.hr_payroll_reviewers from public, anon, authenticated;
grant select on public.hr_payroll_reviewers to authenticated;
create policy reviewer_read on public.hr_payroll_reviewers for select to authenticated
 using (public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
create function public.hr_set_payroll_reviewer(p_staff uuid,p_enabled boolean) returns void
 language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.att_role() is distinct from 'owner' then raise exception 'Owner diperlukan' using errcode='42501'; end if;
 if p_staff is null or p_enabled is null or not exists(select 1 from public.profiles p where p.id=p_staff and p.enabled) then raise exception 'Staf aktif diperlukan'; end if;
 insert into public.hr_payroll_reviewers(staff_id,enabled,granted_by) values(p_staff,p_enabled,auth.uid())
 on conflict(staff_id) do update set enabled=excluded.enabled,granted_by=excluded.granted_by,granted_at=now();
end; $$;
revoke all on function public.hr_set_payroll_reviewer(uuid,boolean) from public, anon, authenticated;
grant execute on function public.hr_set_payroll_reviewer(uuid,boolean) to authenticated;
create table public.hr_payroll_submissions (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.profiles(id),
 pay_month date not null check(extract(day from pay_month)=1),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 expected_previous uuid references public.staff_payroll_records(id),
 correction_reason text,
 submitted_by uuid not null references public.profiles(id),
 submitted_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 decided_by uuid references public.profiles(id),
 decided_at timestamptz,
 decision_note text,
 record_id uuid unique references public.staff_payroll_records(id),
 check ((status='pending' and decided_by is null and decided_at is null and decision_note is null and record_id is null)
 or (status in ('approved','rejected') and decided_by is not null and decided_by<>submitted_by and decided_at is not null and length(trim(coalesce(decision_note,''))) between 1 and 500 and ((status='approved' and record_id is not null) or (status='rejected' and record_id is null))))
);
create unique index hr_one_pending_payroll on public.hr_payroll_submissions(staff_id,pay_month) where status='pending';
alter table public.hr_payroll_submissions enable row level security;
revoke all on public.hr_payroll_submissions from public, anon, authenticated;
grant select on public.hr_payroll_submissions to authenticated;
create policy submission_read on public.hr_payroll_submissions for select to authenticated using (
 public.att_role()='owner' or (submitted_by=auth.uid() and public.att_role() is not null and exists(select 1 from public.hr_payroll_reviewers r where r.staff_id=auth.uid() and r.enabled)));
create function public.hr_submit_payroll(p_payload jsonb,p_expected_previous uuid default null,p_correction_reason text default null) returns uuid
 language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_staff uuid; v_month date; v_id uuid;
begin
 if v_actor is null or public.att_role() is null or (public.att_role()<>'owner' and not exists(select 1 from public.hr_payroll_reviewers r where r.staff_id=v_actor and r.enabled)) then raise exception 'Penyemak HR diperlukan' using errcode='42501'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>262144 or jsonb_typeof(p_payload->'lines') is distinct from 'array' then raise exception 'Draf tidak sah'; end if;
 if jsonb_array_length(p_payload->'lines') not between 5 and 500 then raise exception 'Bilangan baris tidak sah'; end if;
 v_staff:=(p_payload->>'staff_id')::uuid; v_month:=(p_payload->>'pay_month')::date;
 if v_staff is null or not exists(select 1 from public.staff_hr h where h.staff_id=v_staff) then raise exception 'Profil HR diperlukan'; end if;
 if v_month is null or extract(day from v_month)<>1 or v_month>=date_trunc('month',now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'Hanya bulan yang telah berakhir'; end if;
 if p_expected_previous is distinct from (select id from public.staff_payroll_records where staff_id=v_staff and pay_month=v_month order by revision desc limit 1) then raise exception 'Rekod berubah; muat semula' using errcode='40001'; end if;
 if (p_expected_previous is null and p_correction_reason is not null) or (p_expected_previous is not null and length(trim(coalesce(p_correction_reason,''))) not between 1 and 500) then raise exception 'Sebab pembetulan tidak sah'; end if;
 insert into public.hr_payroll_submissions(staff_id,pay_month,payload,expected_previous,correction_reason,submitted_by) values(v_staff,v_month,p_payload,p_expected_previous,trim(p_correction_reason),v_actor) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.hr_submit_payroll(jsonb,uuid,text) from public, anon, authenticated;
grant execute on function public.hr_submit_payroll(jsonb,uuid,text) to authenticated;
create function public.hr_decide_payroll(p_submission uuid,p_approve boolean,p_note text) returns uuid
 language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_draft public.hr_payroll_submissions%rowtype; v_record uuid;
begin
 if v_actor is null or public.att_role() is distinct from 'owner' then raise exception 'Owner diperlukan' using errcode='42501'; end if;
 if p_approve is null or length(trim(coalesce(p_note,''))) not between 1 and 500 then raise exception 'Nota keputusan diperlukan'; end if;
 select * into v_draft from public.hr_payroll_submissions where id=p_submission for update;
 if not found or v_draft.status<>'pending' then raise exception 'Draf tidak lagi menunggu'; end if;
 if v_actor=v_draft.submitted_by then raise exception 'Kelulusan sendiri tidak dibenarkan' using errcode='42501'; end if;
 if p_approve then
  v_record:=public.hr_record_reviewed_payroll(v_draft.payload,v_draft.expected_previous,v_draft.correction_reason);
 end if;
 update public.hr_payroll_submissions set status=case when p_approve then 'approved' else 'rejected' end, decided_by=v_actor,decided_at=now(),decision_note=trim(p_note),record_id=v_record where id=p_submission;
 return v_record;
end; $$;
revoke all on function public.hr_decide_payroll(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.hr_decide_payroll(uuid,boolean,text) to authenticated;
revoke execute on function public.hr_record_reviewed_payroll(jsonb,uuid,text) from public, anon, authenticated;
commit;
