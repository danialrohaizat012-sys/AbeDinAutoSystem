# V82: Existing-session authorization design (review required)

## Threat model
A user authenticates in Main as owner and obtains a separate Sewa session. Main then demotes/disables that user. Sewa RLS uses `public.sewa_role()`, which currently reads **only** Sewa `public.profiles` and `enabled`. Thus bridge-login sync does not remove privileges from an existing Sewa session. Access-token expiry or a client logout alone is insufficient to guarantee immediate RLS revocation.

## Proposed solution: trusted sync + deny-by-default on stale authority
1. Maintain a server-managed identity mapping between Main `auth.users.id` and Sewa `auth.users.id`, rather than relying solely on email (emails can change). Only service-role-controlled code may modify this mapping.
2. Implement an authenticated **Main-side** role-change/disable workflow that sends signed, replay-protected change events to a Sewa-side service endpoint. Events must contain Main user ID, monotonic revision, role/enabled state, event ID and timestamp; validate signatures and reject replay/out-of-order updates.
3. The Sewa handler atomically updates the mapped Sewa profile role and enabled status. Since `sewa_role()` reads the live database row, subsequent RLS-protected queries then lose owner privileges even with an old access token.
4. Address changes made outside the workflow (dashboard admins, SQL console, Auth admin API) using a trusted database outbox/trigger plus retries and reconciliation. Eventual sync is **not** an immediate revocation guarantee; if immediate revocation is mandatory, route sensitive operations through a server-side Main authority check, or fail closed while authority freshness is unknown.
5. Never allow browser clients to write role, enabled, Main identity mapping, event revision, or signing secrets. Audit existing Sewa profile policies and SECURITY DEFINER functions separately.
6. Consider revoking refresh sessions as defense in depth, but do not assume existing access tokens are invalidated immediately.

## Regression matrix (staging only)
| Scenario | Expected result |
|---|---|
| Owner with active Sewa token demoted to staff in Main | Owner-only SELECT/INSERT/UPDATE/DELETE denied with the **same token** |
| Owner with active Sewa token disabled in Main | All protected Sewa data denied with the **same token** |
| Delayed older owner event arrives after demotion | Event ignored; no re-elevation |
| Duplicate event | Idempotent; no re-elevation |
| Email changed | Mapping still resolves by immutable Main user ID |
| Sync endpoint unavailable | Alert, retry; privileged actions fail closed if immediate revocation is required |
| Unauthorized client attempts profile role update | Rejected |
| Existing staff uses legitimate workflow | Only permitted staff actions succeed |

## Deployment gate
This document is an architectural proposal, **not an implemented synchronization channel**. Do not claim V82 closes the existing-session vulnerability until implementation and staging tests demonstrate the outcomes above. Do not apply unreviewed migrations to production.
