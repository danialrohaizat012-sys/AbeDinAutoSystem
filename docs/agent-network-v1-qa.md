# Agent Network V1 — integration and security QA

Status: **staged SQL design only**. Do not treat this document as evidence that migration has run.

## Database project routing
- Main sales database: `buzpdyvvoiqgbeventwm` (`vehicles`, `customers`, `sales`).
- Other Supabase project `abqrgiebeoyzowvxeggj` is **not** the source of car sales/commissions.
- No changes to existing `vehicles`, `sales`, `customers`, `profiles` schema.

## Before enabling production
- [ ] Review migration against staging schema, check no overlapping agent tables.
- [ ] Run migration on isolated staging database (not production) and inspect security advisors.
- [ ] Implement email-verified Supabase Auth, rate limits, CAPTCHA/abuse controls.
- [ ] Implement admin approval via authenticated server workflow; check current staff `profiles.role` and enabled status on every action. Do not trust user-editable metadata.
- [ ] Enforce approved application before creating profile and immutable agent code. Service-side agent code allocator must avoid collisions.
- [ ] Implement consent record and privacy notice for customer leads; never include IC/bank fields in browser logs or public storage.
- [ ] Implement sales attribution as an explicit admin-confirmed link between an agent lead and one existing sale; handle duplicate referrals by a published business policy.
- [ ] Implement commission snapshot in a server transaction after sale verification. Never calculate entitlement from browser supplied profit.
- [ ] Implement payout approval with segregation of duties, bank verification, idempotency, reconciliation, and immutable audit events.
- [ ] Add server-side constraints/triggers for agent-payout item ownership, amount equality and status transitions before payout activation.
- [ ] Prevent incorrect access to vehicles.purchase_cost and sales.agreed_price by agent users. No direct `vehicles` / `sales` grants should be added to make dashboard work.
- [ ] Review existing sales cancellation and corrections flow; support compensating commission adjustments, not silent edits.
- [ ] Store private KYC and payout banking only when a retention policy, access model and encrypted private bucket are approved.
- [ ] Test backup/restore and rollback runbook.

## Required two-account RLS tests
1. User A can read their own application, profile, leads, commissions and payouts.
2. User A cannot read User B's records (including payout items), even by known UUID.
3. User A cannot modify their status/agent code, alter commission amounts, approve payment or insert an audit event.
4. Anonymous requests cannot access any agent table.
5. User A cannot create leads for User B; suspended agents cannot insert new leads.
6. A pending user cannot create a profile or commission, nor obtain active-agent permissions.
7. Admin cannot access or mutate beyond staff permission grants; all mutation events have who/when/why.
8. Payout items reject cross-agent commissions, repeat payments and incorrect totals.
9. Attempted commission assignment for missing, duplicate or cancelled sales fails.
10. Registration can handle duplicate submissions and deletion/retention obligations.

## Read-only post-migration checks (staging only)
```sql
select c.relname,
       c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public'
  and c.relname like 'agent_%'
  and c.relkind='r'
order by c.relname;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public' and tablename like 'agent_%'
order by tablename, policyname;
```

## Release gate
No live registrations, payment transactions, or production deployment until verified application logic, isolation tests and owner sign-off.
