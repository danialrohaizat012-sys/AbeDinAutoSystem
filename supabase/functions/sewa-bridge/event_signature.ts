// HMAC authentication primitive for a future trusted server-to-server receiver.
// The caller MUST additionally validate the event schema, timestamp, identity,
// monotonic revision, and atomically persist state. Never expose secret to clients.
const encoder = new TextEncoder();
function hex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function keyFor(secret: string): Promise<CryptoKey> {
  if (encoder.encode(secret).length < 32) throw Error('Signing secret too short');
  return crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signRolePayload(secret: string, payload: string): Promise<string> {
  const key = await keyFor(secret);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}
export async function verifyRolePayload(secret: string, payload: string, signature: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const bytes = new Uint8Array(signature.match(/.{2}/g)!.map(x => parseInt(x, 16)));
  const key = await keyFor(secret);
  return crypto.subtle.verify('HMAC', key, bytes, encoder.encode(payload));
}
