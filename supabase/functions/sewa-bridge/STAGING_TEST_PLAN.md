# V82 Staging integration runbook

Do not execute against either live Supabase project. Use isolated copies with synthetic users and data.

## Preparation
1. Provision two non-production Supabase projects: main and Sewa. Apply reviewed schema/migrations.
2. Deploy candidate `sewa-bridge` only to staging Sewa. Set `MAIN_SUPABASE_URL`, `MAIN_SUPABASE_PUBLISHABLE_KEY`, `SEWA_BRIDGE_ALLOWED_ORIGINS`, and Sewa service credentials in Edge Function secrets.
3. Use three synthetic dashboard accounts: owner, sales_advisor, operations; plus a disabled account. Do not copy customer identity documents.
4. Record CI run URL, staging function version, database schema revision, and test account IDs in private release notes.

## Acceptance tests (all must pass)
- [ ] Owner main account signs in and maps to Sewa owner.
- [ ] sales_advisor and operations map to Sewa staf, never owner.
- [ ] Demote owner in main while Sewa session stays active. Existing session must immediately lose owner-only DB operations; **currently not guaranteed**.
- [ ] Disable main profile while Sewa session stays active. Existing session must lose protected DB operations; **currently not guaranteed**.
- [ ] Expired/malformed token rejected, no user provisioned.
- [ ] Disabled/unknown main role rejected, no Sewa session issued.
- [ ] Wrong origin blocked; allowed origin preflight succeeds.
- [ ] New and existing Sewa user login both succeed.
- [ ] Repeated/concurrent bridge calls do not create duplicate users or elevate privileges.
- [ ] Failed Sewa profile upsert never returns a usable token_hash.
- [ ] Anonymous users cannot read or modify agreements, customer IDs, payment records.
- [ ] Staf cannot modify owner-only vehicle/settings operations.
- [ ] Owner cannot assign themselves owner via unintended profile update route after main demotion.
- [ ] Verify login/logout and refresh behavior from actual app.html.
- [ ] Audit log contains no JWT, magic-link hash, service-role key, identity documents.

## Mandatory architecture decision
Bridge role sync happens only on new login. Sewa RLS `sewa_role()` reads its local `profiles` row; existing sessions can keep stale owner privileges. Before release, implement a trusted role synchronization/revocation channel or a server-side authorization mechanism that checks main-project authority on sensitive actions. Never grant browser clients permission to self-edit their own role. Test demotion and disable with existing sessions before merging.

## Rollback
Keep prior deployed function revision and SQL migration rollback scripts. Test rollback in staging. Do not merge or deploy until all gates are signed off.
