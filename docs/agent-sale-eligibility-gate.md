# Agent Network V1: Sale-to-commission eligibility gate

## Why this is necessary
Production sales records have `sales.status`, `sales.sold_at`, and `sales.agreed_price`.
The existing `payments` records use `kind` values `deposit` and `full_payment`,
plus `amount`, `reference_no`, `confirmed_by`, and `confirmed_at`.
Do not infer a settled sale from `vehicles.status` or a single deposit.

## Proposed server-only workflow (NOT deployed)
1. Authorized owner explicitly links one agent lead to one existing sale. Before doing so, verify the real buyer matches the lead with a permitted, privacy-preserving method; matching vehicle IDs alone is insufficient.
2. Load sale and payment records in a trusted server process with least-privilege access.
3. Convert database NUMERIC values to exact integer sen. Do not pass untrusted browser prices into this eligibility calculation.
4. Run `assessSaleForCommission` in `js/agent-sale-eligibility.mjs`:
   - sale status `sold`, sold_at present, identifiers complete
   - agent owns the attributed lead; same sale and vehicle
   - payments refer to same sale, with distinct nonblank references, confirmation actor and time
   - at least one full_payment row and confirmed total >= sale agreed price
5. Treat `readyForReview: true` as **a referral for OWNER REVIEW**, never as bank-settled proof or automatic payable commission.
6. Owner verifies customer consent, delivery, refunds, financing reversals, pending costs and business policy; separately approves commission rule and snapshot server-side.
7. Payout requires another authorized owner to independently reconcile actual bank statement, then confirm using the atomic payout function.

## Key limitations and blockers
- `full_payment` is a record type, not independent evidence of bank clearing. Check bank reconciliation before payment.
- Existing payment model does not explicitly represent refunds/chargebacks. Manual reconciliation remains mandatory.
- Client must not SELECT `sales`, `payments`, `vehicles.purchase_cost` or `customers` through agent credentials.
- No SQL migrations or prod auth changes should be run until staging and cross-user RLS tests pass.
- Rule selection must be locked as a snapshot; a late sales-cost edit must create an audited adjustment, not overwrite a paid commission.
- Date/time and payment reference checks are preliminaries, not fraud detection.
- Test a case with two separate agents referring the same customer to prevent double attribution.
- Strict review must check payment reference uniqueness scoped correctly to real bank transactions, not merely within one sale.

## Local verification
The in-memory eligibility module was exercised with ten scenarios:
valid, deposit-only, mismatched agent, mismatched payment sale,
duplicate payment reference, shortfall, reserved sale, missing confirmer,
vehicle mismatch, and missing payment evidence.
These exercises are not an integration test with Supabase data.

## Original data protection
All additions are under `js/agent-*`, `tests/agent-*` and staged SQL under
`supabase/agent_*`. Neither `main` nor existing production tables are modified.
