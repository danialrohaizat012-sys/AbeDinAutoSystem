-- Executed after 10_integration.sql on disposable PostgreSQL 16 only.
-- Uses synthetic sale B, agent B; never production data.
insert into public.agent_leads(agent_id,vehicle_id,customer_name,customer_phone,consent_confirmed)
 select id,'10000000-0000-4000-8000-000000000002',
 'Synthetic Customer B','0122222222',true
 from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000004';

set role service_role;
select public.agent_link_lead_gateway_v1(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_leads where vehicle_id='10000000-0000-4000-8000-000000000002'),
 '30000000-0000-4000-8000-000000000002',
 'Verified synthetic buyer contact against the synthetic sale record');
reset role;

-- Reject commission when only a deposit is recorded.
insert into public.payments(id,sale_id,kind,amount,reference_no,confirmed_by,confirmed_at) values
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',
 'deposit',1000,'TEST-DEP-001','00000000-0000-4000-8000-000000000001',now());

do $$
begin
 begin
  perform agent_internal.approve_agent_commission_v2(
    '00000000-0000-4000-8000-000000000001',
    (select id from public.agent_leads where vehicle_id='10000000-0000-4000-8000-000000000002'),
    600,'Owner checked mock bank reconciliation and signed approval');
  raise exception 'FAIL: deposit-only commission approved';
 exception when check_violation then raise notice 'PASS: deposit-only commission rejected';
 end;
end $$;

insert into public.payments(id,sale_id,kind,amount,reference_no,confirmed_by,confirmed_at) values
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002',
 'full_payment',20000,'TEST-FULL-001','00000000-0000-4000-8000-000000000001',now());

set role service_role;
select public.agent_approve_commission_gateway_v2(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_leads where vehicle_id='10000000-0000-4000-8000-000000000002'),
 600,
 'Owner checked mock reconciliation and signed synthetic commission approval');
reset role;
select public.assert_test(
 (select count(*)=1 from public.agent_commissions where sale_id='30000000-0000-4000-8000-000000000002' and status='approved' and agreed_amount=600),
 'Owner-approved synthetic commission created');
select public.assert_test(
 (select count(*)=1 from public.agent_audit_events where action='approve' and entity_type='agent_commission'),
 'Commission approval audit recorded');

do $$
begin
 begin
 perform agent_internal.approve_agent_commission_v2(
    '00000000-0000-4000-8000-000000000001',
    (select id from public.agent_leads where vehicle_id='10000000-0000-4000-8000-000000000002'),
    600,'Repeated synthetic approval should be refused to avoid double commission');
 raise exception 'FAIL: duplicate commission accepted';
 exception when unique_violation then raise notice 'PASS: duplicate commission rejected';
 end;
end $$;
select public.assert_test((select count(*)=2 from public.sales),'Legacy sale count unchanged');

-- Owner can prepare and approve payout, but cannot confirm their own approval.
set role service_role;
select public.agent_prepare_payout_gateway_v1(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_commissions where sale_id='30000000-0000-4000-8000-000000000002'),
 'Synthetic finance team prepayment reconciliation completed');
select public.agent_approve_payout_gateway_v1(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_payouts where amount=600),
 'Synthetic payout approved pending independent bank verification');
reset role;
select public.assert_test(
 (select count(*)=1 from public.agent_payouts where amount=600 and status='approved'),
 'Payout prepared and approved');
do $$
begin
 begin
  perform public.agent_confirm_payout_gateway_v1(
  '00000000-0000-4000-8000-000000000001',
  (select id from public.agent_payouts where amount=600),
  'FAKE-BANK-REFERENCE',now());
  raise exception 'FAIL: self-confirmed payout was accepted';
 exception when insufficient_privilege then
  raise notice 'PASS: same owner cannot confirm payout';
 end;
end $$;
select public.assert_test(
 (select count(*)=1 from public.agent_payouts where amount=600 and status='approved'),
 'Failed payment confirmation leaves payout approved, not paid');
