-- STAGING ONLY: Atomic payout reconciliation and finalization.
-- Must NOT be applied to production before isolated staging tests.
-- Depends on agent_network_v1.sql, agent_admin_review_v1.sql,
-- agent_payout_invariants_v1.sql, agent_ledger_guards_v1.sql.
-- NEVER initiates a real transfer. Owner confirms bank settlement separately.
begin;

create or replace function agent_internal.confirm_agent_payout_v1(
 p_actor uuid, p_payout uuid, p_transfer_reference text, p_bank_paid_at timestamptz
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
 v_payout public.agent_payouts%rowtype;
 v_commission record;
 v_total numeric(14,2) := 0;
 v_count integer := 0;
 v_reference text := nullif(btrim(p_transfer_reference),'');
begin
 if p_actor is null or p_payout is null or v_reference is null
    or char_length(v_reference)>120 or p_bank_paid_at is null
    or p_bank_paid_at > now() + interval '5 minutes' then
    raise exception 'Invalid bank settlement evidence' using errcode='22023';
 end if;
 if not exists (
   select 1 from public.profiles p
   where p.id=p_actor and p.enabled is true and p.role::text='owner'
 ) then
   raise exception 'Owner authorization required' using errcode='42501';
 end if;

 -- Lock the payout before commissions, consistently with item validation.
 select * into v_payout from public.agent_payouts where id=p_payout for update;
 if not found then
   raise exception 'Payout not found' using errcode='P0002';
 end if;
 if v_payout.status <> 'approved' then
   raise exception 'Payout must be approved and unpaid' using errcode='23514';
 end if;
 if v_payout.approved_by is null or v_payout.approved_by = p_actor then
   raise exception 'Separate approval and confirmation actors required' using errcode='42501';
 end if;

 -- Lock all attached commissions in deterministic order; uniqueness of
 -- agent_payout_items.commission_id prevents duplicate payout allocation.
 for v_commission in
   select c.id,c.agent_id,c.agreed_amount,c.status,i.amount as item_amount
   from public.agent_payout_items i
   join public.agent_commissions c on c.id=i.commission_id
   where i.payout_id=p_payout order by c.id
   for update of c
 loop
   if v_commission.agent_id <> v_payout.agent_id
      or v_commission.status <> 'approved'
      or v_commission.item_amount <> v_commission.agreed_amount then
      raise exception 'Commission ownership, amount or status invalid' using errcode='23514';
   end if;
   v_total := v_total + v_commission.item_amount;
   v_count := v_count + 1;
 end loop;
 if v_count=0 or v_total <> v_payout.amount then
   raise exception 'Payout does not match its commission items' using errcode='23514';
 end if;

 -- Existing guards enforce allowed transitions and immutable financial data.
 update public.agent_payouts
 set status='paid', transfer_reference=v_reference, paid_at=p_bank_paid_at
 where id=p_payout and status='approved';
 update public.agent_commissions c
 set status='paid'
 from public.agent_payout_items i
 where i.payout_id=p_payout and i.commission_id=c.id and c.status='approved';
 insert into public.agent_audit_events(actor_user_id,entity_type,entity_id,action,reason)
 values (p_actor,'agent_payout',p_payout,'mark_paid',
         'Owner confirmed external bank settlement; reference=' || v_reference);

 return jsonb_build_object('payout_id',p_payout,'status','paid',
                           'commission_count',v_count,'amount',v_total);
end; $$;
revoke all on function agent_internal.confirm_agent_payout_v1(uuid,uuid,text,timestamptz)
 from public,anon,authenticated;
grant execute on function agent_internal.confirm_agent_payout_v1(uuid,uuid,text,timestamptz)
 to service_role;

-- Service-role gateway only. The backend MUST authenticate the owner and
-- derive p_actor from the verified JWT, never from client-supplied request body.
create or replace function public.agent_confirm_payout_gateway_v1(
 p_actor uuid,p_payout uuid,p_transfer_reference text,p_bank_paid_at timestamptz
) returns jsonb language sql security invoker set search_path=''
as $$
 select agent_internal.confirm_agent_payout_v1(p_actor,p_payout,p_transfer_reference,p_bank_paid_at);
$$;
revoke all on function public.agent_confirm_payout_gateway_v1(uuid,uuid,text,timestamptz)
 from public,anon,authenticated;
grant execute on function public.agent_confirm_payout_gateway_v1(uuid,uuid,text,timestamptz)
 to service_role;
commit;

-- RELEASE BLOCKERS:
-- An authenticated owner-only Edge Function must verify the transfer with
-- independent bank evidence and use the JWT user ID as p_actor.
-- Duplicate transfer-reference policies and business reconciliation must be
-- specified and tested; text reference alone does not prove a bank transfer.
-- Confirm cross-agent security and lock contention in an isolated database.
