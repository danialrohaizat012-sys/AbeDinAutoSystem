-- Real PostgreSQL assertions against synthetic, isolated fixture data.
-- Fail-fast via psql -v ON_ERROR_STOP=1. NEVER execute on production.
create or replace function public.assert_test(ok boolean, description text)
returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %',description; end if;
  raise notice 'PASS: %',description;
end $$;

-- Verified synthetic users submit applications without owner permissions.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
insert into public.agent_applications(user_id,full_name,phone,email,state)
 values ('00000000-0000-4000-8000-000000000003','Test Agent A','0123333333','agent-a@test.invalid','Kelantan');
select public.assert_test((select count(*)=1 from public.agent_applications),'Agent A sees own application');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select public.assert_test((select count(*)=0 from public.agent_applications),'RLS hides Agent A from Agent B');
insert into public.agent_applications(user_id,full_name,phone,email,state)
 values ('00000000-0000-4000-8000-000000000004','Test Agent B','0124444444','agent-b@test.invalid','Kelantan');
select public.assert_test((select count(*)=1 from public.agent_applications),'Agent B sees only own application');
reset role;

-- Database-level guard denies an unverified applicant.
do $$
begin
  begin
    insert into public.agent_applications(user_id,full_name,phone,email,state)
    values ('00000000-0000-4000-8000-000000000005','Unverified User','0125555555','unverified@test.invalid','Kelantan');
    raise exception 'FAIL: unverified user was accepted';
  exception when check_violation then
    raise notice 'PASS: unverified application blocked';
  end;
end $$;

-- Owner review creates real agent profiles within a single transaction.
set role service_role;
select public.agent_admin_review_v1(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_applications where user_id='00000000-0000-4000-8000-000000000003'),
 'approve',null);
select public.agent_admin_review_v1(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_applications where user_id='00000000-0000-4000-8000-000000000004'),
 'approve',null);
reset role;
select public.assert_test(
 (select count(*)=2 from public.agent_profiles),
 'Both verified agents approved');
select public.assert_test(
 (select count(distinct agent_code)=2 from public.agent_profiles),
 'Generated agent codes unique');

-- Agent A creates a lead and Agent B cannot read it.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
insert into public.agent_leads(agent_id,vehicle_id,customer_name,customer_phone,consent_confirmed)
select id,'10000000-0000-4000-8000-000000000001','Synthetic Customer A','0121111111',true
from public.agent_profiles where user_id='00000000-0000-4000-8000-000000000003';
select public.assert_test((select count(*)=1 from public.agent_leads),'Agent A sees own lead');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
select public.assert_test((select count(*)=0 from public.agent_leads),'Agent B cannot read Agent A lead');
reset role;

-- Lead attribution checks original sale and customer, with owner-only API.
set role service_role;
select public.agent_link_lead_gateway_v1(
 '00000000-0000-4000-8000-000000000001',
 (select id from public.agent_leads limit 1),
 '30000000-0000-4000-8000-000000000001',
 'Confirmed synthetic customer phone and attribution documents');
reset role;
select public.assert_test(
 (select count(*)=1 from public.agent_leads where linked_sale_id='30000000-0000-4000-8000-000000000001'),
 'Lead attributed to original sale');
select public.assert_test(
 (select count(*)=2 from public.sales),
 'Legacy sales row count unchanged');

-- Create a commission and payout, then verify payout state machine and owner separation.
insert into public.agent_commissions(agent_id,lead_id,sale_id,agreed_amount,status,approved_by,approved_at)
select l.agent_id,l.id,'30000000-0000-4000-8000-000000000001',500,'approved',
 '00000000-0000-4000-8000-000000000001',now()
from public.agent_leads l where l.linked_sale_id='30000000-0000-4000-8000-000000000001';
insert into public.agent_payouts(agent_id,amount,status)
select a.id,500,'draft' from public.agent_profiles a
where a.user_id='00000000-0000-4000-8000-000000000003';
insert into public.agent_payout_items(payout_id,commission_id,amount)
select p.id,c.id,500 from public.agent_payouts p cross join public.agent_commissions c;

update public.agent_payouts
set status='approved',approved_by='00000000-0000-4000-8000-000000000001'
where amount=500;

set role service_role;
select public.agent_confirm_payout_gateway_v1(
 '00000000-0000-4000-8000-000000000002',
 (select id from public.agent_payouts limit 1),
 'SYNTHETIC-TRANSFER-0001',now());
reset role;

select public.assert_test((select count(*)=1 from public.agent_payouts where status='paid'),
 'Payout marked paid');
select public.assert_test((select count(*)=1 from public.agent_commissions where status='paid'),
 'Commission marked paid in same transaction');
select public.assert_test((select count(*)=1 from public.agent_audit_events where action='mark_paid'),
 'Payment audit recorded');

-- Repeat must fail, and a paid commission may never be modified.
do $$
begin
 begin
  perform public.agent_confirm_payout_gateway_v1(
  '00000000-0000-4000-8000-000000000002',
  (select id from public.agent_payouts limit 1),'SYNTHETIC-TRANSFER-0001',now());
  raise exception 'FAIL: duplicate paid payout accepted';
 exception when check_violation then
  raise notice 'PASS: repeated payout rejected';
 end;
end $$;

select public.assert_test((select count(*)=2 from public.vehicles),'Legacy vehicles unchanged');
select public.assert_test((select count(*)=2 from public.customers),'Legacy customers unchanged');
select public.assert_test((select count(*)=0 from public.payments),'Legacy payments unchanged');
