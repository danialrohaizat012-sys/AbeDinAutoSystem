-- Agent leads: independent read receipts, and per-vehicle indicative commission offer.
-- Existing lead, sale and payment rows remain untouched.
begin;
alter table public.agent_leads
 add column if not exists agent_read_at timestamptz,
 add column if not exists owner_read_at timestamptz;
alter table public.catalogue_direct_inquiries
 add column if not exists owner_read_at timestamptz;

create table if not exists public.agent_vehicle_commission_offers(
 vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
 category text not null check(category in ('standard','premium','special')),
 indicative_amount numeric(12,2) not null check(indicative_amount>=0 and indicative_amount<=100000),
 active boolean not null default true,
 updated_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default now()
);
alter table public.agent_vehicle_commission_offers enable row level security;
revoke all on public.agent_vehicle_commission_offers from public,anon,authenticated;
grant select,insert,update on public.agent_vehicle_commission_offers to service_role;

create or replace function public.agent_mark_own_lead_read_v1(p_lead uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_lead uuid; v_owner_at timestamptz; v_agent_at timestamptz;
begin
 if v_user is null then
   raise exception 'Login required' using errcode='42501';
 end if;
 update public.agent_leads l
 set agent_read_at=coalesce(l.agent_read_at,now())
 where l.id=p_lead and exists (
   select 1 from public.agent_profiles a
   where a.id=l.agent_id and a.user_id=v_user and a.status='active'
 )
 returning l.id,l.agent_read_at,l.owner_read_at into v_lead,v_agent_at,v_owner_at;
 if v_lead is null then
   raise exception 'Lead is not owned by active agent' using errcode='42501';
 end if;
 return jsonb_build_object('id',v_lead,'agent_read_at',v_agent_at,'owner_read_at',v_owner_at);
end $$;
revoke all on function public.agent_mark_own_lead_read_v1(uuid) from public,anon,authenticated;
grant execute on function public.agent_mark_own_lead_read_v1(uuid) to authenticated;
commit;