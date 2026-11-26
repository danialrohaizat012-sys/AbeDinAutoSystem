-- V125: Komisen ejen manual (ejen jual tanpa link)
-- Owner pilih ejen + jualan kereta (sold) → sistem cipta rekod lead "won" yang dipautkan terus kepada jualan,
-- luluskan komisen (automatik jadi kos kereta melalui trigger komisen → untung rugi tepat),
-- dan (pilihan) terus sediakan + luluskan payout. Pengesahan bayaran bank kekal oleh pengesah HR yang berasingan.

create or replace function agent_internal.manual_agent_commission_v1(
  p_actor uuid, p_agent uuid, p_sale uuid, p_amount numeric, p_reason text, p_prepare boolean default true)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_agent public.agent_profiles%rowtype; v_sale public.sales%rowtype; v_cust record;
  v_total numeric(14,2); v_count bigint; v_unique bigint; v_bad bigint;
  v_lead uuid; v_commission uuid; v_payout jsonb; v_reason text := btrim(coalesce(p_reason,''));
  v_phone text;
begin
  if p_actor is null or p_agent is null or p_sale is null or p_amount is null or p_amount <= 0 or p_amount > 100000
     or p_amount <> round(p_amount,2) or char_length(v_reason) < 20 then
    raise exception 'Amaun atau sebab tidak sah (sebab sekurang-kurangnya 20 aksara).' using errcode='22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id=p_actor and p.enabled is true and p.role::text='owner') then
    raise exception 'Hanya owner boleh merekod komisen manual.' using errcode='42501';
  end if;
  select * into v_agent from public.agent_profiles where id=p_agent;
  if not found or v_agent.status <> 'active' then
    raise exception 'Ejen tidak aktif.' using errcode='23514';
  end if;
  select * into v_sale from public.sales where id=p_sale for update;
  if not found or v_sale.status::text <> 'sold' or v_sale.sold_at is null then
    raise exception 'Jualan mesti berstatus SOLD.' using errcode='23514';
  end if;
  if exists (select 1 from public.agent_commissions c where c.sale_id=p_sale) then
    raise exception 'Jualan ini sudah ada komisen ejen.' using errcode='23505';
  end if;
  if exists (select 1 from public.agent_leads l where l.linked_sale_id=p_sale) then
    raise exception 'Jualan ini sudah dipautkan kepada lead ejen lain.' using errcode='23505';
  end if;
  select coalesce(sum(p.amount),0), count(*), count(distinct lower(btrim(p.reference_no))),
         count(*) filter (where p.amount <= 0 or nullif(btrim(p.reference_no),'') is null or p.confirmed_by is null or p.confirmed_at is null)
    into v_total, v_count, v_unique, v_bad
    from public.payments p where p.sale_id=p_sale;
  if v_count = 0 or v_total <= 0 or v_bad > 0 or v_count <> v_unique then
    raise exception 'Bayaran jualan belum lengkap / belum disahkan.' using errcode='23514';
  end if;

  select c.full_name, c.phone into v_cust from public.customers c where c.id=v_sale.customer_id;
  v_phone := coalesce(nullif(agent_internal.norm_phone(v_cust.phone),''), '000000000');
  if char_length(v_phone) < 9 then v_phone := rpad(v_phone, 9, '0'); end if;

  insert into public.agent_leads (agent_id, vehicle_id, customer_name, customer_phone, consent_confirmed, status,
                                  linked_sale_id, lead_source, referral_code_snapshot, created_at, updated_at, owner_read_at, agent_read_at)
  values (v_agent.id, v_sale.vehicle_id, left(coalesce(nullif(btrim(v_cust.full_name),''), 'Pelanggan jualan terus'), 160), left(v_phone, 24), true, 'won',
          p_sale, 'agent_manual', v_agent.agent_code, least(v_sale.created_at, now()), now(), now(), null)
  returning id into v_lead;
  insert into public.agent_audit_events (actor_user_id, entity_type, entity_id, action, reason)
  values (p_actor, 'agent_lead', v_lead, 'owner_manual_attribution', left('Komisen manual (jualan tanpa link): ' || v_reason, 2000) || ' | sale_id=' || p_sale::text);

  insert into public.agent_commissions (agent_id, lead_id, sale_id, agreed_amount, status, approved_at, approved_by)
  values (v_agent.id, v_lead, p_sale, p_amount, 'approved', now(), p_actor)
  returning id into v_commission;
  insert into public.agent_audit_events (actor_user_id, entity_type, entity_id, action, reason)
  values (p_actor, 'agent_commission', v_commission, 'approve_manual', left('Komisen manual: ' || v_reason, 2000));

  if coalesce(p_prepare, false) then
    v_payout := agent_internal.prepare_agent_payout_v1(p_actor, v_commission, 'Payout komisen manual: ' || v_reason);
    perform agent_internal.approve_agent_payout_v1(p_actor, (v_payout->>'payout_id')::uuid, 'Owner luluskan payout komisen manual: ' || v_reason);
  end if;

  return jsonb_build_object('lead_id', v_lead, 'commission_id', v_commission, 'amount', p_amount,
                            'payout_id', v_payout->>'payout_id', 'payout_status', case when v_payout is null then null else 'approved' end);
end $function$;

create or replace function public.agent_manual_commission_gateway_v1(
  p_actor uuid, p_agent uuid, p_sale uuid, p_amount numeric, p_reason text, p_prepare boolean default true)
 returns jsonb language sql set search_path to '' as $$
  select agent_internal.manual_agent_commission_v1(p_actor, p_agent, p_sale, p_amount, p_reason, p_prepare);
$$;

revoke all on function agent_internal.manual_agent_commission_v1(uuid, uuid, uuid, numeric, text, boolean) from public, anon, authenticated;
revoke all on function public.agent_manual_commission_gateway_v1(uuid, uuid, uuid, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.agent_manual_commission_gateway_v1(uuid, uuid, uuid, numeric, text, boolean) to service_role;
grant execute on function agent_internal.manual_agent_commission_v1(uuid, uuid, uuid, numeric, text, boolean) to service_role;
