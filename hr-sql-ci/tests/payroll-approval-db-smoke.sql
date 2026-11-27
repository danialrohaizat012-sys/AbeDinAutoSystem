\set ON_ERROR_STOP on
\ir payroll-db-smoke.sql
\ir ../sql/PROPOSED_payroll_approval.sql
insert into public.profiles values ('00000000-0000-0000-0000-000000000005','owner',true);
insert into public.staff_hr values ('00000000-0000-0000-0000-000000000005');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.hr_set_payroll_reviewer('00000000-0000-0000-0000-000000000003',true);
do $$begin
 begin perform public.hr_record_reviewed_payroll(public.demo_payroll()); raise exception 'Direct bypass accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 begin perform public.hr_submit_payroll(public.demo_payroll()); raise exception 'Ordinary staff submit accepted'; exception when insufficient_privilege then null; end;
 if (select count(*) from public.hr_payroll_submissions)<>0 then raise exception 'Draft exposed'; end if;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
reset role;
select set_config('hr.demo.previous',(select id::text from public.staff_payroll_records order by revision desc limit 1),false);
set role authenticated;
select set_config('hr.demo.submission',public.hr_submit_payroll(public.demo_payroll(),current_setting('hr.demo.previous')::uuid,'Demo revision')::text,false);
do $$begin
 if (select count(*) from public.hr_payroll_submissions)<>1 then raise exception 'Delegate draft not readable'; end if;
 begin perform public.hr_decide_payroll(current_setting('hr.demo.submission')::uuid,true,'Demo'); raise exception 'Delegate approval accepted'; exception when insufficient_privilege then null; end;
 begin update public.hr_payroll_submissions set status='approved'; raise exception 'Draft direct update accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.hr_decide_payroll(current_setting('hr.demo.submission')::uuid,true,'Demo approved');
do $$begin
 if (select count(id) from public.staff_payroll_records)<>3 then raise exception 'Approved revision missing'; end if;
 if not exists(select 1 from public.hr_payroll_submissions where status='approved' and record_id is not null and submitted_by<>decided_by) then raise exception 'Approval audit missing'; end if;
end$$;
select set_config('hr.demo.previous',(select id::text from public.staff_payroll_records order by revision desc limit 1),false);
select set_config('hr.demo.submission',public.hr_submit_payroll(public.demo_payroll(),current_setting('hr.demo.previous')::uuid,'Another demo revision')::text,false);
do $$begin
 begin perform public.hr_decide_payroll(current_setting('hr.demo.submission')::uuid,true,'Self'); raise exception 'Self approval accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select public.hr_decide_payroll(current_setting('hr.demo.submission')::uuid,false,'Demo rejected');
do $$begin
 if (select count(id) from public.staff_payroll_records)<>3 then raise exception 'Rejected draft changed payroll'; end if;
end$$;
reset role;
