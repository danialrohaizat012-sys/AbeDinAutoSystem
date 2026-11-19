# V82 sewa-bridge security review

**DRAFT ONLY. DO NOT DEPLOY.** The existing deployed Sewa Edge Function remains unchanged.

## Fix
- Map Sewa `owner` solely from the current main dashboard profile.
- Verify the main Auth token and read the caller's enabled profile under their JWT.
- Fail closed on unknown main roles and backend failures.
- Allowlist browser origins (CORS is not authentication); avoid raw internal error leakage.
- Preserve existing magic-link response shape for frontend compatibility.

## Required secrets
- `MAIN_SUPABASE_PUBLISHABLE_KEY` (main dashboard's publishable key)
- `MAIN_SUPABASE_URL` (optional)
- `SEWA_BRIDGE_ALLOWED_ORIGINS` (comma-separated exact frontend origins)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Sewa project)

## Tests
Run `deno test supabase/functions/sewa-bridge/role_test.ts` locally.
Staging integration tests MUST verify: owner login; owner demotion to sales_advisor/operations; disabled profile; invalid JWT; existing/new Sewa user; allowed/blocked Origin; RLS self-read; failed upsert; sign-out; and concurrent requests.

## Release blockers
- **Existing Sewa sessions are NOT revoked by this patch.** Audit Sewa RLS and session revocation on demotion before deploying.
- Confirm frontend invokes the bridge with the intended origin and token_hash handling.
- Validate generateLink behavior and rate limits in staging.
- Confirm deployment secrets and review pinned package compatibility.
- Require explicit approval before production changes.
