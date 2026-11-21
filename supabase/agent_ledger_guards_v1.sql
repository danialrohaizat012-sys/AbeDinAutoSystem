-- STAGING ONLY: V1 agent ledger safeguards.
-- Applies ONLY to new agent_* tables; never alters original sales/payments/vehicles.
-- Preconditions: agent_network_v1.sql, agent_admin_review_v1.sql,
-- agent_payout_invariants_v1.sql have passed staging review.
begin;
create or replace function agent_internal.guard_payout_items_v1()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
 v_old_status text;
 v_new_status text;
begin
 if tg_op in ('UPDATE','DELETE') then
   select status into v_old_status
     from public.agent_payouts where id=old.payout_id for update;
   if v_old_status is distinct from 'draft' then
     raise exception 'Finalized payout items are immutable' using errcode='23514';
   end if;
 end if;
 if tg_op='UPDATE' then
   if new.commission_id is distinct from old.commission_id
      or new.payout_id is distinct from old.payout_id then
     raise exception 'Cannot reassign a payout item' using errcode='23514';
   end if;
 end if;
 if tg_op in ('INSERT','UPDATE') then
   select status into v_new_status
     from public.agent_payouts where id=new.payout_id for update;
   if v_new_status is distinct from 'draft' then
     raise exception 'Only draft payout can be edited' using errcode='23514';
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end; $$;
drop trigger if exists agent_payout_items_immutable_v1 on public.agent_payout_items;
create trigger agent_payout_items_immutable_v1
before insert or update or delete on public.agent_payout_items
for each row execute function agent_internal.guard_payout_items_v1();

create or replace function agent_internal.guard_commission_ledger_v1()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='DELETE' then
   raise exception 'Commission ledger deletion prohibited; use audited reversal' using errcode='23514';
 end if;
 if tg_op='UPDATE' then
   if new.agent_id is distinct from old.agent_id
      or new.sale_id is distinct from old.sale_id
      or new.lead_id is distinct from old.lead_id
      or new.rule_id is distinct from old.rule_id
      or new.agreed_amount is distinct from old.agreed_amount then
     raise exception 'Commission snapshot is immutable' using errcode='23514';
   end if;
   if old.status='paid' then
     raise exception 'Paid commission is immutable; use a separate audited adjustment' using errcode='23514';
   end if;
   if exists (select 1 from public.agent_payout_items i where i.commission_id=old.id)
      and new.status <> old.status and new.status <> 'paid' then
     raise exception 'Payout-linked commission status locked' using errcode='23514';
   end if;
   if new.status <> old.status and not (
     (old.status='pending' and new.status in ('eligible','cancelled')) or
     (old.status='eligible' and new.status in ('approved','cancelled')) or
     (old.status='approved' and new.status in ('paid','cancelled'))
   ) then
     raise exception 'Invalid commission status transition' using errcode='23514';
   end if;
   if new.status='approved' and (new.approved_by is null or new.approved_at is null) then
     raise exception 'Approval evidence required' using errcode='23514';
   end if;
 end if;
 return new;
end; $$;
drop trigger if exists agent_commission_ledger_guard_v1 on public.agent_commissions;
create trigger agent_commission_ledger_guard_v1
before update or delete on public.agent_commissions
for each row execute function agent_internal.guard_commission_ledger_v1();

revoke all on function agent_internal.guard_payout_items_v1() from public,anon,authenticated;
revoke all on function agent_internal.guard_commission_ledger_v1() from public,anon,authenticated;
commit;

-- Production release blockers:
-- 1. A finalization RPC must lock payout and commission rows consistently.
-- 2. Verify bank transfer before marking paid.
-- 3. Audit all reversal actions, including post-sale cost changes.
-- 4. Define handling for cancelled commissions already in a draft payout.
-- 5. Test same-transaction multi-row operations on isolated staging database.
