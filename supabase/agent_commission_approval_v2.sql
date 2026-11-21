-- Owner-only commission approval; STAGING-FIRST migration.
-- Never updates original sales, payments, customers, vehicles or staff.
-- A full_payment record alone does NOT prove external bank settlement:
-- owner must inspect reconciliation and attest to it.
begin;
create or replace function agent_internal.approve_agent_commission_v2(
 p_actor uuid,p_lead uuid,p_amount numeric,p_reason text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_lead public.agent_leads%rowtype;
 v_sale public.sales%rowtype;
 v_total numeric(14,2);
 v_full boolean;
 v_bad_count bigint;
 v_commission uuid;
begin
 if p_actor is null or p_lead is null or p_amount is null
   or p_amount <= 0 or p_amount > 100000
   or p_amount <> round(p_amount,2)
   or char_length(btrim(coalesce(p_reason,''))) < 20 then
   raise exception 'Invalid amount or missing financial review reason' using errcode='22023';
 end if;
 if not exists (
   select 1 from public.profiles p
   where p.id=p_actor and p.enabled is true and p.role::text='owner'
 ) then
   raise exception 'Enabled owner required' using errcode='42501';
 end if;
 select * into v_lead from public.agent_leads where id=p_lead for update;
 if not found or v_lead.linked_sale_id is null or v_lead.status <> 'won' then
   raise exception 'Lead must be linked to completed sale' using errcode='23514';
 end if;
 if not exists (
   select 1 from public.agent_profiles a
   where a.id=v_lead.agent_id and a.status='active'
 ) then
   raise exception 'Agent must be active' using errcode='23514';
 end if;
 select * into v_sale from public.sales where id=v_lead.linked_sale_id for share;
 if not found or v_sale.status <> 'sold' or v_sale.sold_at is null
   or v_sale.vehicle_id <> v_lead.vehicle_id then
   raise exception 'Completed sale mismatch' using errcode='23514';
 end if;
 select coalesce(sum(p.amount),0),
        coalesce(bool_or(p.kind::text='full_payment'),false),
        count(*) filter(where p.amount <= 0
          or nullif(btrim(p.reference_no),'') is null
          or p.confirmed_by is null or p.confirmed_at is null)
 into v_total,v_full,v_bad_count from public.payments p where p.sale_id=v_sale.id;
 if not v_full or v_bad_count > 0 or v_total < v_sale.agreed_price then
   raise exception 'Confirmed sale payments are insufficient' using errcode='23514';
 end if;
 if exists (select 1 from public.agent_commissions c where c.sale_id=v_sale.id) then
   raise exception 'A commission is already assigned to this sale' using errcode='23505';
 end if;
 insert into public.agent_commissions
  (agent_id,lead_id,sale_id,agreed_amount,status,approved_at,approved_by)
 values(v_lead.agent_id,v_lead.id,v_sale.id,p_amount,'approved',now(),p_actor)
 returning id into v_commission;
 insert into public.agent_audit_events
  (actor_user_id,entity_type,entity_id,action,reason)
 values(p_actor,'agent_commission',v_commission,'approve',
   left(btrim(p_reason),2000));
 return jsonb_build_object('commission_id',v_commission,'status','approved',
   'amount',p_amount,'agent_id',v_lead.agent_id);
end $$;
revoke all on function agent_internal.approve_agent_commission_v2(uuid,uuid,numeric,text)
 from public,anon,authenticated;
grant execute on function agent_internal.approve_agent_commission_v2(uuid,uuid,numeric,text)
 to service_role;
create or replace function public.agent_approve_commission_gateway_v2(
 p_actor uuid,p_lead uuid,p_amount numeric,p_reason text
) returns jsonb language sql security invoker set search_path=''
as $$
 select agent_internal.approve_agent_commission_v2(p_actor,p_lead,p_amount,p_reason);
$$;
revoke all on function public.agent_approve_commission_gateway_v2(uuid,uuid,numeric,text)
 from public,anon,authenticated;
grant execute on function public.agent_approve_commission_gateway_v2(uuid,uuid,numeric,text)
 to service_role;
commit;
