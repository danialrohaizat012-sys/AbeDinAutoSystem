-- STAGING ONLY. Owner-confirmed lead attribution to existing car sales.
-- Run AFTER agent_network_v1.sql and agent_admin_review_v1.sql.
-- Changes new agent_* tables only. Reads legacy sales/customers/vehicles; no writes.
begin;

-- Exactly one agent can claim a car sale. Cancel/reassignment must be audited
-- and deliberately handled in a separate future process, not silent overwrites.
create unique index if not exists agent_commissions_one_agent_per_sale_v1
 on public.agent_commissions(sale_id);

create or replace function agent_internal.link_agent_lead_to_sale_v1(
  p_actor uuid,
  p_lead uuid,
  p_sale uuid,
  p_evidence_reason text
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_lead public.agent_leads%rowtype;
  v_sale public.sales%rowtype;
  v_customer_phone text;
  v_lead_phone text;
  v_reason text := nullif(btrim(p_evidence_reason),'');
begin
  if p_actor is null or p_lead is null or p_sale is null
    or v_reason is null or char_length(v_reason) < 15
    or char_length(v_reason) > 500 then
    raise exception 'Valid attribution evidence is required' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id=p_actor and p.enabled is true and p.role::text='owner'
  ) then
    raise exception 'Owner authorization required' using errcode='42501';
  end if;

  select * into v_lead
  from public.agent_leads where id=p_lead for update;
  if not found then
    raise exception 'Lead not found' using errcode='P0002';
  end if;
  if v_lead.linked_sale_id is not null
    or v_lead.status in ('lost','cancelled','won') then
    raise exception 'Lead is already linked or closed' using errcode='23514';
  end if;
  if not exists (
    select 1 from public.agent_profiles a
    where a.id=v_lead.agent_id and a.status='active'
  ) then
    raise exception 'Agent is inactive' using errcode='23514';
  end if;

  -- Read and lock existing sale for consistency, without altering it.
  select * into v_sale
  from public.sales where id=p_sale for share;
  if not found then
    raise exception 'Sale not found' using errcode='P0002';
  end if;
  if v_sale.status not in ('reserved','sold') then
    raise exception 'Sale state not eligible for attribution' using errcode='23514';
  end if;
  if v_lead.vehicle_id is null or v_lead.vehicle_id<>v_sale.vehicle_id then
    raise exception 'Vehicle mismatch' using errcode='23514';
  end if;
  if exists (
    select 1 from public.agent_leads l
    where l.linked_sale_id=p_sale and l.id<>p_lead
  ) then
    raise exception 'Sale is already attributed to another agent' using errcode='23505';
  end if;

  -- Fail closed: compare verified customer contact with the original
  -- customer record, not just the vehicle. Malaysia 60/0 prefix normalized.
  select regexp_replace(coalesce(c.phone,''),'[^0-9]','','g')
    into v_customer_phone
  from public.customers c where c.id=v_sale.customer_id;
  v_lead_phone := regexp_replace(coalesce(v_lead.customer_phone,''),'[^0-9]','','g');
  if left(v_customer_phone,2)='60' then
    v_customer_phone := '0'||substr(v_customer_phone,3);
  end if;
  if left(v_lead_phone,2)='60' then
    v_lead_phone := '0'||substr(v_lead_phone,3);
  end if;
  if v_customer_phone is null or char_length(v_customer_phone) < 9
    or v_customer_phone <> v_lead_phone then
    raise exception 'Customer identity mismatch; manual dispute review required'
      using errcode='23514';
  end if;

  update public.agent_leads
    set linked_sale_id=p_sale,
        status=case when v_sale.status='sold' then 'won'
                    when status='new' then 'booking'
                    else status end,
        updated_at=now()
  where id=p_lead;
  insert into public.agent_audit_events(
    actor_user_id,entity_type,entity_id,action,reason
  ) values (
    p_actor,'agent_lead',p_lead,'link_sale',
    left(v_reason,500) || ' | sale_id=' || p_sale::text
  );

  return jsonb_build_object(
    'lead_id',p_lead,'sale_id',p_sale,'status','linked','agent_id',v_lead.agent_id
  );
end; $$;

revoke all on function agent_internal.link_agent_lead_to_sale_v1(uuid,uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function agent_internal.link_agent_lead_to_sale_v1(uuid,uuid,uuid,text)
 to service_role;

create or replace function public.agent_link_lead_gateway_v1(
 p_actor uuid,p_lead uuid,p_sale uuid,p_evidence_reason text
) returns jsonb
language sql security invoker set search_path=''
as $$
 select agent_internal.link_agent_lead_to_sale_v1(p_actor,p_lead,p_sale,p_evidence_reason);
$$;
revoke all on function public.agent_link_lead_gateway_v1(uuid,uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.agent_link_lead_gateway_v1(uuid,uuid,uuid,text)
 to service_role;
commit;

-- Integration requirements:
-- The server must verify requester JWT and supply p_actor from trusted identity.
-- Before linking, owner verifies customer consent with documented evidence.
-- Unmatched mobile numbers require dispute review, NOT an insecure bypass.
-- A database transaction rollback leaves original sales/customers unchanged.
