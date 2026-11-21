# Agent Network V1 — Admin approval staged workflow

## Safe processing path

1. Applicant creates a verified Supabase Auth account through a dedicated agent route (not the existing staff login).
2. Authenticated applicant submits `agent_applications` with `status=pending`. No agent role, staff profile or commission is created.
3. Owner signs in using their existing owner account.
4. Owner confirms decision through an authenticated Edge Function (`agent-review`).
5. Server validates the JWT using `auth.getUser(token)`, then independently verifies `profiles.role=owner` and `enabled=true`.
6. The service-only RPC `public.agent_admin_review_v1` calls `agent_internal.review_agent_application` inside one database transaction.
7. The RPC locks the pending application, rejects a duplicate approval, ensures the applicant email is verified, allocates a unique agent code, creates the agent profile and records audit events.
8. Client receives a status result; email/SMS notifications are a later opt-in integration.

## Preconditions
- `agent_network_v1.sql`, then `agent_admin_review_v1.sql`, then `agent_admin_gateway_v1.sql` must be applied to an isolated test database, in that order.
- The SQL is a staged proposal. It must receive review and pass security tests before use.
- Configure Edge Function secrets only in a secure server environment. Never place service-role credentials in frontend code.
- Only verified owner roles can approve. `sales_advisor` and `operations` cannot approve.
- The current Edge Function deliberately refuses all browser Origin requests until the allowed origins, CORS preflight, CSRF/session model, rate limiting and request size streaming limits have been reviewed.
- The Edge Function is **not deployed**. The browser portal does not call it.
- Confirm Supabase Auth signup configuration and staff-profile creation lifecycle in staging; do not edit auth triggers/roles in production as a shortcut.

## Expected security checks
- Wrong JWT -> 401. Missing JWT -> 401.
- Verified agent JWT -> 403. Sales advisor -> 403. Disabled owner -> 403.
- Verified enabled owner -> approval can succeed once; repeat -> 409.
- Rejection without a reason -> 400; rejection never creates an agent profile.
- Approval with unverified applicant email -> fails without partial writes.
- Concurrent approvals of same application -> exactly one succeeds.
- Owner rollback/rejection never modifies `sales`, `vehicles`, `customers`, `payments`, `profiles` or rental tables.
- Agent code uniqueness even when applications are approved simultaneously.
- Re-check all `agent_*` RLS policies against two authenticated test users.
- Compare all production table definitions and record counts before and after rollout.

## Known remaining work
- A safe, non-staff signup/login UI is not implemented yet.
- The business logic for lead-to-sale attribution, payout transaction validation, cancellation and payout bank verification is not implemented.
- Production CORS/session policy, rate limits, notification flow, recovery playbook and end-to-end tests are pending.
- Existing staff `profiles` and auth behavior must be assessed before permitting any public signup.

**No production migration, rollout or customer data modification is authorized by this draft.**
