export type MainProfile = { role?: unknown; enabled?: unknown } | null;
export function allowedMainProfile(profile: MainProfile): boolean {
  return profile?.enabled === true &&
    (profile.role === 'owner' || profile.role === 'sales_advisor' || profile.role === 'operations');
}
export function allowedOrigin(origin: string | null, allowlist: readonly string[]): boolean {
  return origin === null || allowlist.includes(origin);
}
export function validBridgeToken(token: unknown): token is string {
  return typeof token === 'string' && token.length >= 20 && token.length <= 4000 &&
    !/\s/.test(token);
}
