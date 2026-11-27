// TikTok Lead – halaman utama (V2: susun atur iPad/PC, menu ikut status, susunan)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import * as WA from './tiktok-wa.js?v=6';

const client = createClient('https://buzpdyvvoiqgbeventwm.supabase.co', 'sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0');
const $ = (id) => document.getElementById(id);
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const STATES = { new: 'Baharu', contacted: 'Dihubungi', interested: 'Berminat', closed: 'Selesai', not_interested: 'Tidak berminat' };
const TAB_TITLE = { ...STATES, all: 'Semua lead' };
const QUEUE_TITLE = { today: 'Follow up hari ini', overdue: 'Tertunggak', never: 'Belum ada catatan', upcoming: 'Akan datang', unscheduled: 'Belum dijadualkan' };
const PAGE = 48;
const fmtDate = (d) => new Date(d).toLocaleDateString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = (d) => new Date(d).toLocaleDateString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short' });
const fmtTime = (d) => new Date(d).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });

let me = null, staff = [], page = 0, busy = false, counts = {};
const staffName = (id) => {
  const p = staff.find((x) => x.id === id);
  if (!p) return id ? 'Staff terdahulu' : 'Belum diambil';
  if (p.role === 'owner' && me.role !== 'owner') return 'Belum diambil';
  return p.id === me.id ? (p.full_name || 'Anda') + ' (anda)' : (p.full_name || 'Staff');
};
const unclaimed = (id) => !id || staff.some((p) => p.id === id && p.role === 'owner');
const senderName = (id) => id === me.id ? (me.full_name || 'Anda') : (staff.find((p) => p.id === id)?.full_name || (id ? 'Staff terdahulu' : 'Tidak direkodkan'));
let tab = 'new', queue = '';
let sort = (() => { try { return localStorage.getItem('tt_sort') || 'new'; } catch (_) { return 'new'; } })();
$('sort').value = sort;

// ---------- Menu ----------
function setOn(navId, attr, val) {
  for (const b of $(navId).querySelectorAll(`[${attr}]`)) b.classList.toggle('on', b.getAttribute(attr) === val);
}
function setTitle() {
  const t = TAB_TITLE[tab] || 'Lead';
  $('view-title').firstChild.textContent = queue ? `${t} · ${QUEUE_TITLE[queue]}` : t;
}
function showView(v) {
  $('view-list').hidden = v !== 'list';
  $('view-wa').hidden = v !== 'wa';
  $('view-staff').hidden = v !== 'staff';
  $('open-wa').classList.toggle('on', v === 'wa');
  $('open-staff').classList.toggle('on', v === 'staff');
  if (v !== 'list') { setOn('tabs', 'data-tab', '__'); }
  else setOn('tabs', 'data-tab', tab);
  window.scrollTo({ top: 0 });
}
$('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  tab = b.dataset.tab; page = 0; setTitle(); showView('list'); load();
});
$('queues').addEventListener('click', (e) => {
  const b = e.target.closest('[data-queue]'); if (!b) return;
  queue = b.dataset.queue; page = 0; setOn('queues', 'data-queue', queue); setTitle(); showView('list'); load();
});
$('open-wa').onclick = $('m-open-wa').onclick = () => showView('wa');
$('open-staff').onclick = $('m-open-staff').onclick = () => { showView('staff'); loadStaffReport(); };
for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => showView('list');
$('sort').onchange = () => { sort = $('sort').value; try { localStorage.setItem('tt_sort', sort); } catch (_) {} page = 0; load(); };
$('apply').onclick = () => { page = 0; load(); };
$('search').onkeydown = (e) => { if (e.key === 'Enter') $('apply').click(); };
$('search').addEventListener('search', () => { if (!$('search').value) { page = 0; load(); } });
$('prev').onclick = () => { if (page > 0) { page--; load(); } };
$('next').onclick = () => { page++; load(); };
$('refresh').onclick = () => { loadCounts(); if (!$('view-list').hidden) load(); else if (!$('view-staff').hidden) loadStaffReport(); };

// ---------- Kiraan ----------
async function loadCounts() {
  const { data, error } = await client.rpc('tiktok_followup_summary');
  if (error) return;
  counts = data?.[0] || {};
  for (const el of document.querySelectorAll('[data-count]')) el.textContent = String(counts[el.dataset.count] ?? 0);
  setSub();
}
function setSub(shown) {
  const key = { new: 'new_leads', all: 'total' }[tab] || tab;
  const total = counts[key];
  const sub = $('view-sub');
  if (queue || $('search').value.trim()) sub.textContent = shown != null ? `${shown} dipaparkan` : '';
  else sub.textContent = total != null ? `${total} lead` : '';
}

