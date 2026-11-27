-- Apply only after payroll records and approval SQL in isolated staging.
begin;
create table public.hr_payroll_handoffs (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.profiles(id),
 staff_name text not null,
 pay_month date not null check(extract(day from pay_month)=1),
 reviewer_id uuid not null references public.profiles(id),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=262144),
 expected_previous uuid references public.staff_payroll_records(id),
 correction_reason text,
 status text not null default 'waiting' check(status in ('waiting','submitted','cancelled')),
 submission_id uuid unique references public.hr_payroll_submissions(id),
 closed_at timestamptz,
 check(reviewer_id<>created_by and reviewer_id<>staff_id),
 check((status='waiting' and closed_at is null and submission_id is null) or (status='cancelled' and closed_at is not null and submission_id is null) or (status='submitted' and closed_at is not null and submission_id is not null))
);
create unique index hr_handoff_open on public.hr_payroll_handoffs(staff_id,pay_month) where status='waiting';
alter table public.hr_payroll_handoffs enable row level security;
revoke all on public.hr_payroll_handoffs from public,anon,authenticated;
grant select on public.hr_payroll_handoffs to authenticated;
create policy hr_handoff_read on public.hr_payroll_handoffs for select to authenticated using (
 public.att_role()='owner' or (public.att_role() is not null and reviewer_id=auth.uid() and exists(select 1 from public.hr_payroll_reviewers r where r.staff_id=auth.uid() and r.enabled))
);
create function public.hr_create_payroll_handoff(p_payload jsonb,p_reviewer uuid,p_expected_previous uuid default null,p_correction_reason text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_staff uuid; v_month date; v_id uuid;
begin
 if auth.uid() is null or public.att_role() is distinct from 'owner' then raise exception 'Owner diperlukan' using errcode='42501'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>262144 or jsonb_typeof(p_payload->'lines') is distinct from 'array' then raise exception 'Draf tidak sah'; end if;
 if jsonb_array_length(p_payload->'lines') not between 5 and 500 then raise exception 'Bilangan baris tidak sah'; end if;
 v_staff:=(p_payload->>'staff_id')::uuid; v_month:=(p_payload->>'pay_month')::date;
 if v_staff is null or not exists(select 1 from public.staff_hr h where h.staff_id=v_staff) then raise exception 'Profil HR diperlukan'; end if;
 if v_month is null or extract(day from v_month)<>1 or v_month>=date_trunc('month',now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'Hanya bulan yang telah berakhir'; end if;
 if p_reviewer is null or p_reviewer=auth.uid() or p_reviewer=v_staff or not exists(select 1 from public.hr_payroll_reviewers r join public.profiles p on p.id=r.staff_id where r.staff_id=p_reviewer and r.enabled and p.enabled) then raise exception 'Penyemak bebas yang aktif diperlukan'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_staff::text || ':' || v_month::text,0));
 if p_expected_previous is distinct from (select id from public.staff_payroll_records where staff_id=v_staff and pay_month=v_month order by revision desc limit 1) then raise exception 'Rekod berubah; muat semula' using errcode='40001'; end if;
 if (p_expected_previous is null and p_correction_reason is not null) or (p_expected_previous is not null and length(trim(coalesce(p_correction_reason,''))) not between 1 and 500) then raise exception 'Sebab pembetulan tidak sah'; end if;
 if exists(select 1 from public.hr_payroll_submissions where staff_id=v_staff and pay_month=v_month and status='pending') then raise exception 'Draf masih menunggu kelulusan'; end if;
 insert into public.hr_payroll_handoffs(staff_id,staff_name,pay_month,reviewer_id,created_by,payload,expected_previous,correction_reason) values(v_staff,coalesce((select full_name from public.profiles where id=v_staff),v_staff::text),v_month,p_reviewer,auth.uid(),p_payload,p_expected_previous,trim(p_correction_reason)) returning id into v_id;
 return v_id;
end; $$;
create function public.hr_submit_payroll_handoff(p_handoff uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare h public.hr_payroll_handoffs%rowtype; v_id uuid;
begin
 if auth.uid() is null or public.att_role() is null or not exists(select 1 from public.hr_payroll_reviewers r where r.staff_id=auth.uid() and r.enabled) then raise exception 'Penyemak aktif diperlukan' using errcode='42501'; end if;
 select * into h from public.hr_payroll_handoffs where id=p_handoff and reviewer_id=auth.uid() for update;
 if not found or h.status<>'waiting' then raise exception 'Draf tidak tersedia'; end if;
 v_id:=public.hr_submit_payroll(h.payload,h.expected_previous,h.correction_reason);
 update public.hr_payroll_handoffs set status='submitted',submission_id=v_id,closed_at=now() where id=h.id;
 return v_id;
end; $$;
create function public.hr_cancel_payroll_handoff(p_handoff uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.att_role() is null then raise exception 'Akses ditolak' using errcode='42501'; end if;
 update public.hr_payroll_handoffs set status='cancelled',closed_at=now() where id=p_handoff and status='waiting' and (public.att_role()='owner' or (reviewer_id=auth.uid() and exists(select 1 from public.hr_payroll_reviewers r where r.staff_id=auth.uid() and r.enabled)));
 if not found then raise exception 'Draf tidak tersedia'; end if;
end; $$;
revoke all on function public.hr_create_payroll_handoff(jsonb,uuid,uuid,text),public.hr_submit_payroll_handoff(uuid),public.hr_cancel_payroll_handoff(uuid) from public,anon,authenticated;
grant execute on function public.hr_create_payroll_handoff(jsonb,uuid,uuid,text),public.hr_submit_payroll_handoff(uuid),public.hr_cancel_payroll_handoff(uuid) to authenticated;
revoke execute on function public.hr_submit_payroll(jsonb,uuid,text) from public,anon,authenticated;
commit;
