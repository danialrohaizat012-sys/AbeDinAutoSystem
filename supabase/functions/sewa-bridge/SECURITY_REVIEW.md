# V82 release security gate (read-only audit, 2026-11-19)

## Verified
- Sewa `public.sewa_role()` reads `public.profiles.role` for `auth.uid()` where `enabled=true`; it does **not** query the main dashboard's live role.
- Sewa `profiles_owner_update` permits owner users to update other profiles. Investigate whether this can preserve/regrant owner privileges after a main-project demotion.
- Sewa `sewa_agreements_select` and `sewa_agreements_update` allow any user with a non-null Sewa role to access/update all agreements. Assess whether this is intended for internal staff.
- `transactions` policies are scoped to `auth.uid()=user_id`.
- Security advisor reports 26 anon-executable SECURITY DEFINER functions in Sewa project; inspect bodies and auth checks before any broad revoke.
- No GitHub status checks were reported for the PR head SHA at audit time.

## Release blockers
1. Verify frontend bridge call and allowed origins.
2. Establish a revocation/demotion workflow for **existing** Sewa sessions and roles, not only new bridge logins. Consider a server-side authorization lookup and a short-lived, auditable role sync; test race conditions.
3. Confirm RLS on agreements is least-privilege, especially identity documents and payment details.
4. Run staging integration tests with disposable accounts, including demotion while a Sewa session is already active.
5. Validate configuration and secret injection; do not log JWTs or magic-link token hashes.
6. Add CI and review/approve PR; then schedule a reversible deployment.

## Unit test evidence
Local Node 22 with `--experimental-strip-types`: 5/5 role mapping tests passed against the locally prepared patch. This is NOT a live Supabase integration test.

**Production was not changed by this audit.**
