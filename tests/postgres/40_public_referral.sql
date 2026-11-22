-- Public referral registration tests use synthetic records only.
-- Executed after the three finance test scripts on disposable PostgreSQL 16.
insert into public.vehicles(id,vehicle_id,status,is_published,catalogue_status)
values('10000000-0000-4000-8000-000000000003','TEST-PUBLIC-003','available',true,'available');

select public.assert_test(
 not has_function_privilege('anon',
 'public.agent_submit_public_inquiry_gateway_v1(text,text,text,text,boolean,text)','EXECUTE')
 and not has_function_privilege('authenticated',
 'public.agent_submit_public_inquiry_gateway_v1(text,text,text,text,boolean,text)','EXECUTE'),
 'Anonymous visitors cannot directly invoke privileged lead-insert RPC');

set role service_role;
select public.agent_submit_public_inquiry_gateway_v1(
 (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003'),
 'TEST-PUBLIC-003','Synthetic Public Buyer 1','0170000001',true,
 repeat('a',64));
reset role;

select public.assert_test(
 (select count(*)=1 from public.agent_leads l
   join public.agent_profiles a on a.id=l.agent_id
   where l.lead_source='public_referral'
     and l.referral_code_snapshot=a.agent_code
     and a.user_id='00000000-0000-4000-8000-000000000003'
     and l.customer_phone='0170000001'),
 'Public referral lead is attributed to the correct verified agent');

select public.assert_test(
 (select count(*)=1 from public.agent_audit_events
   where action='public_inquiry' and entity_type='agent_lead'),
 'Public referral event is audited');

-- Same customer and car cannot be reassigned to a different referring agent.
do $$
begin
 begin
 perform public.agent_submit_public_inquiry_gateway_v1(
 (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000004'),
 'TEST-PUBLIC-003','Synthetic Public Buyer 1','0170000001',true,
 repeat('b',64));
 raise exception 'FAIL: different agent hijacked existing lead';
 exception when unique_violation then raise notice 'PASS: competing referral is rejected';
 end;
end $$;

-- A public visitor cannot claim an unpublished car or submit without consent.
update public.vehicles set is_published=false
where vehicle_id='TEST-PUBLIC-003';
do $$
begin
 begin
 perform public.agent_submit_public_inquiry_gateway_v1(
 (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003'),
 'TEST-PUBLIC-003','Synthetic Public Buyer 2','0170000002',true,repeat('c',64));
 raise exception 'FAIL: hidden car accepted';
 exception when check_violation then raise notice 'PASS: unpublished car rejected';
 end;
 begin
 perform public.agent_submit_public_inquiry_gateway_v1(
 (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003'),
 'TEST-PUBLIC-003','Synthetic Public Buyer 2','0170000002',false,repeat('d',64));
 raise exception 'FAIL: missing consent accepted';
 exception when invalid_parameter_value then raise notice 'PASS: missing customer consent rejected';
 end;
end $$;
update public.vehicles set is_published=true
where vehicle_id='TEST-PUBLIC-003';

-- Six accepted submissions per hashed requester in an hour, then throttle.
do $$
declare i integer; v jsonb;
begin
 for i in 1..6 loop
  select public.agent_submit_public_inquiry_gateway_v1(
    (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003'),
    'TEST-PUBLIC-003','Synthetic Public Buyer '||i,
    '018000000'||i::text,true,repeat('e',64)) into v;
  if v->>'status'<>'new' then raise exception 'FAIL: allowed requester throttled early'; end if;
 end loop;
 select public.agent_submit_public_inquiry_gateway_v1(
    (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003'),
    'TEST-PUBLIC-003','Synthetic Public Buyer 7',
    '0180000007',true,repeat('e',64)) into v;
 if v->>'status'<>'rate_limited' then
  raise exception 'FAIL: request limit bypassed';
 end if;
 raise notice 'PASS: requests above hourly quota rejected';
end $$;

select public.assert_test(
 (select count(*)=7 from public.agent_leads where lead_source='public_referral'),
 'Only seven synthetic consented leads stored; rate-limited request not inserted');
select public.assert_test(
 (select count(*)=1 from public.agent_leads where customer_phone='0170000001'),
 'Original referral remains unchanged after competing agent attempt');
