// TikTok Lead – mesej WhatsApp rawak (manual wa.me) + hantar melalui WAHA (Edge Function tiktok-wa)
let client = null, me = null, hooks = {}, tpls = [], waha = null, leads = [], queueStop = false, queueBusy = false;
const $ = (id) => document.getElementById(id);
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function firstName(name) {
  const parts = String(name || '').replace(/\s+/g, ' ').trim().split(' ');
  const skip = /^(mohd|muhd|muhammad|mohamad|mohammad|md|nur|nurul|siti|ahmad|abdul|wan|nik|che|tengku|ku|haji|hj)$/i;
  let i = 0;
  while (i < parts.length - 1 && skip.test(parts[i]) && i < 2) i++;
  const f = parts[i] || '';
  return f.length > 25 ? f.slice(0, 25) : f;
}
export const fill = (tpl, name) => tpl.replace('{nama}', firstName(name) || 'tuan/puan');
const randomTpl = (exceptId) => {
  const pool = tpls.length > 1 ? tpls.filter((t) => t.id !== exceptId) : tpls;
  return pool[Math.floor(Math.random() * pool.length)] || null;
};

async function invoke(body) {
  const { data, error } = await client.functions.invoke('tiktok-wa', { body });
  if (error) {
    let j = {};
    try { j = await error.context.json(); } catch (_) {}
    throw Object.assign(Error(j.error || error.message || 'Gagal'), { code: j.code, wait: j.wait });
  }
  if (data?.error) throw Error(data.error);
  return data;
}

async function loadTemplates() {
  const { data, error } = await client.from('tiktok_wa_templates').select('id,body').eq('active', true).order('created_at');
  tpls = error ? [] : (data || []);
}
async function loadWaha() {
  const { data, error } = await client.rpc('waha_config_status');
  waha = error ? null : data;
}
const wahaReady = () => !!(waha && waha.enabled && (me.role !== 'owner' || waha.base_url));

export async function init(c, profile, h = {}) {
  client = c; me = profile; hooks = h;
  await Promise.all([loadTemplates(), loadWaha()]);
  renderTools();
  if (me.role === 'owner') renderPanel();
}
export function reset() { leads = []; }

function setStatusLine(t) { const s = $('wa-queue-status'); if (s) s.textContent = t; }

function renderTools() {
  const host = $('wa-tools'); if (!host) return;
  host.replaceChildren();
  if (!wahaReady()) return;
  const b = mk('button', 'btn', 'Auto hantar WAHA ke lead Baharu');
  b.id = 'wa-queue';
  const st = mk('p', 'wa-note'); st.id = 'wa-queue-status'; st.setAttribute('role', 'status');
  st.textContent = `WAHA hari ini: ${waha.sent_today || 0}/${waha.daily_limit}`;
  b.onclick = () => queueBusy ? (queueStop = true, b.textContent = 'Menghentikan...') : runQueue(b);
  host.append(b, st);
}

