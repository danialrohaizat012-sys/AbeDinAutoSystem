-- V127: Skrin pengesah HR — sahkan bayaran komisen ejen (rujukan pindahan bank)
-- Pengesah = public.agent_payout_verifiers (enabled). Pengesah tidak boleh orang yang sama yang meluluskan payout.

create or replace function public.agent_hr_payouts_v1()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_verifier boolean; v_owner boolean;
begin
  select exists (select 1 from agent_payout_verifiers v join profiles p on p.id = v.user_id
                 where v.user_id = v_uid and v.enabled is true and p.enabled is true) into v_verifier;
  select exists (select 1 from profiles p where p.id = v_uid and p.enabled is true and p.role::text = 'owner') into v_owner;
  if not (v_verifier or v_owner) then
    raise exception 'Bukan pengesah bayaran ejen.' using errcode = '42501';
  end if;
  return jsonb_build_object('verifier', v_verifier, 'me', v_uid, 'payouts', coalesce((
    select jsonb_agg(r order by r.status = 'paid', r.created_at desc) from (
      select o.id, o.amount, o.status, o.transfer_reference, o.paid_at, o.created_at, o.approved_by,
             (select full_name from profiles where id = o.approved_by) approved_by_name,
             ap.agent_code,
             coalesce(nullif(d.display_name,''), a.full_name) agent_name,
             coalesce(nullif(d.phone,''), a.phone) agent_phone,
             d.bank_name, d.bank_account_no, d.bank_account_holder,
             (select jsonb_agg(jsonb_build_object('plate', v.plate, 'car', trim(coalesce(v.make,'') || ' ' || coalesce(v.model,'')), 'customer', cu.full_name, 'amount', i.amount))
                from agent_payout_items i join agent_commissions c on c.id = i.commission_id
                left join sales s on s.id = c.sale_id left join vehicles v on v.id = s.vehicle_id left join customers cu on cu.id = s.customer_id
               where i.payout_id = o.id) items
      from agent_payouts o
      join agent_profiles ap on ap.id = o.agent_id
      left join agent_applications a on a.id = ap.application_id
      left join agent_account_details d on d.user_id = ap.user_id
      where o.status = 'approved' or (o.status = 'paid' and o.paid_at > now() - interval '60 days')
      limit 200) r), '[]'::jsonb));
end $$;

create or replace function public.agent_hr_confirm_payout_v1(p_payout uuid, p_transfer_reference text, p_paid_at timestamptz)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  return agent_internal.confirm_agent_payout_v1(auth.uid(), p_payout, p_transfer_reference, p_paid_at);
end $$;

revoke all on function public.agent_hr_payouts_v1() from public, anon;
revoke all on function public.agent_hr_confirm_payout_v1(uuid, text, timestamptz) from public, anon;
grant execute on function public.agent_hr_payouts_v1() to authenticated;
grant execute on function public.agent_hr_confirm_payout_v1(uuid, text, timestamptz) to authenticated;
