// V82 review candidate. Do not deploy without staging validation.
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
import { mappedSewaRole } from './role.ts';
import { allowedMainProfile, allowedOrigin, validBridgeToken } from './security.ts';

const MAIN_URL = Deno.env.get('MAIN_SUPABASE_URL') || 'https://buzpdyvvoiqgbeventwm.supabase.co';
const MAIN_KEY = Deno.env.get('MAIN_SUPABASE_PUBLISHABLE_KEY');
const SEWA_URL = Deno.env.get('SUPABASE_URL');
const SEWA_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ORIGINS = (Deno.env.get('SEWA_BRIDGE_ALLOWED_ORIGINS') || '').split(',').map(x => x.trim()).filter(Boolean);
const headers = (origin: string | null) => ({
  'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
  ...(origin && ORIGINS.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
});
const fail = (origin: string | null, status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: headers(origin) });

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (!allowedOrigin(origin, ORIGINS)) return fail(null, 403, 'Origin tidak dibenarkan');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    ...headers(origin), 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
  } });
  if (req.method !== 'POST') return fail(origin, 405, 'Kaedah tidak dibenarkan');
  if (!MAIN_KEY || !SEWA_URL || !SEWA_SERVICE_KEY || !ORIGINS.length)
    return fail(origin, 503, 'Konfigurasi perkhidmatan tidak lengkap');
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    if (!validBridgeToken(token))
      return fail(origin, 400, 'Token tidak sah');
    const main = createClient(MAIN_URL, MAIN_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: auth, error: authError } = await main.auth.getUser(token);
    const user = auth?.user;
    if (authError || !user?.id || !user.email)
      return fail(origin, 401, 'Sesi dashboard tidak sah');
    const { data: profile, error: profileError } = await main.from('profiles')
      .select('role,enabled,full_name').eq('id', user.id).maybeSingle();
    if (profileError || !profile || !allowedMainProfile(profile))
      return fail(origin, 403, 'Akaun dashboard tidak dibenarkan');

    const admin = createClient(SEWA_URL, SEWA_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const email = user.email.trim().toLowerCase();
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (created.error && !/already|registered|exists/i.test(created.error.message))
      return fail(origin, 502, 'Tidak dapat menyediakan akaun Sewa');
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (linkError || !link?.user?.id || !link.properties?.hashed_token)
      return fail(origin, 502, 'Tidak dapat menjana sesi Sewa');

    // Never preserve an old owner role from the Sewa database.
    const { error: upsertError } = await admin.from('profiles').upsert({
      id: link.user.id, email, full_name: profile.full_name || null,
      role: mappedSewaRole(profile.role), enabled: true,
    }, { onConflict: 'id' });
    if (upsertError) return fail(origin, 502, 'Tidak dapat menyelaraskan profil Sewa');
    return new Response(JSON.stringify({
      token_hash: link.properties.hashed_token, email,
    }), { status: 200, headers: headers(origin) });
  } catch {
    return fail(origin, 500, 'Ralat dalaman');
  }
});
