-- Capture direct enquiries without pretending they belong to a commission agent.
-- Public cannot read personal details; owner can review through authenticated Edge Function.
begin;
create table if not exists public.catalogue_direct_inquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  customer_name text not null check(char_length(btrim(customer_name)) between 2 and 160),
  customer_phone text not null check(customer_phone ~ '^[0-9]{9,15}$'),
  consent_confirmed boolean not null check(consent_confirmed is true),
  source text not null default 'public_direct' check(source='public_direct'),
  status text not null default 'new' check(status in ('new','contacted','won','lost','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists catalogue_direct_inquiries_created_idx on public.catalogue_direct_inquiries(created_at desc);
alter table public.catalogue_direct_inquiries enable row level security;
revoke all on public.catalogue_direct_inquiries from public,anon,authenticated;

create or replace function agent_internal.submit_direct_public_inquiry_v1(
 p_public_vehicle_id text,p_customer_name text,p_customer_phone text,
 p_consent boolean,p_request_hash text
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_car public.vehicles%rowtype;
  v_phone text:=regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g');
  v_name text:=btrim(coalesce(p_customer_name,''));
  v_hour timestamptz:=date_trunc('hour',now());
  v_count integer;
  v_lead uuid;
begin
 if p_consent is not true or char_length(v_name) not between 2 and 160
   or v_phone !~ '^[0-9]{9,15}$'
   or char_length(coalesce(p_public_vehicle_id,'')) not between 1 and 80
   or coalesce(p_request_hash,'') !~ '^[0-9a-f]{64}$'
 then raise exception 'Invalid direct inquiry' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtext(p_request_hash));
 insert into public.agent_public_inquiry_limits(request_hash,window_started_at,attempt_count)
 values(p_request_hash,v_hour,1)
 on conflict(request_hash,window_started_at)
 do update set attempt_count=agent_public_inquiry_limits.attempt_count+1
 returning attempt_count into v_count;
 if v_count>6 then return jsonb_build_object('status','rate_limited'); end if;

 select * into v_car from public.vehicles
 where vehicle_id=p_public_vehicle_id and is_published=true
  and status::text='available' and catalogue_status='available';
 if not found then raise exception 'Car no longer available' using errcode='23514'; end if;

 perform pg_advisory_xact_lock(hashtext(v_car.id::text||':'||v_phone));
 if exists(
  select 1 from public.agent_leads l
  where l.vehicle_id=v_car.id and regexp_replace(l.customer_phone,'[^0-9]','','g')=v_phone
    and l.created_at>now()-interval '30 days'
 ) or exists(
  select 1 from public.catalogue_direct_inquiries d
  where d.vehicle_id=v_car.id and d.customer_phone=v_phone
    and d.created_at>now()-interval '30 days'
 ) then raise exception 'Customer already registered for car' using errcode='23505'; end if;
 insert into public.catalogue_direct_inquiries(vehicle_id,customer_name,customer_phone,consent_confirmed)
 values(v_car.id,v_name,v_phone,true) returning id into v_lead;
 return jsonb_build_object('lead_id',v_lead,'status','new','source','public_direct','vehicle_id',v_car.vehicle_id);
end $$;
revoke all on function agent_internal.submit_direct_public_inquiry_v1(text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function agent_internal.submit_direct_public_inquiry_v1(text,text,text,boolean,text) to service_role;

create or replace function public.agent_submit_direct_inquiry_gateway_v1(
 p_public_vehicle_id text,p_customer_name text,p_customer_phone text,
 p_consent boolean,p_request_hash text
) returns jsonb language sql security invoker set search_path=''
as $$
 select agent_internal.submit_direct_public_inquiry_v1(
 p_public_vehicle_id,p_customer_name,p_customer_phone,p_consent,p_request_hash);
$$;
revoke all on function public.agent_submit_direct_inquiry_gateway_v1(text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.agent_submit_direct_inquiry_gateway_v1(text,text,text,boolean,text) to service_role;
commit;