-- Agent V20: enforce active membership at the database security boundary.
-- REVIEW AND TEST WITH TWO REAL AGENT ACCOUNTS IN STAGING BEFORE APPLYING.
-- No production execution is performed by committing this file.
begin;
drop policy if exists agent_leads_read_own on public.agent_leads;
create policy agent_leads_read_own on public.agent_leads
for select to authenticated
using (exists (
  select 1 from public.agent_profiles a
  where a.id = agent_leads.agent_id
    and a.user_id = (select auth.uid())
    and a.status = 'active'
));
drop policy if exists agent_commissions_read_own on public.agent_commissions;
create policy agent_commissions_read_own on public.agent_commissions
for select to authenticated
using (exists (
  select 1 from public.agent_profiles a
  where a.id = agent_commissions.agent_id
    and a.user_id = (select auth.uid())
    and a.status = 'active'
));
drop policy if exists agent_payouts_read_own on public.agent_payouts;
create policy agent_payouts_read_own on public.agent_payouts
for select to authenticated
using (exists (
  select 1 from public.agent_profiles a
  where a.id = agent_payouts.agent_id
    and a.user_id = (select auth.uid())
    and a.status = 'active'
));
drop policy if exists agent_payout_items_read_own on public.agent_payout_items;
create policy agent_payout_items_read_own on public.agent_payout_items
for select to authenticated
using (exists (
  select 1 from public.agent_payouts p
  join public.agent_profiles a on a.id = p.agent_id
  where p.id = agent_payout_items.payout_id
    and a.user_id = (select auth.uid())
    and a.status = 'active'
));
commit;
