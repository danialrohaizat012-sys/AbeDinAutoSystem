// Abe Din Auto – panel "Sewa" dalam dashboard.
// Modul Sewa (Abedin Car Rental) guna projek Supabase berasingan (abedinauto's Project),
// jadi panel ini ada login sendiri. Sesi disimpan dalam pelayar, jadi login sekali sahaja.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { mountSewa } from './sewa.js?v=5';

const SEWA_URL = 'https://abqrgiebeoyzowvxeggj.supabase.co';
const SEWA_KEY = 'sb_publishable_ofappLwL3Q_OZzlmlcbNqQ_y5y-fC3B';
let client = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const box = 'max-width:400px;margin:20px auto;padding:22px;border:1px solid #2a3233;border-radius:20px;background:linear-gradient(150deg,#151b1c,#0d1112);color:#f3eee2;font:15px/1.45 Inter,-apple-system,sans-serif';
const inp = 'width:100%;box-sizing:border-box;font:inherit;color:#f3eee2;background:#0b0f10;border:1px solid #2a3233;border-radius:12px;padding:12px;margin:6px 0 12px';
const btn = 'width:100%;font:inherit;font-weight:700;border-radius:12px;padding:13px;border:1px solid #d8ad57;background:#d8ad57;color:#0b0d0e;cursor:pointer';

export async function mountSewaPanel(host, opts = {}) {
  client ||= createClient(SEWA_URL, SEWA_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'acr-sewa-admin' } });
  host.innerHTML = '<div style="color:#969da8;padding:20px">Memuatkan Sewa…</div>';

  const { data: { session } } = await client.auth.getSession();
  if (!session) return loginForm(host, opts, '');
  const { data: profile, error } = await client.from('profiles').select('id,full_name,role,enabled').eq('id', session.user.id).maybeSingle();
  if (error || !profile || profile.enabled !== true) {
    await client.auth.signOut();
    return loginForm(host, opts, error ? 'Gagal semak akaun: ' + error.message : 'Akaun ini belum diaktifkan untuk Sewa. Minta Owner aktifkan di Sewa → 👤 Staf.');
  }

  host.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 12px;color:#969da8;font:13px Inter,sans-serif">
      <span>Sewa · ${esc(profile.full_name || session.user.email)} (${esc(profile.role)})</span>
      <button type="button" data-sewa-logout style="font:inherit;font-weight:700;border-radius:10px;border:1px solid #2a3233;background:rgba(255,255,255,.05);color:#f3eee2;padding:7px 12px;cursor:pointer">Log keluar Sewa</button></div>
    <div data-sewa-mod></div>`;
  host.querySelector('[data-sewa-logout]').onclick = async () => { await client.auth.signOut(); mountSewaPanel(host, opts); };
  mountSewa(host.querySelector('[data-sewa-mod]'), { client, profile, formPath: opts.formPath || 'sewa.html', manageStaff: true });
}

function loginForm(host, opts, msg) {
  host.innerHTML = `<form style="${box}" data-sewa-login>
      <div style="background:#f5f7fd;border-radius:14px;padding:10px;display:flex;justify-content:center;margin-bottom:16px"><img src="abedin-car-rental-logo.webp" alt="Abedin Car Rental" style="height:60px"></div>
      <h2 style="margin:0 0 4px;font-size:20px">Sewa Kereta</h2>
      <p style="margin:0 0 14px;color:#969da8;font-size:14px">Log masuk akaun Abedin Car Rental (berasingan daripada login dashboard).</p>
      <label style="font-size:13px;color:#969da8">Email<input name="email" type="email" autocomplete="username" required style="${inp}"></label>
      <label style="font-size:13px;color:#969da8">Kata laluan<input name="pw" type="password" autocomplete="current-password" required style="${inp}"></label>
      <button type="submit" style="${btn}">Log masuk</button>
      <p data-msg style="min-height:20px;margin:12px 0 0;font-size:13.5px;color:#f08a7e">${esc(msg)}</p>
      <p style="margin:6px 0 0;font-size:12.5px;color:#969da8">Staf baharu: daftar di <a href="sewa-admin.html" target="_blank" rel="noopener" style="color:#d8ad57">halaman admin Sewa</a>, kemudian minta Owner aktifkan.</p>
    </form>`;
  const f = host.querySelector('[data-sewa-login]');
  f.onsubmit = async e => {
    e.preventDefault();
    const b = f.querySelector('button'), m = f.querySelector('[data-msg]');
    b.disabled = true; b.textContent = 'Mengesahkan…'; m.textContent = '';
    const { error } = await client.auth.signInWithPassword({ email: f.email.value.trim(), password: f.pw.value });
    f.pw.value = '';
    if (error) {
      b.disabled = false; b.textContent = 'Log masuk';
      m.textContent = 'Login gagal: ' + (/invalid/i.test(error.message) ? 'email atau kata laluan salah.' : /confirm/i.test(error.message) ? 'sahkan email dahulu.' : error.message);
      return;
    }
    mountSewaPanel(host, opts);
  };
}
