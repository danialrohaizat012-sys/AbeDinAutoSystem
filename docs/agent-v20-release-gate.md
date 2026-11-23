# Agent V20 production release gate

**Production database:** buzpdyvvoiqgbeventwm. Do not use the Sewa Bridge project as staging.

## Verified
- GitHub Agent V20 safety checks pass at commit 9cfaa17c.
- Existing app regression checks pass at that commit.
- The V20 portal uses an authenticated, read-only client and requires an active agent profile.
- Production currently has owner-scoped SELECT policies on agent_leads, agent_commissions, agent_payouts, agent_payout_items; these do not require active status.
- agent_payout_items has its own SELECT policy. The proposed migration now requires active agent ownership through the parent payout; this must be validated against real authenticated sessions.

## Blocking checks before merging PR #62
1. Inspect all agent table policies and any privileged RPC used by admin/owner; confirm new policies do not break legitimate owner operations.
2. Test active Agent A, active Agent B, inactive Agent C with real authenticated Supabase sessions. Assert each agent cannot read another agent's leads, commissions or payouts, and inactive Agent C cannot read any of these.
3. Verify agent-only login, logout, token expiration, mobile layout, and no unintended changes to staff sales/inventory workflows.
4. Apply the reviewed RLS migration using a transaction and verify effective policies immediately after applying.
5. Confirm GitHub PR mergeability and deployment mechanism. Merge only after all release gates pass.
6. Keep manual rollback SQL prepared and database backup/restore procedure verified.

## Rollback SQL (requires explicit review and approval)
This restores the original SELECT ownership predicates, removing the active-status requirement. It is NOT executed by this file.

```sql
begin;
drop policy if exists agent_leads_read_own on public.agent_leads;
create policy agent_leads_read_own on public.agent_leads
for select to authenticated
using (exists (select 1 from public.agent_profiles a where a.id=agent_leads.agent_id and a.user_id=(select auth.uid())));
drop policy if exists agent_commissions_read_own on public.agent_commissions;
create policy agent_commissions_read_own on public.agent_commissions
for select to authenticated
using (exists (select 1 from public.agent_profiles a where a.id=agent_commissions.agent_id and a.user_id=(select auth.uid())));
drop policy if exists agent_payout_items_read_own on public.agent_payout_items;
create policy agent_payout_items_read_own on public.agent_payout_items
for select to authenticated
using (exists (select 1 from public.agent_payouts p join public.agent_profiles a on a.id=p.agent_id where p.id=agent_payout_items.payout_id and a.user_id=(select auth.uid())));
drop policy if exists agent_payouts_read_own on public.agent_payouts;
create policy agent_payouts_read_own on public.agent_payouts
for select to authenticated
using (exists (select 1 from public.agent_profiles a where a.id=agent_payouts.agent_id and a.user_id=(select auth.uid())));
commit;
```

**Warning:** rollback deliberately restores the preexisting inactive-agent read exposure. Use only as a controlled emergency recovery, not as the default fix.