// ---------- Prestasi Sale Advisor ----------
async function loadStaffReport() {
  const target = $('staff-results');
  target.textContent = 'Memuatkan...';
  try {
    const { data, error } = await client.rpc('tiktok_staff_performance');
    if (error) throw error;
    target.replaceChildren();
    if (!data.length) target.textContent = 'Belum ada lead diagihkan';
    for (const r of data) {
      const a = mk('article');
      a.append(mk('strong', null, r.staff_name),
        mk('p', null, `Lead: ${r.total} · Dihubungi: ${r.contacted} · Berminat: ${r.interested} · Selesai: ${r.closed} · Tertunggak: ${r.overdue}`),
        mk('small', null, 'Kadar status dihubungi: ' + (Number(r.total) ? Math.round(100 * Number(r.contacted) / Number(r.total)) : 0) + '%'));
      target.append(a);
    }
  } catch (e) { target.textContent = 'Laporan gagal: ' + e.message; }
}
$('staff-refresh').onclick = loadStaffReport;

// ---------- Kad lead ----------
function afterStatus(card, r, v) {
  r.status = v;
  loadCounts();
  if (tab !== 'all' && v !== tab) {
    card.classList.add('moving');
    $('status').textContent = `${r.name} dipindah ke ${STATES[v]}`;
    setTimeout(() => { card.remove(); if (!$('list').querySelector('.lead')) $('list').append(mk('div', 'empty', 'Semua lead dalam senarai ini sudah diproses.')); }, 450);
  }
}

