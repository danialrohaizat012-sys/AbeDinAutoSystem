import { effectiveSewaRole, shouldApplyRoleEvent, validRoleEvent } from './role_event.ts';
export type AuthorityState = {
  mainUserId: string;
  revision: number;
  role: 'owner' | 'staf' | null;
};
export type AuthorityDecision =
  | { status: 'applied'; state: AuthorityState }
  | { status: 'rejected'; reason: 'invalid_event' | 'identity_mismatch' | 'stale_revision' };
/**
 * Pure decision helper for a future authenticated, atomic server-side event handler.
 * This does not authenticate messages or persist changes.
 */
export function decideAuthorityUpdate(current: AuthorityState, incoming: unknown): AuthorityDecision {
  if (!validRoleEvent(incoming)) return { status: 'rejected', reason: 'invalid_event' };
  if (current.mainUserId !== incoming.mainUserId)
    return { status: 'rejected', reason: 'identity_mismatch' };
  if (!shouldApplyRoleEvent(incoming, current.revision))
    return { status: 'rejected', reason: 'stale_revision' };
  return { status: 'applied', state: {
    mainUserId: current.mainUserId,
    revision: incoming.revision,
    role: effectiveSewaRole(incoming),
  } };
}
