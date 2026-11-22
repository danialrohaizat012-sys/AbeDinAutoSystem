-- Only new agent payout ledger. No legacy table modifications.
-- A bank transfer reference may close at most one agent payout.
begin;
create unique index if not exists agent_paid_bank_ref_unique_v1
on public.agent_payouts ((lower(btrim(transfer_reference))))
where status='paid' and transfer_reference is not null;
commit;
