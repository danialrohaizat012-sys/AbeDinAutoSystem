\set ON_ERROR_STOP on
\ir payroll-approval-db-smoke.sql
alter table public.profiles add column full_name text;
update public.profiles set full_name='Demo staff';
\ir ../sql/PROPOSED_payroll_handoff.sql
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('hr.demo.previous',(select id::text from public.staff_payroll_records order by revision desc limit 1),false);
select set_config('hr.demo.handoff',public.hr_create_payroll_handoff(public.demo_payroll(),'00000000-0000-0000-0000-000000000003',current_setting('hr.demo.previous')::uuid,'Demo handoff correction')::text,false);
do $$begin
 begin perform public.hr_submit_payroll(public.demo_payroll()); raise exception 'Direct submission allowed'; exception when insufficient_privilege then null; end;
 begin update public.hr_payroll_handoffs set status='cancelled'; raise exception 'Direct update allowed'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if (select count(*) from public.hr_payroll_handoffs)<>0 then raise exception 'Handoff leaked'; end if;
 begin perform public.hr_submit_payroll_handoff(current_setting('hr.demo.handoff')::uuid); raise exception 'Unassigned submit allowed'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin if (select count(*) from public.hr_payroll_handoffs)<>1 then raise exception 'Assigned handoff missing'; end if; end$$;
select set_config('hr.demo.handoff_submission',public.hr_submit_payroll_handoff(current_setting('hr.demo.handoff')::uuid)::text,false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.hr_decide_payroll(current_setting('hr.demo.handoff_submission')::uuid,true,'Demo approval');
do $$begin
 if (select count(id) from public.staff_payroll_records)<>4 then raise exception 'Approved revision missing'; end if;
 if not exists(select 1 from public.hr_payroll_handoffs where id=current_setting('hr.demo.handoff')::uuid and status='submitted') then raise exception 'Handoff audit missing'; end if;
end$$;
select public.hr_set_payroll_reviewer('00000000-0000-0000-0000-000000000003',false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin if (select count(*) from public.hr_payroll_handoffs)<>0 then raise exception 'Revoked access retained'; end if; end$$;
reset role;
