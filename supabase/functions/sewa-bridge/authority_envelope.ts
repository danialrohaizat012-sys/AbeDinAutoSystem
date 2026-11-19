import { validRoleEvent, type RoleEvent } from './role_event.ts';
import { verifyRolePayload } from './event_signature.ts';

export type SignedAuthorityEnvelope = {
  eventId: string;
  issuedAt: number;
  event: RoleEvent;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validEnvelope(input: unknown): input is SignedAuthorityEnvelope {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  return typeof value.eventId === 'string' && UUID.test(value.eventId) &&
    typeof value.issuedAt === 'number' && Number.isSafeInteger(value.issuedAt) &&
    value.issuedAt > 0 && validRoleEvent(value.event);
}
/** Authenticates exact raw request bytes; parse only AFTER verifying HMAC. */
export async function authenticateAuthorityMessage(
  secret: string, rawBody: string, signature: string, nowSeconds: number,
  maxAgeSeconds = 120,
): Promise<SignedAuthorityEnvelope | null> {
  if (!Number.isSafeInteger(nowSeconds) || maxAgeSeconds < 1 ||
      !Number.isSafeInteger(maxAgeSeconds) || rawBody.length > 8192) return null;
  if (!await verifyRolePayload(secret, rawBody, signature)) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(rawBody); } catch { return null; }
  if (!validEnvelope(parsed)) return null;
  if (parsed.issuedAt > nowSeconds + 30 ||
      parsed.issuedAt < nowSeconds - maxAgeSeconds) return null;
  return parsed;
}
// Replay prevention MUST be enforced by unique eventId + monotonic revision
// inside the same trusted database transaction that updates the profile.
// Timestamp checks alone cannot prevent replay within the allowed time window.