async function runQueue(btn) {
  if (!tpls.length) { setStatusLine('Tiada ayat aktif. Owner perlu jana ayat dahulu.'); return; }
  const targets = leads.filter((x) => x.r.status === 'new' && /^\+601\d{8,9}$/.test(x.r.phone));
  if (!targets.length) { setStatusLine('Tiada lead Baharu pada halaman ini.'); return; }
  const left = Math.max(0, waha.daily_limit - (waha.sent_today || 0));
  const n = Math.min(targets.length, left);
  if (!n) { setStatusLine(`Had ${waha.daily_limit} sehari dicapai.`); return; }
  if (!confirm(`Hantar mesej WAHA kepada ${n} lead Baharu?\nSatu demi satu, jarak rawak ${waha.min_gap_sec}–${waha.min_gap_sec * 2} saat. Biarkan halaman ini terbuka.`)) return;
  queueBusy = true; queueStop = false; btn.textContent = 'Henti auto hantar'; btn.classList.add('danger');
  let done = 0;
  try {
    for (const x of targets.slice(0, n)) {
      if (queueStop) break;
      setStatusLine(`Menghantar kepada ${x.r.name} (${done + 1}/${n})...`);
      try {
        await sendOne(x, null);
        done++;
      } catch (e) {
        if (e.code === 'gap' && e.wait) { await countdown(e.wait + 3); if (!queueStop) { try { await sendOne(x, null); done++; } catch (e2) { setStatusLine('Gagal: ' + e2.message); if (e2.code === 'daily_limit') break; } } }
        else if (e.code === 'daily_limit') { setStatusLine(e.message); break; }
        else if (e.code === 'lead_recent') { continue; }
        else { if (/^(WAHA \d|Tidak dapat sambung)/.test(e.message)) addSend(x, 'waha', 'failed'); setStatusLine(`Gagal (${x.r.name}): ${e.message}`); break; }
      }
      if (done >= n || queueStop) break;
      await countdown(waha.min_gap_sec + Math.floor(Math.random() * waha.min_gap_sec));
    }
  } finally {
    queueBusy = false; btn.textContent = 'Auto hantar WAHA ke lead Baharu'; btn.classList.remove('danger');
    setStatusLine(`${queueStop ? 'Dihentikan. ' : 'Selesai. '}${done} mesej dihantar · WAHA hari ini: ${waha.sent_today || 0}/${waha.daily_limit}`);
    hooks.onSent?.();
  }
}
async function countdown(sec) {
  for (let s = sec; s > 0 && !queueStop; s--) {
    const base = ($('wa-queue-status')?.textContent || '').replace(/ · seterusnya dalam \d+s$/, '');
    setStatusLine(base + ` · seterusnya dalam ${s}s`);
    await sleep(1000);
  }
}

async function sendOne(x, tplId) {
  const res = await invoke({ action: 'send', lead_id: x.r.id, template_id: tplId || undefined });
  waha.sent_today = res.sent_today;
  addSend(x, 'waha', 'sent');
  if (x.r.status === 'new') x.setStatus('contacted');
  x.box.replaceChildren(mk('p', 'wa-sent', 'Dihantar melalui WAHA: ' + res.text));
  x.box.hidden = false;
  return res;
}

// Butang untuk setiap lead: WhatsApp (manual, ayat rawak) + Hantar WAHA (jika aktif)
export function buttons(r, setStatus) {
  const w = mk('a', 'btn wa', 'WhatsApp');
  w.target = '_blank'; w.rel = 'noopener noreferrer';
  w.href = 'https://wa.me/' + r.phone.slice(1);
  const box = mk('div', 'wa-box'); box.hidden = true;
  const badge = mk('div', 'wa-status'); badge.setAttribute('aria-label', 'Status WhatsApp');
  const x = { r, box, setStatus, badge, sends: null };
  leads.push(x);
  w.addEventListener('click', () => {
    const t = randomTpl();
    // tiada ayat: buka chat kosong
    w.href = 'https://wa.me/' + r.phone.slice(1) + (t ? '?text=' + encodeURIComponent(fill(t.body, r.name)) : '');
    client.from('tiktok_wa_sends').insert({ lead_id: r.id, template_id: t?.id || null, channel: 'manual', status: 'opened' }).then(() => {}, () => {});
    addSend(x, 'manual', 'opened');
    // Lead Baharu automatik jadi Dihubungi bila WhatsApp dibuka
    if (r.status === 'new') {
      client.from('tiktok_leads').update({ status: 'contacted' }).eq('id', r.id).eq('status', 'new').select('id,status').maybeSingle()
        .then(({ data, error }) => {
          const st = $('status');
          if (error) { if (st) st.textContent = 'Gagal tukar status: ' + error.message; return; }
          if (data) { setStatus(data.status); if (st) st.textContent = 'Status ditukar ke Dihubungi'; hooks.onSent?.(); }
        }, () => {});
    }
  });
  const out = [w, badge];
  if (wahaReady()) {
    const b = mk('button', 'btn waha', 'Hantar WAHA');
    b.type = 'button';
    b.onclick = () => preview(x, b);
    out.push(b);
  }
  out.push(box);
  return out;
}

