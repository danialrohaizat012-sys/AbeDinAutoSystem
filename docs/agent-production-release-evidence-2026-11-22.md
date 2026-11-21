# Agent Network — production release evidence (2026-11-22)

## Deployed
- Public portal: https://abedinauto.my/agent.html
- Independent HR verifier: https://abedinauto.my/agent-payout-verify.html
- Supabase production project: `buzpdyvvoiqgbeventwm`.
- Active Edge Functions (JWT required): `agent-portal-admin` v4, `agent-portal-catalog` v1 and `agent-payout-verifier` v2.
- Nine new `agent_*` tables have RLS enabled. Payout finalization requires an explicitly enabled entry in `agent_payout_verifiers`; owner role alone is insufficient.
- HR verifier is the existing account `aiman` (original `sales_advisor` role preserved).
- Owner approves a payout; the separate HR verifier records a real external bank transfer reference and actual bank date/time. The system DOES NOT initiate any bank transfer.
- Finance RPCs cannot be called directly by `anon` or `authenticated`; server functions derive actor identity from verified JWT.
- Main portal contains no owner action to mark a payout paid. HR portal is the only browser finalization flow.

## Executed non-production tests
- GitHub Actions [strict HR SQL run 44954244475](https://github.com/danialrohaizat012-sys/AbeDinAutoSystem/actions/runs/44954244475): PostgreSQL 36 PASS notices, zero errors; Node.js 49 PASS, zero failures. Uses disposable PostgreSQL 16 and synthetic actors, customers and sales.
- [Public hosting and unsigned API smoke run 44954429594](https://github.com/danialrohaizat012-sys/AbeDinAutoSystem/actions/runs/44954429594): 2 portal pages return latest HTML, all 3 API endpoints return HTTP 401 without login.
- Production smoke workflow: `.github/workflows/agent-production-smoke.yml`. Automatically checks pages after future changes to the two portal HTML files or workflow.

## Production data invariants checked
- 112 vehicles, 34 sales, 33 customers, 34 legacy payments.
- Zero current agent applications, agent profiles, agent commissions and agent payouts at last inspection.
- No production test customers, sales or payouts were inserted.

## Required human acceptance before unrestricted rollout
1. The owner logs into `agent.html` with their real account.
2. A separate verified e-mail agent account registers, applies and is approved by the owner.
3. Agent adds a consented synthetic-only lead with a suitable test transaction not touching accounting; verify another agent cannot see it.
4. Owner verifies lead-to-sale matching and finance reconciliation; do not invent a bank transaction.
5. Owner approves payout only after a genuine sale and bank payment. Aiman logs into HR portal and confirms only an **actual completed** bank transfer after independent bank evidence review.
6. Check receipt, audit event, dashboard, mobile navigation, session expiry and rejection of repeat payout.
7. Confirm Auth configuration, email confirmation redirect and leaked-password protection with Supabase Dashboard.

**No genuine bank transaction should be created just for a test.** Steps requiring real accounts and payments have not been claimed as passed by automated tests.

## Operational safety and rollback
- Pages and the backend were deployed as standalone Agent Network assets. Never merge draft PR #37 wholesale; it remains a historical development PR with unresolved conflicts.
- If a payout incident occurs, suspend the explicit HR verifier entitlement and pause payout processing, preserving financial records for audit. Do not delete ledger rows.
- Roll back browser HTML with GitHub history, then redeploy a known-good Edge Function source where necessary; SQL financial records require audited corrective entries rather than destructive rollback.
- Review Supabase security advisor warnings independently: some pertain to original unrelated application functions.
