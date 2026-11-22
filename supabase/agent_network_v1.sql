-- AbeDin Auto Agent Network V1 (STAGED ONLY)
-- Target: Supabase project buzpdyvvoiqgbeventwm (sales/vehicles).
-- DO NOT run on the rental project or production without review.
-- No existing table is altered. No customer IC or bank details are stored here.
-- Admin mutations must run in an authenticated, audited server-side service workflow.
begin;

create table if not exists public.agent_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 3 and 160),
  phone text not null check (char_length(trim(phone)) between 9 and 24),
  email text not null check (char_length(trim(email)) between 5 and 254),
  state text not null check (char_length(trim(state)) between 2 and 80),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text,
  check ((status = 'pending' and reviewed_at is null and reviewed_by is null) or status <> 'pending')
);

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  application_id uuid not null unique references public.agent_applications(id),
  agent_code text not null unique check (agent_code ~ '^ADA-AG-[0-9]{4,}$'),
  status text not null default 'active' check (status in ('active','suspended','terminated')),
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id),
  vehicle_id uuid references public.vehicles(id),
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 160),
  customer_phone text not null check (char_length(trim(customer_phone)) between 9 and 24),
  consent_confirmed boolean not null default false check (consent_confirmed = true),
  status text not null default 'new' check (status in ('new','contacted','booking','loan','won','lost','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  linked_sale_id uuid unique references public.sales(id)
);

create table if not exists public.agent_commission_rules (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_profiles(id),
  vehicle_id uuid references public.vehicles(id),
  method text not null check (method in ('fixed','sale_percent','net_profit_percent')),
  amount numeric(14,2) not null check (amount >= 0),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from),
  check (method = 'fixed' or amount <= 100)
);

create table if not exists public.agent_commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id),
  lead_id uuid references public.agent_leads(id),
  sale_id uuid not null references public.sales(id),
  rule_id uuid references public.agent_commission_rules(id),
  agreed_amount numeric(14,2) not null check (agreed_amount >= 0),
  status text not null default 'pending' check (status in ('pending','eligible','approved','paid','cancelled')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  unique(sale_id, agent_id),
  check (status <> 'approved' or approved_at is not null)
);

create table if not exists public.agent_payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'draft' check (status in ('draft','approved','paid','void')),
  transfer_reference text,
  paid_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (status <> 'paid' or (paid_at is not null and transfer_reference is not null))
);

create table if not exists public.agent_payout_items (
  payout_id uuid not null references public.agent_payouts(id) on delete restrict,
  commission_id uuid not null unique references public.agent_commissions(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  primary key(payout_id,commission_id)
);

create table if not exists public.agent_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  reason text,
  recorded_at timestamptz not null default now()
);

create index if not exists agent_leads_agent_created_idx on public.agent_leads(agent_id,created_at desc);
create index if not exists agent_leads_vehicle_idx on public.agent_leads(vehicle_id);
create index if not exists agent_commissions_agent_status_idx on public.agent_commissions(agent_id,status);
create index if not exists agent_commissions_sale_idx on public.agent_commissions(sale_id);
create index if not exists agent_payouts_agent_idx on public.agent_payouts(agent_id,created_at desc);
create index if not exists agent_rules_agent_vehicle_idx on public.agent_commission_rules(agent_id,vehicle_id);

alter table public.agent_applications enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.agent_leads enable row level security;
alter table public.agent_commission_rules enable row level security;
alter table public.agent_commissions enable row level security;
alter table public.agent_payouts enable row level security;
alter table public.agent_payout_items enable row level security;
alter table public.agent_audit_events enable row level security;

-- Explicitly remove automatic/default API grants first.
revoke all on public.agent_applications, public.agent_profiles, public.agent_leads,
 public.agent_commission_rules, public.agent_commissions, public.agent_payouts,
 public.agent_payout_items, public.agent_audit_events from anon, authenticated;

grant select, insert on public.agent_applications to authenticated;
grant select on public.agent_profiles to authenticated;
grant select, insert on public.agent_leads to authenticated;
grant select on public.agent_commissions, public.agent_payouts, public.agent_payout_items to authenticated;

create policy agent_application_read_own on public.agent_applications
 for select to authenticated using ((select auth.uid()) = user_id);
create policy agent_application_create_own on public.agent_applications
 for insert to authenticated with check (
  (select auth.uid()) = user_id and status = 'pending'
  and reviewed_at is null and reviewed_by is null and review_note is null
 );
create policy agent_profile_read_own on public.agent_profiles
 for select to authenticated using ((select auth.uid()) = user_id);
create policy agent_leads_read_own on public.agent_leads
 for select to authenticated using (
  exists (select 1 from public.agent_profiles a
          where a.id=agent_id and a.user_id=(select auth.uid()))
 );
create policy agent_leads_create_own on public.agent_leads
 for insert to authenticated with check (
  status='new' and linked_sale_id is null
  and exists (select 1 from public.agent_profiles a
              where a.id=agent_id and a.user_id=(select auth.uid()) and a.status='active')
 );
create policy agent_commissions_read_own on public.agent_commissions
 for select to authenticated using (
  exists (select 1 from public.agent_profiles a where a.id=agent_id and a.user_id=(select auth.uid()))
 );
create policy agent_payouts_read_own on public.agent_payouts
 for select to authenticated using (
  exists (select 1 from public.agent_profiles a where a.id=agent_id and a.user_id=(select auth.uid()))
 );
create policy agent_payout_items_read_own on public.agent_payout_items
 for select to authenticated using (
  exists (select 1 from public.agent_payouts p
   join public.agent_profiles a on a.id=p.agent_id
   where p.id=payout_id and a.user_id=(select auth.uid()))
 );
-- No client write policy for agent_profiles, rules, commissions, payouts, items, or audit.
-- No authenticated client access to agent_commission_rules or agent_audit_events.
-- The server must verify all payout-item agent matches, commission eligibility,
-- payout totals and unique sale attribution inside a single DB transaction.
commit;