function preview(x, btn) {
  if (!tpls.length) { x.box.replaceChildren(mk('p', 'wa-err', 'Tiada ayat aktif. Owner perlu jana ayat dahulu.')); x.box.hidden = false; return; }
  let t = randomTpl();
  const txt = mk('p', 'wa-preview'), row = mk('div', 'wa-row');
  const swap = mk('button', 'btn', 'Tukar ayat'), send = mk('button', 'btn primary', 'Hantar'), cancel = mk('button', 'btn ghost', 'Batal');
  const show = () => { txt.textContent = fill(t.body, x.r.name); };
  show();
  swap.onclick = () => { t = randomTpl(t.id); show(); };
  cancel.onclick = () => { x.box.hidden = true; x.box.replaceChildren(); };
  send.onclick = async () => {
    send.disabled = swap.disabled = btn.disabled = true; send.textContent = 'Menghantar...';
    try { await sendOne(x, t.id); hooks.onSent?.(); renderToolsCount(); }
    catch (e) { if (/^(WAHA \d|Tidak dapat sambung)/.test(e.message)) addSend(x, 'waha', 'failed'); x.box.append(mk('p', 'wa-err', e.message)); send.disabled = swap.disabled = false; send.textContent = 'Hantar'; }
    finally { btn.disabled = false; }
  };
  row.append(swap, send, cancel);
  x.box.replaceChildren(mk('small', null, 'Pratonton mesej WAHA'), txt, row);
  x.box.hidden = false;
}
function renderToolsCount() { if (!queueBusy && waha) setStatusLine(`WAHA hari ini: ${waha.sent_today || 0}/${waha.daily_limit}`); }

// ---------- Panel owner: ayat AI + tetapan WAHA ----------
function renderPanel() {
  const panel = $('wa-panel'); if (!panel) return;
  panel.hidden = false;
  const body = $('wa-panel-body'); body.replaceChildren();

  const tplCard = mk('div', 'wa-card');
  const h = mk('h3', null, 'Ayat WhatsApp rawak');
  const info = mk('p', 'wa-note', `${tpls.length} ayat aktif. Setiap kali tekan WhatsApp atau hantar WAHA, satu ayat dipilih secara rawak dan {nama} diganti dengan nama pelanggan.`);
  const gen = mk('button', 'btn primary', tpls.length ? 'Jana semula 50 ayat AI' : 'Jana 50 ayat AI');
  const gst = mk('p', 'wa-note'); gst.setAttribute('role', 'status');
  gen.onclick = async () => {
    if (tpls.length && !confirm('Ganti semua ayat aktif dengan 50 ayat baharu?')) return;
    gen.disabled = true; gst.textContent = 'AI sedang menulis ayat... (15–40 saat)';
    try { const res = await invoke({ action: 'generate', count: 50 }); await loadTemplates(); renderPanel(); $('wa-panel-status').textContent = res.count + ' ayat baharu disimpan.'; }
    catch (e) { gst.textContent = 'Gagal: ' + e.message; gen.disabled = false; }
  };
  const list = mk('details', 'wa-list'); list.append(mk('summary', null, 'Lihat semua ayat'));
  tpls.forEach((t, i) => {
    const row = mk('div', 'wa-tpl'), p = mk('p', null, (i + 1) + '. ' + t.body), del = mk('button', 'btn ghost', 'Buang');
    del.onclick = async () => {
      del.disabled = true;
      const { error } = await client.from('tiktok_wa_templates').update({ active: false }).eq('id', t.id);
      if (error) { del.disabled = false; gst.textContent = 'Gagal buang: ' + error.message; return; }
      tpls = tpls.filter((x) => x.id !== t.id); row.remove(); info.textContent = `${tpls.length} ayat aktif.`;
    };
    row.append(p, del); list.append(row);
  });
  tplCard.append(h, info, gen, gst);
  if (tpls.length) tplCard.append(list);

  const f = mk('form', 'wa-card');
  f.append(mk('h3', null, 'Tetapan WAHA'), mk('p', 'wa-note', 'URL WAHA mesti boleh dicapai dari internet (contoh melalui Cloudflare Tunnel). Kunci API disimpan di server dan tidak dipaparkan semula.'));
  const field = (label, input) => { const l = mk('label', null, label); l.append(input); f.append(l); return input; };
  const inp = (type, val, ph) => { const i = document.createElement('input'); i.type = type; i.value = val ?? ''; if (ph) i.placeholder = ph; return i; };
  const url = field('URL WAHA', inp('url', waha?.base_url, 'https://waha.contoh.com'));
  const ses = field('Session', inp('text', waha?.session || 'default'));
  const key = field('Kunci API (X-Api-Key)', inp('password', '', waha?.has_key ? 'Tersimpan — biar kosong untuk kekal' : 'Masukkan kunci API'));
  key.autocomplete = 'new-password';
  const grid = mk('div', 'wa-grid'); f.append(grid);
  const lim = inp('number', waha?.daily_limit ?? 30); lim.min = 1; lim.max = 200;
  const gap = inp('number', waha?.min_gap_sec ?? 60); gap.min = 20; gap.max = 3600;
  const l1 = mk('label', null, 'Had mesej sehari'); l1.append(lim);
  const l2 = mk('label', null, 'Jarak minimum (saat)'); l2.append(gap);
  grid.append(l1, l2);
  const en = document.createElement('input'); en.type = 'checkbox'; en.checked = !!waha?.enabled;
  const le = mk('label', 'wa-check'); le.append(en, document.createTextNode(' Aktifkan hantar melalui WAHA'));
  f.append(le);
  const save = mk('button', 'btn primary', 'Simpan tetapan WAHA'); save.type = 'submit';
  const fst = mk('p', 'wa-note', waha ? `Hari ini: ${waha.sent_today || 0}/${waha.daily_limit} mesej WAHA dihantar.` : ''); fst.setAttribute('role', 'status');
  f.append(save, fst);
  f.onsubmit = async (e) => {
    e.preventDefault(); save.disabled = true; fst.textContent = 'Menyimpan...';
    const { error } = await client.rpc('waha_config_set', { p_base_url: url.value.trim(), p_session: ses.value.trim(), p_api_key: key.value.trim(), p_enabled: en.checked, p_daily_limit: Number(lim.value) || 30, p_min_gap_sec: Number(gap.value) || 60 });
    save.disabled = false;
    if (error) { fst.textContent = 'Gagal: ' + error.message; return; }
    await loadWaha(); renderPanel(); renderTools(); hooks.onConfig?.();
    $('wa-panel-status').textContent = 'Tetapan WAHA disimpan.';
  };
  body.append(tplCard, f);
}

