# AbeDin Auto HR — Fasa 7B release checklist (REVIEW ONLY)

Target: existing AbeDin Auto operational project `buzpdyvvoiqgbeventwm`.
Do not create additional Supabase projects, branches, PITR add-ons, or other paid resources.
The name "abe-din-auto-dev" does NOT make this a disposable database.

## Release gates

- [x] Nine HR modules wired into actual staff screens on the test branch.
- [x] Prior PostgreSQL 17, mock-browser and 188 existing regression tests passed.
- [x] Schema prerequisites and live default grants inspected read-only.
- [ ] Final commit: inspect latest frontend and SQL Actions results.
- [ ] Verify main HEAD is still 43afd4809ce01c3449c9c7735a7d61394527d91a; if different, reconcile and rerun before promotion.
- [ ] Verify backup completion timestamp, recoverability and storage backup coverage. No restore or paid upgrade without authorization.
- [ ] Confirm rollout window and approval to change production.
- [ ] Review migration generated from exact final commit and its SHA-256; do not run older artifacts.
- [ ] Confirm no conflicting public.hr_* or staff_payroll_records objects exist on target. Confirm prerequisite constraints and RLS.
- [ ] Confirm active independent payroll reviewer. Owner must choose; do not grant or promote anyone automatically.

## Deployment order

1. Save current production commit SHA and the tested release SHA. Record baseline database migration history and security-advisor findings. Keep backup in secure storage, not GitHub.
2. Generate HR_RELEASE_CANDIDATE.sql from the reviewed commit using build-release-sql.py. Its outer transaction must be preserved. Apply using an approved migration path to the target only. Do not execute smoke tests, synthetic fixture data, or rollback failure injection on production.
3. Verify 12 HR tables, RLS, explicit table/column grants, restricted RPC execution, and migration history. Compare advisors to baseline. If any check fails, stop; do not publish frontend.
4. Promote only reviewed HR frontend files, cache-bust changes and regression test updates. Do not promote CI fixtures, demo data or proposed SQL to public site. Do not force-push or rewrite main history.
5. Check production deploy workflow and actual asset versions. Check owner/staff roles, dashboard/assistant manual loads, and approved record display. Verify existing attendance, sales, rental, runner, agent, receipt/DO PDF and catalogue flows. No fake sales, fake payroll approvals or real HR notifications during smoke tests.
6. Start payroll only after human review of statutory amounts and a designated independent reviewer. The app is not a statutory rate engine and is not proof of salary payment. Test on actual iPhone Safari before declaring mobile acceptance.

## Recovery (no destructive automatic rollback)

- Before database commit: any SQL error must roll back entire transaction; confirm no partial HR objects.
- After database commit but before frontend release: leave new empty, restricted tables in place; original frontend remains in service. Investigate without dropping tables.
- If frontend release fails: revert only the release commit(s) through a normal Git revert (review exact diff first) and redeploy. Preserve HR database and audit history; do not delete rows.
- For an HR-specific security incident, explicitly approve a scoped emergency restriction of HR API grants after collecting the exact affected scope; do not revoke unrelated catalogue or agent RPCs.
- Database-wide restore is a last resort; it can roll back unrelated sales and attendance. Require explicit authorization, backup verification and reconciliation of post-backup changes.
- Supabase database backups do not include Storage file contents. Protect those separately.
- After recovery, rerun read-only security checks and record the incident.

## Access and limits

- Owner creates draf, reviewer independently checks and submits, Owner decides; staff only see their approved payroll records.
- Payroll reference fields restricted; no automatic money transfer, disciplinary penalty or calculation of statutory rates.
- HR Assistant is rule-based; no external AI service.
- Existing Supabase Security Advisor warnings are baseline issues, not evidence of compromise. Triage separately; do not break intentionally public catalogue routes.
- Browser fixtures are simulated data, not live Supabase/PostgREST or real iPhone Safari. Passing tests are not proof of live deployment.
