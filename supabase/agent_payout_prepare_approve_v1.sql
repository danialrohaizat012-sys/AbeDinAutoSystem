-- Owner-only preparation and approval of agent payout.
-- No bank transfer is initiated. Only a second, different owner can confirm
-- bank settlement using the existing confirm_agent_payout_v1 function.
begin;
create or replace function agent_internal.prepare_agent_payout_v1(
 p_actor uuid,p_commission uuid,p_reason text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_commission public.agent_commissions%rowtype;v_payout uuid;
begin
 if p_actor is null or p_commission is null or char_length(btrim(coalesce(p_reason,'')))<15 then
   raise exception 'Payout preparation reason required' using errcode='22023';
 end if;
 if not exists(select 1 from public.profiles
               where id=p_actor and enabled is true and role::text='owner') then
   raise exception 'Only enabled owner may prepare payout' using errcode='42501';
 end if;
 select * into v_commission from public.agent_commissions
 where id=p_commission for update;
 if not found or v_commission.status<>'approved' then
   raise exception 'Approved commission required' using errcode='23514';
 end if;
 if exists(select 1 from public.agent_payout_items where commission_id=p_commission) then
   raise exception 'Commission already allocated to payout' using errcode='23505';
 end if;
 insert into public.agent_payouts(agent_id,amount)
 values(v_commission.agent_id,v_commission.agreed_amount) returning id into v_payout;
 insert into public.agent_payout_items(payout_id,commission_id,amount)
 values(v_payout,v_commission.id,v_commission.agreed_amount);
 insert into public.agent_audit_events(actor_user_id,entity_type,entity_id,action,reason)
 values(p_actor,'agent_payout',v_payout,'prepare',left(btrim(p_reason),2000));
 return jsonb_build_object('payout_id',v_payout,'status','draft','amount',v_commission.agreed_amount);
end $$;
create or replace function agent_internal.approve_agent_payout_v1(
 p_actor uuid,p_payout uuid,p_reason text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_payout public.agent_payouts%rowtype;
begin
 if p_actor is null or p_payout is null or char_length(btrim(coalesce(p_reason,'')))<15 then
   raise exception 'Payout approval reason required' using errcode='22023';
 end if;
 if not exists(select 1 from public.profiles
               where id=p_actor and enabled is true and role::text='owner') then
   raise exception 'Only enabled owner may approve payout' using errcode='42501';
 end if;
 select * into v_payout from public.agent_payouts where id=p_payout for update;
 if not found or v_payout.status<>'draft' then
   raise exception 'Draft payout required' using errcode='23514';
 end if;
 update public.agent_payouts set status='approved',approved_by=p_actor where id=p_payout;
 insert into public.agent_audit_events(actor_user_id,entity_type,entity_id,action,reason)
 values(p_actor,'agent_payout',p_payout,'approve',left(btrim(p_reason),2000));
 return jsonb_build_object('payout_id',p_payout,'status','approved','amount',v_payout.amount);
end $$;
revoke all on function agent_internal.prepare_agent_payout_v1(uuid,uuid,text)
 from public,anon,authenticated;
revoke all on function agent_internal.approve_agent_payout_v1(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function agent_internal.prepare_agent_payout_v1(uuid,uuid,text) to service_role;
grant execute on function agent_internal.approve_agent_payout_v1(uuid,uuid,text) to service_role;

create or replace function public.agent_prepare_payout_gateway_v1(
 p_actor uuid,p_commission uuid,p_reason text
) returns jsonb language sql security invoker set search_path=''
as $$ select agent_internal.prepare_agent_payout_v1(p_actor,p_commission,p_reason); $$;
create or replace function public.agent_approve_payout_gateway_v1(
 p_actor uuid,p_payout uuid,p_reason text
) returns jsonb language sql security invoker set search_path=''
as $$ select agent_internal.approve_agent_payout_v1(p_actor,p_payout,p_reason); $$;
revoke all on function public.agent_prepare_payout_gateway_v1(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.agent_approve_payout_gateway_v1(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.agent_prepare_payout_gateway_v1(uuid,uuid,text) to service_role;
grant execute on function public.agent_approve_payout_gateway_v1(uuid,uuid,text) to service_role;
commit;
