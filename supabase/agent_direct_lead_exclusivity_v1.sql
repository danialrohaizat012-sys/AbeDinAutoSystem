-- Prevent later agent referrals claiming existing buyer direct enquiries.
begin;
create or replace function agent_internal.submit_public_inquiry_v1(
 p_referral_code text, p_public_vehicle_id text, p_customer_name text,
 p_customer_phone text, p_consent boolean, p_request_hash text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_agent public.agent_profiles%rowtype;
 v_car public.vehicles%rowtype;
 v_phone text := regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g');
 v_name text := btrim(coalesce(p_customer_name,''));
 v_hour timestamptz := date_trunc('hour',now());
 v_count integer;
 v_duplicate uuid;
 v_lead uuid;
begin
 if p_consent is not true or v_name !~ '^[[:print:][:space:]]{2,160}$'
   or char_length(v_name)>160 or v_phone !~ '^[0-9]{9,15}$'
   or coalesce(p_referral_code,'') !~ '^ADA-AG-[0-9]{4,}$'
   or char_length(coalesce(p_referral_code,''))>30
   or char_length(coalesce(p_public_vehicle_id,''))>80
   or coalesce(p_request_hash,'') !~ '^[0-9a-f]{64}$' then
  raise exception 'Invalid inquiry information' using errcode='22023';
 end if;
 -- A deterministic row lock prevents concurrent duplicate submissions.
 perform pg_advisory_xact_lock(hashtext(p_request_hash));
 insert into public.agent_public_inquiry_limits(request_hash,window_started_at,attempt_count)
 values(p_request_hash,v_hour,1)
 on conflict(request_hash,window_started_at)
 do update set attempt_count=agent_public_inquiry_limits.attempt_count+1
 returning attempt_count into v_count;
 if v_count>6 then
  return jsonb_build_object('status','rate_limited');
 end if;
 select * into v_agent from public.agent_profiles
  where agent_code=p_referral_code and status='active';
 if not found then raise exception 'Agent not currently active' using errcode='23514'; end if;
 select * into v_car from public.vehicles
  where vehicle_id=p_public_vehicle_id and is_published=true
    and status::text='available' and catalogue_status='available';
 if not found then raise exception 'Car is no longer available' using errcode='23514'; end if;
 -- Lock by vehicle and normalized customer phone to prevent referral hijacking.
 perform pg_advisory_xact_lock(hashtext(v_car.id::text||':'||v_phone));
 select id into v_duplicate from public.agent_leads
 where vehicle_id=v_car.id and regexp_replace(customer_phone,'[^0-9]','','g')=v_phone
   and created_at>now()-interval '30 days'
 order by created_at asc limit 1;
 if v_duplicate is not null or exists(
   select 1 from public.catalogue_direct_inquiries d
   where d.vehicle_id=v_car.id and d.customer_phone=v_phone
    and d.created_at>now()-interval '30 days'
 ) then
   raise exception 'Inquiry already registered for this car. Contact AbeDin Auto' using errcode='23505';
 end if;
 insert into public.agent_leads
  (agent_id,vehicle_id,customer_name,customer_phone,consent_confirmed,status,
   lead_source,referral_code_snapshot)
 values(v_agent.id,v_car.id,v_name,v_phone,true,'new','public_referral',v_agent.agent_code)
 returning id into v_lead;
 insert into public.agent_audit_events(actor_user_id,entity_type,entity_id,action,reason)
 values(null,'agent_lead',v_lead,'public_inquiry',
 'Customer consented to contact from referral code '||v_agent.agent_code);
 return jsonb_build_object('lead_id',v_lead,'status','new',
  'agent_code',v_agent.agent_code,'vehicle_id',v_car.vehicle_id);
end $$;
revoke all on function agent_internal.submit_public_inquiry_v1(text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function agent_internal.submit_public_inquiry_v1(text,text,text,text,boolean,text) to service_role;
commit;
