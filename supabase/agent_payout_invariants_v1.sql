-- Agent Network payout invariants: STAGING PROPOSAL, NOT APPLIED.
-- Run only after agent_network_v1.sql in an isolated test database.
-- Protects new agent_* tables only. Does not modify original AbeDin Auto data.
begin;

create or replace function agent_internal.validate_payout_item_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_payout public.agent_payouts%rowtype;
  v_commission public.agent_commissions%rowtype;
begin
  select * into v_payout from public.agent_payouts where id=new.payout_id for update;
  if not found then
    raise exception 'Payout not found' using errcode='23503';
  end if;
  if v_payout.status <> 'draft' then
    raise exception 'Cannot edit a finalized payout' using errcode='23514';
  end if;
  select * into v_commission from public.agent_commissions where id=new.commission_id for update;
  if not found then
    raise exception 'Commission not found' using errcode='23503';
  end if;
  if v_payout.agent_id <> v_commission.agent_id then
    raise exception 'Cross-agent payout prohibited' using errcode='23514';
  end if;
  if v_commission.status <> 'approved' then
    raise exception 'Commission is not approved' using errcode='23514';
  end if;
  if v_commission.agreed_amount <> new.amount then
    raise exception 'Commission amount mismatch' using errcode='23514';
  end if;
  return new;
end; $$;

drop trigger if exists agent_payout_item_validation_v1 on public.agent_payout_items;
create trigger agent_payout_item_validation_v1
before insert or update on public.agent_payout_items
for each row execute function agent_internal.validate_payout_item_v1();

create or replace function agent_internal.validate_payout_status_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_total numeric(14,2);
  v_count bigint;
begin
  if tg_op='UPDATE' then
    if old.status = 'paid' then
      raise exception 'Paid payout must not be modified' using errcode='23514';
    end if;
    if old.status = 'void' then
      raise exception 'Void payout must not be modified' using errcode='23514';
    end if;
  end if;
  if new.status in ('approved','paid') then
    select coalesce(sum(i.amount),0), count(*) into v_total,v_count
    from public.agent_payout_items i where i.payout_id=new.id;
    if v_count=0 or v_total<>new.amount then
      raise exception 'Payout total mismatch' using errcode='23514';
    end if;
    if new.approved_by is null then
      raise exception 'Payout needs an approver' using errcode='23514';
    end if;
  end if;
  if new.status='paid' then
    if tg_op<>'UPDATE' or old.status<>'approved' then
      raise exception 'Payout must be approved before payment' using errcode='23514';
    end if;
    if new.paid_at is null or nullif(btrim(new.transfer_reference),'') is null then
      raise exception 'Payment date and reference are required' using errcode='23514';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists agent_payout_status_validation_v1 on public.agent_payouts;
create trigger agent_payout_status_validation_v1
before update on public.agent_payouts
for each row execute function agent_internal.validate_payout_status_v1();

revoke all on function agent_internal.validate_payout_item_v1() from public,anon,authenticated;
revoke all on function agent_internal.validate_payout_status_v1() from public,anon,authenticated;
commit;

-- Remaining server workflow MUST:
-- 1. Lock every commission and payout row before writes, avoid deadlocks via ordering.
-- 2. Insert payout items only when commission status=approved.
-- 3. Finalize payout and commission statuses atomically in one transaction.
-- 4. Reconcile bank transfer outside DB; never infer transfer success from a client click.
-- 5. Use separate owner approval, idempotency keys and immutable audit events.