// ---------- Status WhatsApp: bezakan Manual dan WAHA ----------
const fmt = (d) => new Date(d).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
function addSend(x, channel, status) {
  x.sends = [{ channel, status, created_at: new Date().toISOString() }, ...(x.sends || [])];
  paintBadge(x);
}
function chip(cls, label, sub) {
  const c = mk('span', 'wa-chip ' + cls, label);
  if (sub) { c.append(' ', mk('small', null, sub)); }
  return c;
}
function paintBadge(x) {
  const list = x.sends || [];
  x.badge.replaceChildren();
  if (!list.length) { x.badge.append(chip('none', 'Belum WhatsApp')); return; }
  const manual = list.filter((s) => s.channel === 'manual');
  const sent = list.filter((s) => s.channel === 'waha' && s.status === 'sent');
  const failed = list.filter((s) => s.channel === 'waha' && s.status === 'failed');
  if (manual.length) x.badge.append(chip('manual', 'Manual' + (manual.length > 1 ? ' ×' + manual.length : ''), fmt(manual[0].created_at)));
  if (sent.length) x.badge.append(chip('waha', 'WAHA dihantar' + (sent.length > 1 ? ' ×' + sent.length : ''), fmt(sent[0].created_at)));
  // Tunjuk gagal hanya jika ia cubaan WAHA terkini (selepas hantaran berjaya terakhir)
  if (failed.length && (!sent.length || new Date(failed[0].created_at) > new Date(sent[0].created_at))) x.badge.append(chip('fail', 'WAHA gagal', fmt(failed[0].created_at)));
}
export async function loadBadges() {
  const items = leads.slice();
  if (!items.length) return;
  const { data, error } = await client.from('tiktok_wa_sends').select('lead_id,channel,status,created_at')
    .in('lead_id', items.map((x) => x.r.id)).order('created_at', { ascending: false }).limit(1000);
  if (error) return; // jadual belum tersedia: biar kosong
  const by = new Map();
  for (const s of data || []) { if (!by.has(s.lead_id)) by.set(s.lead_id, []); by.get(s.lead_id).push(s); }
  for (const x of items) { if (!leads.includes(x)) continue; x.sends = by.get(x.r.id) || []; paintBadge(x); }
}
