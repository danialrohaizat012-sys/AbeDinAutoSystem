# AbeDin Auto Agent Network: non-destructive integration contract

**Purpose:** new agent module must never modify, delete, migrate or overwrite original AbeDin Auto operational records.

## Immutable compatibility rules
1. Existing tables `vehicles`, `sales`, `customers`, `profiles`, `payments`, `inspections`, and all rental tables remain unchanged.
2. Agent tables use the separate `agent_*` namespace only. References to existing sales/vehicles are foreign keys, never a duplicated source of truth.
3. Agent registration is disabled in production until signup/account creation has been tested against existing staff login, `profiles` roles and account lifecycle. Agent accounts must never receive staff roles.
4. No new RLS policy, grant, trigger, or auth claim modification on an existing operations table in this first release.
5. Admin approval, lead-to-sale attribution, commission recognition and payout status changes must occur server-side with role validation and audit history.
6. The agent browser cannot read `vehicles.purchase_cost`, private customer/contact records in `customers`, or staff records. Stock catalogue access should use a safe public projection/API with an allowlist of fields.
7. Commission eligibility is based on confirmed `sales`, not merely `vehicles.status = 'sold'`; cancellation and post-sale costs trigger reviewed compensating adjustments.
8. No payment API, bank transfer, or auto payout is activated until reconciliation, duplicate protection and approval process are independently tested.
9. All test fixtures are fabricated data; avoid writing demo records to production.
10. Branch changes are not deployed or merged into main until a reproducible staging test and recovery plan are documented.

## Integration sequence
- **Gate A**: review PR and run static tests; no database mutation.
- **Gate B**: spin up isolated database/environment with non-real test users and seed data. Verify schema migration, RLS, cross-agent isolation, and admin restrictions.
- **Gate C**: inspect existing Supabase Auth lifecycle (signup allowed? profile creation? staff role defaults?), and design approved agent signup.
- **Gate D**: implement admin workflow and commission/payout transactions with invariants and full audit.
- **Gate E**: read-only catalogue integration, followed by agent creation and live system integration only after owner approval and backups.
- **Gate F**: rollout behind a feature flag, monitoring and immediate disable path.

## Deployment rollback
- Disable feature flag / remove navigation link first, without deleting agent or original records.
- If migration must roll back, use a separately reviewed forward migration; **never** drop operational tables.
- Keep a before/after inventory of table names, grants and RLS policies; verify all existing table definitions and row counts remain unchanged.
- Confirm that the repository main branch SHA and production deployments were unchanged during staging.

## Current state
All work is in `feature/agent-portal-v1`, under PR #37. `agent.html` is a static preview, `js/agent-network-api.mjs` is an isolated opt-in client adapter, and `supabase/agent_network_v1.sql` is an unapplied migration proposal. No production authentication, commission payments, or live agent onboarding are enabled.
