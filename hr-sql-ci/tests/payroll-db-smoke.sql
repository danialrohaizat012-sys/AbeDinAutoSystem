-- Run ONLY against a fresh local disposable PostgreSQL database using psql -v ON_ERROR_STOP=1.
-- Supabase auth is mocked; actual project role/API behavior requires separate staging testing.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated, anon;
create table public.profiles(id uuid primary key, role text not null, enabled boolean not null default true);
create table public.staff_hr(staff_id uuid primary key references public.profiles(id));
create function public.att_role() returns text language sql stable security definer set search_path='' as $$select role from public.profiles where id=auth.uid() and enabled$$;
insert into public.profiles values ('00000000-0000-0000-0000-000000000001','owner',true),('00000000-0000-0000-0000-000000000002','operations',true),('00000000-0000-0000-0000-000000000003','operations',true),('00000000-0000-0000-0000-000000000004','operations',false);
insert into public.staff_hr select id from public.profiles;
\ir ../sql/PROPOSED_staff_payroll_records.sql
create function public.demo_payroll() returns jsonb language sql as $$select jsonb_build_object('staff_id','00000000-0000-0000-0000-000000000002','pay_month',(date_trunc('month',now() at time zone 'Asia/Kuala_Lumpur')-interval '1 month')::date,'lines','[{"label":"Gaji asas","amount_sen":200000},{"label":"KWSP","detail":"demo","amount_sen":-20000},{"label":"PERKESO","detail":"demo","amount_sen":0},{"label":"SIP","detail":"demo","amount_sen":0},{"label":"PCB","detail":"demo","amount_sen":0}]'::jsonb,'credits_sen',200000,'deductions_sen',20000,'net_sen',180000,'review_reference','demo','calculation_version','hr-review-v1')$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare first_id uuid; second_id uuid; begin
first_id:=public.hr_record_reviewed_payroll(public.demo_payroll());
begin perform public.hr_record_reviewed_payroll(public.demo_payroll()); raise exception 'Duplicate accepted'; exception when serialization_failure then null; end;
begin perform public.hr_record_reviewed_payroll(public.demo_payroll(),first_id,''); raise exception 'Empty reason accepted'; exception when raise_exception then if sqlerrm<>'Sebab pembetulan diperlukan' then raise; end if; end;
second_id:=public.hr_record_reviewed_payroll(public.demo_payroll(),first_id,'Demo correction');
if first_id=second_id or (select count(id) from public.staff_payroll_records)<>2 then raise exception 'Revision failed'; end if;
begin perform public.hr_record_reviewed_payroll(public.demo_payroll(),first_id,'Stale'); raise exception 'Stale accepted'; exception when serialization_failure then null; end;
begin update public.staff_payroll_records set net_sen=0; raise exception 'Update accepted'; exception when insufficient_privilege then null; end;
begin perform public.hr_record_reviewed_payroll(jsonb_set(public.demo_payroll(),'{net_sen}','1'::jsonb),second_id,'Tamper'); raise exception 'Tamper accepted'; exception when raise_exception then if sqlerrm<>'Jumlah gaji tidak sepadan' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin if (select count(id) from public.staff_payroll_records)<>2 then raise exception 'Own access failed'; end if;
begin perform public.hr_record_reviewed_payroll(public.demo_payroll()); raise exception 'Staff write accepted'; exception when insufficient_privilege then null; end;
begin perform review_reference from public.staff_payroll_records; raise exception 'Private reference accessible'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin if (select count(id) from public.staff_payroll_records)<>0 then raise exception 'Other staff access'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$begin if (select count(id) from public.staff_payroll_records)<>0 then raise exception 'Disabled access'; end if; end$$;
reset role;
set role anon;
do $$begin begin perform id from public.staff_payroll_records; raise exception 'Anonymous read accepted'; exception when insufficient_privilege then null; end; end$$;
reset role;