function leadCard(r) {
  const a = mk('article', 'lead'), h = mk('strong', null, r.name), p = mk('p', 'info'), s = mk('select', 'status');
  const info = () => { p.textContent = [r.phone, r.city, r.state, r.occupation].filter(Boolean).join(' · '); if (matchMedia('(max-width:899px)').matches) p.append(mk('span', 'when', ' · ' + fmtShort(r.created_at))); };
  info();
  s.setAttribute('aria-label', 'Status follow up');
  for (const [v, t] of Object.entries(STATES)) { const o = mk('option', null, t); o.value = v; s.append(o); }
  s.value = r.status; s.dataset.v = r.status;
  s.onchange = async () => {
    const prev = r.status;
    s.dataset.v = s.value; s.disabled = true;
    try {
      await saveStatus(s.value, false);
      $('status').textContent = 'Status disimpan';
    } catch (e) { s.value = prev; s.dataset.v = prev; $('status').textContent = 'Gagal: ' + e.message; }
    finally { s.disabled = false; }
  };
  a.append(h, p, s, mk('p', 'meta', 'Masuk ' + fmtDate(r.created_at)));

  const ownerLabel = mk('p', 'owner');
  const paintOwner = () => { ownerLabel.textContent = 'Staff: ' + staffName(r.assigned_to); ownerLabel.classList.toggle('mine', r.assigned_to === me.id); };
  paintOwner();
  a.append(ownerLabel);
  let syncAssign = () => {};
  // Status dan agihan disimpan bersama, berdasarkan profil akaun yang disahkan.
  // Agihan kepada staff lain dikekalkan; nama penghantar sebenar dipaparkan pada badge WhatsApp.
  async function saveStatus(v, fromWhatsApp) {
    let current = { status: r.status, assigned_to: r.assigned_to };
    if (fromWhatsApp) {
      const { data, error } = await client.from('tiktok_leads').select('status,assigned_to').eq('id', r.id).single();
      if (error) throw error;
      current = data;
      v = current.status === 'new' ? 'contacted' : current.status;
    }
    const patch = { status: v };
    if (v === 'contacted' && unclaimed(current.assigned_to) && current.assigned_to !== me.id) patch.assigned_to = me.id;
    let data = current;
    if (v !== current.status || 'assigned_to' in patch) {
      let query = client.from('tiktok_leads').update(patch).eq('id', r.id).eq('status', current.status);
      if ('assigned_to' in patch) query = current.assigned_to ? query.eq('assigned_to', current.assigned_to) : query.is('assigned_to', null);
      const result = await query.select('id,status,assigned_to').maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw Error('Lead telah berubah. Muat semula sebelum mencuba lagi.');
      data = result.data;
    }
    r.assigned_to = data.assigned_to; paintOwner(); syncAssign();
    s.value = data.status; s.dataset.v = data.status;
    if (r.status !== data.status) afterStatus(a, r, data.status);
  }
  if (me.role === 'owner') {
    const ass = mk('select', 'assign');
    ass.setAttribute('aria-label', 'Agih pelanggan kepada staff');
    const ph = mk('option', null, 'Pilih staff'); ph.value = ''; ph.disabled = true; ass.append(ph);
    for (const person of staff) { const o = mk('option', null, person.full_name || 'Staff'); o.value = person.id; ass.append(o); }
    const sync = () => { ass.value = staff.some((x) => x.id === r.assigned_to) ? r.assigned_to : ''; };
    syncAssign = sync;
    sync();
    ass.onchange = async () => {
      ass.disabled = true;
      try {
        const { data, error } = await client.from('tiktok_leads').update({ assigned_to: ass.value }).eq('id', r.id).select('id,assigned_to').single();
        if (error) throw error;
        r.assigned_to = data.assigned_to;
        paintOwner();
        $('status').textContent = 'Agihan disimpan';
      } catch (e) { sync(); $('status').textContent = 'Agihan gagal: ' + e.message; }
      finally { ass.disabled = false; }
    };
    a.append(ass);
  }
  if (/^\+601\d{8,9}$/.test(r.phone)) {
    a.append(...WA.buttons(r, () => saveStatus('contacted', true)));
  }

  // Edit maklumat
  const ed = mk('details', 'edit'), eb = mk('button', null, 'Simpan maklumat'), ef = {};
  ed.append(mk('summary', null, 'Edit maklumat'));
  for (const [k, t] of Object.entries({ name: 'Nama', phone: 'Telefon', city: 'Bandar', state: 'Negeri', occupation: 'Pekerjaan' })) {
    const l = mk('label', null, t), i = mk('input');
    l.style.display = 'block'; i.value = r[k] || ''; i.maxLength = k === 'name' ? 200 : 100;
    ef[k] = i; l.append(i); ed.append(l);
  }
  ed.append(eb);
  eb.onclick = async () => {
    const name = ef.name.value.trim();
    let ph = ef.phone.value.replace(/[\s()+.-]/g, '');
    if (ph.startsWith('0')) ph = '60' + ph.slice(1); else if (/^1\d{8,9}$/.test(ph)) ph = '60' + ph;
    if (!name) { $('status').textContent = 'Nama diperlukan'; return; }
    if (!/^601\d{8,9}$/.test(ph)) { $('status').textContent = 'Nombor telefon tidak sah'; return; }
    eb.disabled = true;
    try {
      const upd = { name, phone: '+' + ph, city: ef.city.value.trim() || null, state: ef.state.value.trim() || null, occupation: ef.occupation.value.trim() || null };
      const { data, error } = await client.from('tiktok_leads').update(upd).eq('id', r.id).select('id,name,phone,city,state,occupation').single();
      if (error) throw Error(error.code === '23505' ? 'Nombor ini sudah wujud pada lead lain' : error.message);
      Object.assign(r, data); h.textContent = r.name; info(); ef.phone.value = r.phone;
      $('status').textContent = 'Maklumat disimpan';
    } catch (e) { $('status').textContent = 'Gagal: ' + e.message; }
    finally { eb.disabled = false; }
  };
  if (me.role === 'owner') a.append(ed); // V130: edit maklumat lead untuk Owner sahaja

  // Sejarah follow up
  const details = mk('details'), history = mk('div'), note = mk('textarea'), due = mk('input'), save = mk('button', null, 'Simpan catatan');
  note.placeholder = 'Catatan follow up'; note.maxLength = 2000;
  due.type = 'datetime-local'; due.setAttribute('aria-label', 'Tarikh follow up berikutnya');
  details.append(mk('summary', null, 'Sejarah follow up'), history, note, due, save);
  async function loadHistory() {
    history.textContent = 'Memuatkan...';
    const { data, error } = await client.from('tiktok_lead_followups').select('note,created_at,created_by,next_followup_at').eq('lead_id', r.id).order('created_at', { ascending: false }).limit(30);
    history.replaceChildren();
    if (error) { history.textContent = 'Sejarah belum tersedia: ' + error.message; return; }
    if (!data.length) history.textContent = 'Tiada catatan';
    for (const item of data) {
      history.append(mk('p', null, fmtTime(item.created_at) + ' · ' + (staff.find((x) => x.id === item.created_by)?.full_name || 'Staff terdahulu') + ' · ' + item.note + (item.next_followup_at ? ' · Susulan: ' + fmtTime(item.next_followup_at) : '')));
    }
  }
  details.ontoggle = () => { if (details.open) loadHistory(); };
  save.onclick = async () => {
    if (!note.value.trim()) return;
    save.disabled = true;
    try {
      const { error } = await client.from('tiktok_lead_followups').insert({ lead_id: r.id, note: note.value.trim(), next_followup_at: due.value ? new Date(due.value.slice(0, 16) + ':00+08:00').toISOString() : null });
      if (error) throw error;
      note.value = ''; due.value = '';
      await loadHistory(); loadCounts();
    } catch (e) { $('status').textContent = 'Catatan gagal: ' + e.message; }
    finally { save.disabled = false; }
  };
  a.append(details);
  return a;
}

