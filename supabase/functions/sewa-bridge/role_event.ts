// Pure validation only. Not an authenticated event receiver or a database transaction.
export type RoleEvent = {
  mainUserId: string;
  revision: number;
  role: string;
  enabled: boolean;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validRoleEvent(value: unknown): value is RoleEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return typeof e.mainUserId === 'string' && UUID.test(e.mainUserId) &&
    typeof e.revision === 'number' && Number.isSafeInteger(e.revision) && e.revision > 0 &&
    typeof e.enabled === 'boolean' &&
    (e.role === 'owner' || e.role === 'sales_advisor' || e.role === 'operations');
}
export function shouldApplyRoleEvent(event: RoleEvent, currentRevision: number): boolean {
  return Number.isSafeInteger(currentRevision) && currentRevision >= 0 &&
    event.revision > currentRevision;
}
export function effectiveSewaRole(event: RoleEvent): 'owner' | 'staf' | null {
  if (!event.enabled) return null;
  return event.role === 'owner' ? 'owner' : 'staf';
}
