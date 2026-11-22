-- All transactions executed on disposable PostgreSQL fixture only.
select public.assert_test(
  not has_function_privilege('anon','public.agent_submit_direct_inquiry_gateway_v1(text,text,text,boolean,text)','EXECUTE')
  and not has_function_privilege('authenticated','public.agent_submit_direct_inquiry_gateway_v1(text,text,text,boolean,text)','EXECUTE'),
  'Direct inquiries cannot be inserted via anonymous SQL RPC');

set role service_role;
select public.agent_submit_direct_inquiry_gateway_v1(
 'TEST-PUBLIC-003','Synthetic Direct Buyer','0190000001',true,repeat('f',64));
reset role;

select public.assert_test(
 (select count(*)=1 from public.catalogue_direct_inquiries d
 join public.vehicles v on v.id=d.vehicle_id
 where d.source='public_direct' and d.customer_phone='0190000001'
 and v.vehicle_id='TEST-PUBLIC-003'),
 'Direct buyer inquiry saved with no agent attribution');
select public.assert_test(
 (select count(*)=7 from public.agent_leads where lead_source='public_referral'),
 'Direct buyer registration does not create agent commission lead');

-- Same customer cannot register twice via either path.
do $$
begin
 begin
  perform public.agent_submit_direct_inquiry_gateway_v1(
  'TEST-PUBLIC-003','Synthetic Direct Buyer','0190000001',true,repeat('a',64));
  raise exception 'FAIL: repeated direct interest accepted';
 exception when unique_violation then raise notice 'PASS: repeated direct interest rejected';
 end;
 begin
  perform public.agent_submit_public_inquiry_gateway_v1(
   (select agent_code from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003'),
   'TEST-PUBLIC-003','Synthetic Direct Buyer','0190000001',true,repeat('b',64));
  raise exception 'FAIL: direct lead taken by later agent referral';
 exception when unique_violation then raise notice 'PASS: direct lead protected against attribution hijack';
 end;
end $$;
select public.assert_test(
 (select count(*)=1 from public.catalogue_direct_inquiries where customer_phone='0190000001'),
 'One direct registration remains after duplicate attempts');
do $$
begin
 begin
  perform public.agent_submit_direct_inquiry_gateway_v1(
   'TEST-PUBLIC-003','Synthetic Missing Consent','0190000002',false,repeat('c',64));
  raise exception 'FAIL: no-consent direct registration accepted';
 exception when invalid_parameter_value then raise notice 'PASS: consent is required for direct lead';
 end;
end $$;
select public.assert_test(
 (select count(*)=0 from public.catalogue_direct_inquiries where customer_phone='0190000002'),
 'No personal data stored from unconsented direct enquiries');