// ---------- Senarai ----------
let loadSeq = 0;
async function load() {
  const seq = ++loadSeq;
  busy = true;
  $('list').replaceChildren(); WA.reset();
  $('status').textContent = 'Memuatkan...';
  $('next').hidden = true; $('prev').hidden = true;
  try {
    let q = (queue ? client.rpc('tiktok_followup_queue', { p_filter: queue }) : client.from('tiktok_leads'))
      .select('id,name,phone,city,state,occupation,status,created_at,assigned_to');
    const term = $('search').value.trim().replace(/[^\p{L}\p{N}\s+]/gu, '');
    if (term) {
      const digits = term.replace(/\D/g, '');
      if (/^\+?[\d\s]+$/.test(term)) q = q.ilike('phone', '%' + (digits.startsWith('0') ? '60' + digits.slice(1) : digits) + '%');
      else q = q.ilike('name', '%' + term + '%');
    }
    if (tab !== 'all') q = q.eq('status', tab);
    if (sort === 'az' || sort === 'za') q = q.order('name', { ascending: sort === 'az' });
    q = q.order('created_at', { ascending: sort === 'old' }).order('id');
    const { data, error } = await q.range(page * PAGE, page * PAGE + PAGE - 1);
    if (seq !== loadSeq) return;
    if (error) throw error;
    const from = page * PAGE + 1;
    $('status').textContent = data.length ? `Rekod ${from}–${from + data.length - 1}` : '';
    $('next').hidden = data.length < PAGE;
    $('prev').hidden = page === 0;
    setSub(data.length);
    if (!data.length) $('list').append(mk('div', 'empty', term ? 'Tiada lead sepadan dengan carian.' : tab === 'new' ? 'Tiada lead Baharu. Semua sudah dihubungi.' : 'Tiada lead dalam senarai ini.'));
    for (const r of data) $('list').append(leadCard(r));
    WA.loadBadges();
  } catch (e) {
    if (seq === loadSeq) $('status').textContent = e.message;
  } finally {
    if (seq === loadSeq) busy = false;
  }
}

// ---------- Mula ----------
async function start() {
  try {
    const { data: auth, error: ae } = await client.auth.getUser();
    if (ae || !auth?.user) throw Error('Sila log masuk melalui dashboard.');
    const { data: prof, error: pe } = await client.from('profiles').select('id,full_name,role,enabled,permissions').eq('id', auth.user.id).single();
    const tk = prof?.permissions && typeof prof.permissions === 'object' ? prof.permissions.tiktok : undefined;
    const okTk = prof?.role === 'owner' || (typeof tk === 'boolean' ? tk : prof?.role === 'sales_advisor');
    if (pe || !prof?.enabled || !okTk) throw Error('Akses tidak dibenarkan');
    // V129: staff lain yang diberi akses TikTok Lead berfungsi sama seperti Sales Advisor dalam halaman ini.
    if (prof.role !== 'owner') prof.role = 'sales_advisor';
    me = prof; staff = [me];
    const { data: team } = await client.rpc('tiktok_staff_names');
    if (Array.isArray(team) && team.length) staff = team;
    if (me.role === 'owner') {
      for (const id of ['open-wa', 'open-staff', 'm-open-wa', 'm-open-staff', 'm-import', 'side-import', 'tools-wrap']) $(id).hidden = false;
    }
    await WA.init(client, me, { onSent: loadCounts, onConfig: () => load(), senderName });
    setTitle(); setOn('tabs', 'data-tab', tab);
    await Promise.all([loadCounts(), load()]);
  } catch (e) { $('status').textContent = e.message; }
}
client.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') { $('list').replaceChildren(); $('status').textContent = 'Sesi tamat. Sila log masuk.'; }
});
start();
