// Abe Din Auto – panel "Sewa" dalam dashboard.
// Modul Sewa (Abedin Car Rental) guna projek Supabase berasingan (abedinauto's Project).
// Tiada login berasingan: panel ini guna login dashboard. Fungsi sewa-bridge (Supabase Sewa)
// menyemak sesi dashboard dan memberi sesi Sewa secara automatik.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { mountSewa } from './sewa.js?v=9';

const SEWA_URL = 'https://abqrgiebeoyzowvxeggj.supabase.co';
const SEWA_KEY = 'sb_publishable_ofappLwL3Q_OZzlmlcbNqQ_y5y-fC3B';
let client = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function info(host, msg, retry, opts) {
  host.innerHTML = `<div style="max-width:420px;margin:24px auto;padding:20px;border:1px solid #2a3233;border-radius:18px;background:#121718;color:#f3eee2;font:15px/1.45 Inter,-apple-system,sans-serif">
    <b style="display:block;margin-bottom:6px">Sewa</b><span style="color:${retry ? '#f08a7e' : '#969da8'}">${esc(msg)}</span>
    ${retry ? '<button type="button" data-retry style="display:block;margin-top:14px;font:inherit;font-weight:700;border-radius:12px;border:1px solid #d8ad57;background:#d8ad57;color:#0b0d0e;padding:10px 16px;cursor:pointer">Cuba lagi</button>' : ''}</div>`;
  if (retry) host.querySelector('[data-retry]').onclick = () => mountSewaPanel(host, opts);
}

export async function mountSewaPanel(host, opts = {}) {
  client ||= createClient(SEWA_URL, SEWA_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'acr-sewa-admin' } });
  info(host, 'Menyambung ke Sewa…', false, opts);
  try {
    const main = opts.mainClient;
    if (!main) throw new Error('Sambungan dashboard tiada.');
    const { data: { session: ms } } = await main.auth.getSession();
    if (!ms) throw new Error('Sila log masuk dashboard dahulu.');
    const mainEmail = String(ms.user?.email || '').toLowerCase();

    let { data: { session } } = await client.auth.getSession();
    if (!session || String(session.user?.email || '').toLowerCase() !== mainEmail) {
      if (session) await client.auth.signOut();
      const r = await fetch(`${SEWA_URL}/functions/v1/sewa-bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SEWA_KEY, Authorization: `Bearer ${SEWA_KEY}` },
        body: JSON.stringify({ token: ms.access_token })
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.token_hash) throw new Error(out.error || `Gagal menyambung (${r.status}).`);
      const v = await client.auth.verifyOtp({ token_hash: out.token_hash, type: 'magiclink' });
      if (v.error) throw new Error('Gagal mula sesi Sewa: ' + v.error.message);
      session = v.data.session;
    }

    const { data: profile, error } = await client.from('profiles').select('id,full_name,role,enabled').eq('id', session.user.id).maybeSingle();
    if (error) throw new Error('Gagal semak akaun Sewa: ' + error.message);
    if (!profile || profile.enabled !== true) throw new Error('Akaun anda dinyahaktifkan dalam Sewa. Minta Owner aktifkan di Sewa → 👤 Staf.');

    host.innerHTML = '<div data-sewa-mod></div>';
    mountSewa(host.querySelector('[data-sewa-mod]'), { client, profile, formPath: opts.formPath || 'sewa.html', publicFormUrl: 'https://abedinauto.my/sewa.html', manageStaff: true });
  } catch (e) {
    info(host, e?.message || String(e), true, opts);
  }
}
