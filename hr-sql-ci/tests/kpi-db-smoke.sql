\set ON_ERROR_STOP on
\ir payroll-handoff-db-smoke.sql
\ir ../sql/PROPOSED_hr_kpi.sql
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
insert into public.hr_kpi_targets(staff_id,period,metric,revision,target,reason) values
('00000000-0000-0000-0000-000000000002',(date_trunc('month',now() at time zone 'Asia/Kuala_Lumpur')-interval '1 month')::date,'sales',1,10,'Demo target'),
('00000000-0000-0000-0000-000000000002',date_trunc('month',now() at time zone 'Asia/Kuala_Lumpur')::date,'sales',1,12,'Current target');
select set_config('hr.demo.target',(select id::text from public.hr_kpi_targets order by period limit 1),false);
select set_config('hr.demo.current_target',(select id::text from public.hr_kpi_targets order by period desc limit 1),false);
insert into public.hr_kpi_reviews(target_id,staff_id,revision,actual,evidence,context) values(current_setting('hr.demo.target')::uuid,'00000000-0000-0000-0000-000000000002',1,8,'Demo evidence','Demo context');
select set_config('hr.demo.review',(select id::text from public.hr_kpi_reviews limit 1),false);
do $$begin
 begin insert into public.hr_kpi_reviews(target_id,staff_id,revision,actual,evidence,context) values(current_setting('hr.demo.current_target')::uuid,'00000000-0000-0000-0000-000000000002',1,8,'Demo','Demo'); raise exception 'Open month review accepted'; exception when insufficient_privilege then null; end;
 begin insert into public.hr_kpi_reviews(target_id,staff_id,revision,actual,evidence,context) values(current_setting('hr.demo.target')::uuid,'00000000-0000-0000-0000-000000000003',2,8,'Demo','Demo'); raise exception 'Wrong staff review accepted'; exception when foreign_key_violation then null; end;
 begin update public.hr_kpi_reviews set actual=10; raise exception 'History update accepted'; exception when insufficient_privilege then null; end;
 begin delete from public.hr_kpi_targets; raise exception 'History delete accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if (select count(*) from public.hr_kpi_targets)<>2 or (select count(*) from public.hr_kpi_reviews)<>1 then raise exception 'Own KPI not readable'; end if;
 begin insert into public.hr_kpi_targets(staff_id,period,metric,revision,target,reason) values(auth.uid(),current_date,'sales',2,1,'Fake'); raise exception 'Staff target write accepted'; exception when insufficient_privilege then null; end;
end$$;
insert into public.hr_kpi_feedback(review_id,message) values(current_setting('hr.demo.review')::uuid,'Demo employee response');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin
 if (select count(*) from public.hr_kpi_targets)<>0 or (select count(*) from public.hr_kpi_reviews)<>0 or (select count(*) from public.hr_kpi_feedback)<>0 then raise exception 'Other employee KPI leaked'; end if;
 begin insert into public.hr_kpi_feedback(review_id,message) values(current_setting('hr.demo.review')::uuid,'Spoofed response'); raise exception 'Wrong staff feedback accepted'; exception when foreign_key_violation then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$begin if (select count(*) from public.hr_kpi_targets)<>0 then raise exception 'Disabled access'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$begin if (select count(*) from public.hr_kpi_feedback)<>1 then raise exception 'Feedback missing'; end if; end$$;
reset role;
set role anon;
do $$begin begin perform id from public.hr_kpi_reviews; raise exception 'Anonymous read accepted'; exception when insufficient_privilege then null; end; end$$;
reset role;
