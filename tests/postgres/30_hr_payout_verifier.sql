-- Real database verification of HR second-signer separation.
-- Run only on disposable GitHub Actions PostgreSQL fixture.
-- Prior fixture 20 created approved payout of RM 600 by owner A.
insert into public.agent_payout_verifiers(user_id,enabled,granted_by,reason)
values('00000000-0000-4000-8000-000000000006',true,
       '00000000-0000-4000-8000-000000000001',
       'Synthetic HR authorized as second verifier for integration tests');

select public.assert_test(
 (select role::text='sales_advisor' from public.profiles
 where id='00000000-0000-4000-8000-000000000006'),
 'HR keeps sales_advisor staff role');
select public.assert_test(
 (select count(*)=1 from public.agent_payout_verifiers
  where user_id='00000000-0000-4000-8000-000000000006' and enabled),
 'HR second-verifier is explicitly enabled');

-- An unassigned staff member must never confirm a bank payout.
do $$
begin
 begin
   perform public.agent_confirm_payout_gateway_v1(
     '00000000-0000-4000-8000-000000000007',
     (select id from public.agent_payouts where amount=600),
     'SYNTHETIC-HR-UNAUTHORIZED',now());
   raise exception 'FAIL: non-HR staff was allowed to confirm';
 exception when insufficient_privilege then
   raise notice 'PASS: unassigned staff cannot verify payout';
 end;
end $$;
-- The authorizing owner may not confirm their own approved payout.
do $$
begin
 begin
   perform public.agent_confirm_payout_gateway_v1(
     '00000000-0000-4000-8000-000000000001',
     (select id from public.agent_payouts where amount=600),
     'SYNTHETIC-HR-SELF-CONFIRM',now());
   raise exception 'FAIL: original owner confirmed own payout';
 exception when insufficient_privilege then
   raise notice 'PASS: original approver cannot self-confirm';
 end;
end $$;
-- Disabling HR permission immediately revokes the ability to confirm.
update public.agent_payout_verifiers set enabled=false
where user_id='00000000-0000-4000-8000-000000000006';
do $$
begin
 begin
   perform public.agent_confirm_payout_gateway_v1(
     '00000000-0000-4000-8000-000000000006',
     (select id from public.agent_payouts where amount=600),
     'SYNTHETIC-HR-DISABLED',now());
   raise exception 'FAIL: disabled HR verified a payout';
 exception when insufficient_privilege then
   raise notice 'PASS: revoked HR authorization is blocked';
 end;
end $$;
update public.agent_payout_verifiers set enabled=true
where user_id='00000000-0000-4000-8000-000000000006';

set role service_role;
select public.agent_confirm_payout_gateway_v1(
 '00000000-0000-4000-8000-000000000006',
 (select id from public.agent_payouts where amount=600),
 'SYNTHETIC-HR-TRANSFER-600',now());
reset role;

select public.assert_test(
 (select count(*)=1 from public.agent_payouts
  where amount=600 and status='paid' and transfer_reference='SYNTHETIC-HR-TRANSFER-600'),
 'Independent HR confirms an approved payout');
select public.assert_test(
 (select count(*)=1 from public.agent_commissions
  where agreed_amount=600 and status='paid'),
 'Linked commission is paid atomically');
select public.assert_test(
 (select count(*)=1 from public.agent_audit_events
  where action='mark_paid'
    and actor_user_id='00000000-0000-4000-8000-000000000006'),
 'Audit records the HR account as the confirming actor');

-- Repeat must not pay a second time.
do $$
begin
 begin
   perform public.agent_confirm_payout_gateway_v1(
     '00000000-0000-4000-8000-000000000006',
     (select id from public.agent_payouts where amount=600),
     'SYNTHETIC-HR-TRANSFER-600',now());
   raise exception 'FAIL: HR confirmed duplicate payout';
 exception when check_violation then
   raise notice 'PASS: duplicate payout confirmation blocked';
 end;
end $$;
select public.assert_test(
 (select count(*)=2 from public.agent_payouts where status='paid'),
 'Exactly two synthetic payouts finalized overall');
select public.assert_test(
 (select count(*)=2 from public.sales),
 'Existing synthetic sales unchanged');
