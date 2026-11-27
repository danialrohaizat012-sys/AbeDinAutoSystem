-- FASA 1C: REVIEW ONLY, replaces Fasa 1B draft (not an upgrade of a deployed table).
-- Use only in an isolated PostgreSQL/Supabase staging environment.
-- Uses existing public.profiles and public.att_role() observed in current RLS.
begin;
create table public.staff_payroll_records (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.profiles(id),
 pay_month date not null check(extract(day from pay_month)=1),
 lines jsonb not null check(jsonb_typeof(lines)='array'),
 credits_sen bigint not null check(credits_sen>=0),
 deductions_sen bigint not null check(deductions_sen>=0),
 net_sen bigint not null check(net_sen>=0 and net_sen=credits_sen-deductions_sen),
 review_reference text not null check(length(trim(review_reference)) between 1 and 1000),
 calculation_version text not null check(calculation_version='hr-review-v1'),
 recorded_by uuid not null references public.profiles(id),
 recorded_at timestamptz not null default now(),
 revision integer not null check(revision>=1),
 supersedes_id uuid unique references public.staff_payroll_records(id),
 correction_reason text,
 check ((revision=1 and supersedes_id is null and correction_reason is null) or
        (revision>1 and supersedes_id is not null and coalesce(length(trim(correction_reason)),0) between 1 and 500)),
 unique(staff_id,pay_month,revision)
);
alter table public.staff_payroll_records enable row level security;
revoke all on public.staff_payroll_records from public, anon, authenticated;
grant select (id,staff_id,pay_month,lines,credits_sen,deductions_sen,net_sen,calculation_version,recorded_at,revision,supersedes_id) on public.staff_payroll_records to authenticated;
create policy payroll_read on public.staff_payroll_records for select to authenticated
 using (public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
-- RPC owns the only write path; identity is set by server, not the browser.
-- Explicit grant and role/identity check are required because security definer bypasses RLS.
create function public.hr_record_reviewed_payroll(p_payload jsonb, p_expected_previous uuid default null, p_correction_reason text default null) returns uuid
 language plpgsql security definer set search_path='' as $$
declare
 v_actor uuid:=auth.uid(); v_id uuid; v_line jsonb; v_amount bigint;
 v_credits bigint:=0; v_deductions bigint:=0; v_k text; v_count int;
 v_staff uuid; v_month date; v_previous uuid; v_revision integer;
begin
 if v_actor is null or public.att_role() is distinct from 'owner' then raise exception 'Owner diperlukan' using errcode='42501'; end if;
 if jsonb_typeof(p_payload->'lines') is distinct from 'array' then raise exception 'Baris gaji tidak sah'; end if;
 if jsonb_array_length(p_payload->'lines') not between 5 and 500 then raise exception 'Bilangan baris tidak sah'; end if;
 v_staff:=(p_payload->>'staff_id')::uuid; v_month:=(p_payload->>'pay_month')::date;
 if v_staff is null or not exists(select 1 from public.staff_hr h where h.staff_id=v_staff) then raise exception 'Profil HR diperlukan'; end if;
 if v_month is null or extract(day from v_month)<>1 or v_month>=date_trunc('month',now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'Hanya bulan yang telah berakhir'; end if;
 -- Serialize revisions for the same staff/month, including concurrent initial creation.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_staff::text || ':' || v_month::text,0));
 select id, revision into v_previous,v_revision from public.staff_payroll_records where staff_id=v_staff and pay_month=v_month order by revision desc limit 1;
 if v_previous is distinct from p_expected_previous then raise exception 'Rekod berubah; muat semula' using errcode='40001'; end if;
 if v_previous is null and p_correction_reason is not null then raise exception 'Rekod asal tidak memerlukan sebab pembetulan'; end if;
 if v_previous is not null and coalesce(length(trim(p_correction_reason)),0) not between 1 and 500 then raise exception 'Sebab pembetulan diperlukan'; end if;
 for v_line in select value from jsonb_array_elements(p_payload->'lines') loop
   if jsonb_typeof(v_line) is distinct from 'object' or coalesce(length(trim(v_line->>'label')),0) not between 1 and 200 or coalesce(length(v_line->>'detail'),0)>1000 or jsonb_typeof(v_line->'amount_sen') is distinct from 'number' or (v_line->>'amount_sen') !~ '^-?[0-9]+$' then raise exception 'Baris gaji tidak sah'; end if;
   v_amount:=(v_line->>'amount_sen')::bigint;
   if abs(v_amount)>10000000000 then raise exception 'Amaun di luar julat'; end if;
   v_credits:=v_credits+greatest(v_amount,0); v_deductions:=v_deductions+greatest(-v_amount,0);
 end loop;
 foreach v_k in array array['KWSP','PERKESO','SIP','PCB'] loop
   select count(*) into v_count from jsonb_array_elements(p_payload->'lines') as x(item) where upper(trim(item->>'label'))=v_k;
   if v_count<>1 or not exists(select 1 from jsonb_array_elements(p_payload->'lines') as x(item) where upper(trim(item->>'label'))=v_k and (item->>'amount_sen')::bigint<=0 and coalesce(length(trim(item->>'detail')),0)>0) then raise exception 'Semak statutori %',v_k; end if;
 end loop;
 if v_credits<=0 then raise exception 'Pendapatan mesti positif; semak kes gaji sifar secara manual'; end if;
 if v_credits-v_deductions<0 or (p_payload->>'credits_sen')::bigint is distinct from v_credits or (p_payload->>'deductions_sen')::bigint is distinct from v_deductions or (p_payload->>'net_sen')::bigint is distinct from v_credits-v_deductions then raise exception 'Jumlah gaji tidak sepadan'; end if;
 insert into public.staff_payroll_records(staff_id,pay_month,lines,credits_sen,deductions_sen,net_sen,review_reference,calculation_version,recorded_by,revision,supersedes_id,correction_reason)
 values(v_staff,v_month,p_payload->'lines',v_credits,v_deductions,v_credits-v_deductions,p_payload->>'review_reference',p_payload->>'calculation_version',v_actor,coalesce(v_revision,0)+1,v_previous,trim(p_correction_reason)) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.hr_record_reviewed_payroll(jsonb,uuid,text) from public, anon, authenticated;
grant execute on function public.hr_record_reviewed_payroll(jsonb,uuid,text) to authenticated;
-- No client update/delete route. Revision is append-only. Payment reconciliation is separate.
commit;
