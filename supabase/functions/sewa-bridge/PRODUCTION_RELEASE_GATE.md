# V82 production release gate (19 Nov 2026)

**Decision: NO-GO for any Sewa Bridge / RLS / profile-authority deployment.**
This file is a release control, not approval to merge PR #10.

## Evidence
- GitHub Actions run #14 passed 37 Deno tests and type checks on commit 2b71589.
- Live Sewa B policy `profiles_owner_update` permits authenticated owners to UPDATE other profiles when `sewa_role()='owner'`, without field-level restrictions in its USING/WITH CHECK expressions.
- Sewa `sewa_role()` derives privileges from B `profiles`, not live Main A authority.
- No trusted cross-project revocation/reconciliation worker is deployed.
- Draft `PROFILE_AUTHORITY_GUARD_REVIEW.sql` has not passed staging integration tests.
- V82 branch diverges from main; do not merge all changes or assume a passing CI proves deployment readiness.

## Required checks before production
1. Reproduce owner-to-staff demotion and disablement with **existing** B access token.
2. Verify direct PostgREST UPDATE of other user's `role` and `enabled` is denied.
3. Verify service-role bridge sync still succeeds without exposing service-role credentials.
4. Verify duplicate, out-of-order, cross-user and forged events cannot update authority.
5. Verify database transaction commits both revision and profile role atomically.
6. Verify event loss/retry and reconciliation; define a maximum revocation delay.
7. Confirm deployment/rollback procedures and an independent staging environment.
8. Review the actual production diff against current main, not only PR CI.
9. Obtain explicit approval for production migration/function deployment after staging passes.

## Safe-to-ship subset now
No V82 runtime code, SQL, or config has been proven independently safe for production.
Documentation and test-only changes can remain in draft PR #10; they do not need a production deployment.

## Read-only RLS audit query
```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename='profiles'
order by policyname;
```
