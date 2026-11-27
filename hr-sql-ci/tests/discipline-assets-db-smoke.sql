\set ON_ERROR_STOP on
\ir letters-esign-db-smoke.sql
\ir ../sql/PROPOSED_hr_discipline.sql
\ir ../sql/PROPOSED_hr_assets.sql
-- Shared demo helper uses invoker rights.
create function public.demo_event(c uuid,s uuid,n int,k text,d date default null) returns void language sql security invoker as $$
insert into public.hr_discipline_events(case_id,staff_id,seq,kind,body,response_due) values(c,s,n,k,'Demo case narrative',d)
$$;
create function public.demo_asset(a uuid,n int,k text,s uuid default null) returns void language sql security invoker as $$
insert into public.hr_asset_events(asset_id,seq,kind,staff_id,condition_note) values(a,n,k,s,'Demo condition')
$$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('hr.demo.case',gen_random_uuid()::text,false);
select public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',1,'notice',(now() at time zone 'Asia/Kuala_Lumpur')::date+2);
do $$begin
 begin perform public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',2,'outcome'); raise exception 'Skipped procedure'; exception when raise_exception then if sqlerrm<>'Invalid transition' then raise; end if; end;
 begin perform public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',3,'review'); raise exception 'Sequence bypass'; exception when raise_exception then if sqlerrm<>'Stale or invalid case; reload' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin
 if (select count(*) from public.hr_discipline_events)<>0 then raise exception 'Case leaked'; end if;
 begin perform public.demo_event(current_setting('hr.demo.case')::uuid,auth.uid(),2,'response'); raise exception 'Cross-staff response'; exception when raise_exception then if sqlerrm<>'Valid notice required' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select public.demo_event(current_setting('hr.demo.case')::uuid,auth.uid(),2,'response');
do $$begin
 begin perform public.demo_event(current_setting('hr.demo.case')::uuid,auth.uid(),3,'review'); raise exception 'Staff review accepted'; exception when raise_exception then if sqlerrm<>'Owner required' then raise; end if; end;
 begin update public.hr_discipline_events set body='Altered history'; raise exception 'Case history mutable'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',3,'review');
do $$begin
 begin perform public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',4,'outcome'); raise exception 'Early outcome accepted'; exception when raise_exception then if sqlerrm<>'Invalid transition' then raise; end if; end;
end$$;
-- Test clock fixture only: create an elapsed notice as database admin, not application actor.
reset role;
alter table public.hr_discipline_events disable trigger hr_discipline_validate;
update public.hr_discipline_events set response_due=(now() at time zone 'Asia/Kuala_Lumpur')::date-1 where case_id=current_setting('hr.demo.case')::uuid and seq=1;
alter table public.hr_discipline_events enable trigger hr_discipline_validate;
set role authenticated;
select public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',4,'outcome');
select public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',5,'pip');
select public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',6,'pip_update');
select public.demo_event(current_setting('hr.demo.case')::uuid,'00000000-0000-0000-0000-000000000002',7,'close');
do $$begin
 if (select count(*) from public.hr_discipline_events)<>7 then raise exception 'Case lifecycle missing'; end if;
 begin delete from public.hr_discipline_events; raise exception 'Case deletion accepted'; exception when insufficient_privilege then null; end;
end$$;
insert into public.hr_assets(code,name,category) values('DEMO-KEY','Demo key','key'),('DEMO-PHONE','Demo phone','phone');
select set_config('hr.demo.asset',(select id::text from public.hr_assets where code='DEMO-KEY'),false);
select public.demo_asset(current_setting('hr.demo.asset')::uuid,1,'issue','00000000-0000-0000-0000-000000000002');
do $$begin
 begin perform public.demo_asset(current_setting('hr.demo.asset')::uuid,2,'issue','00000000-0000-0000-0000-000000000003'); raise exception 'Double issue'; exception when raise_exception then if sqlerrm<>'Invalid asset transition' then raise; end if; end;
 begin perform public.demo_asset(current_setting('hr.demo.asset')::uuid,2,'return','00000000-0000-0000-0000-000000000003'); raise exception 'Wrong holder return'; exception when raise_exception then if sqlerrm<>'Invalid asset transition' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if (select count(*) from public.hr_assets)<>1 or (select count(*) from public.hr_asset_events)<>1 then raise exception 'Own asset scope wrong'; end if;
 begin perform public.demo_asset(current_setting('hr.demo.asset')::uuid,2,'return',auth.uid()); raise exception 'Staff asset mutation accepted'; exception when raise_exception then if sqlerrm<>'Owner required' then raise; end if; end;
 begin perform public.demo_event(current_setting('hr.demo.case')::uuid,auth.uid(),8,'response'); raise exception 'Closed response accepted'; exception when raise_exception then if sqlerrm<>'Response not allowed' then raise; end if; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$begin if (select count(*) from public.hr_assets)<>0 or (select count(*) from public.hr_asset_events)<>0 then raise exception 'Asset leaked'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.demo_asset(current_setting('hr.demo.asset')::uuid,2,'return','00000000-0000-0000-0000-000000000002');
select public.demo_asset(current_setting('hr.demo.asset')::uuid,3,'maintenance');
do $$begin
 begin perform public.demo_asset(current_setting('hr.demo.asset')::uuid,4,'issue','00000000-0000-0000-0000-000000000003'); raise exception 'Maintenance issue accepted'; exception when raise_exception then if sqlerrm<>'Invalid asset transition' then raise; end if; end;
end$$;
select public.demo_asset(current_setting('hr.demo.asset')::uuid,4,'ready');
do $$begin
 begin perform public.demo_asset(current_setting('hr.demo.asset')::uuid,5,'issue','00000000-0000-0000-0000-000000000004'); raise exception 'Disabled holder accepted'; exception when raise_exception then if sqlerrm<>'Active staff required' then raise; end if; end;
end$$;
select public.demo_asset(current_setting('hr.demo.asset')::uuid,5,'issue','00000000-0000-0000-0000-000000000003');
select public.demo_asset(current_setting('hr.demo.asset')::uuid,6,'return','00000000-0000-0000-0000-000000000003');
select public.demo_asset(current_setting('hr.demo.asset')::uuid,7,'retire');
do $$begin
 begin perform public.demo_asset(current_setting('hr.demo.asset')::uuid,8,'issue','00000000-0000-0000-0000-000000000002'); raise exception 'Retired issue accepted'; exception when raise_exception then if sqlerrm<>'Invalid asset transition' then raise; end if; end;
 begin update public.hr_asset_events set condition_note='Changed'; raise exception 'History mutable'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin if (select count(*) from public.hr_asset_events)<>2 then raise exception 'Other holder history leaked'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$begin if (select count(*) from public.hr_assets)<>0 or (select count(*) from public.hr_discipline_events)<>0 then raise exception 'Disabled access'; end if; end$$;
reset role;
set role anon;
do $$begin
 begin perform id from public.hr_assets; raise exception 'Anonymous asset read'; exception when insufficient_privilege then null; end;
 begin perform case_id from public.hr_discipline_events; raise exception 'Anonymous discipline read'; exception when insufficient_privilege then null; end;
end$$;
reset role;
