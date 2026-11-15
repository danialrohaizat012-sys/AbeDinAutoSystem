// Abe Din Auto – modul Permohonan (borang bakal pembeli dari permohonan.html).
// Dimuat oleh app.html melalui import('./js/permohonan.js'). Jadual: loan_applications (lihat V51_PERMOHONAN_MIGRATION.sql).
// UI diasingkan dalam Shadow DOM supaya tidak bercampur dengan CSS sistem sedia ada.
const CSS = `
:host{display:block;--bg:#080b0c;--card:#121718;--soft:rgba(255,255,255,.055);--line:#2d3536;--fg:#f3eee2;--mute:#969da8;
  --gold:#d8ad57;--gold-fg:#0b0d0e;--ok:#45c98b;--bad:#e47777;--warn:#e6b75d;--info:#7fb4ff;
  --f:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f)}
.wrap{display:flex;flex-direction:column;gap:14px;max-width:900px}
h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.01em}
h3{margin:0 0 12px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.head p{margin:4px 0 0;color:var(--mute);font-size:14px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn{border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:9px 14px;font-weight:700;font-size:14px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;color:var(--fg)}
.btn.pri{background:var(--gold);border-color:var(--gold);color:var(--gold-fg)}
.btn.wa{background:#1fa855;border-color:#1fa855;color:#fff}
.btn.danger{color:var(--bad);border-color:rgba(228,119,119,.4);background:transparent}
.btn.danger.armed{background:var(--bad);color:#fff}
.btn[disabled]{opacity:.55;cursor:wait}
.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.tab{white-space:nowrap;border:1px solid var(--line);background:transparent;border-radius:99px;padding:7px 13px;font-size:13.5px;font-weight:600;color:var(--mute)}
.tab.on{background:var(--gold);border-color:var(--gold);color:var(--gold-fg)}
.tab b{font-weight:800;margin-left:4px}
.search{width:100%;background:#0b0f10;border:1px solid var(--line);border-radius:12px;padding:11px 13px;outline:none}
.search:focus,textarea:focus,select:focus{border-color:var(--gold)}
.list{display:grid;gap:10px}
.item{display:grid;grid-template-columns:1fr auto;gap:4px 12px;text-align:left;width:100%;border:1px solid var(--line);border-radius:16px;
  background:linear-gradient(150deg,#151b1c,#0d1112);padding:14px 15px}
.item:hover{border-color:#4a3f28}
.item strong{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.item .car{grid-column:1/-1;color:var(--fg);opacity:.85;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.item small{grid-column:1/-1;color:var(--mute);font-size:12.5px}
.chip{font-size:11.5px;font-weight:800;letter-spacing:.04em;border-radius:99px;padding:4px 9px;white-space:nowrap;align-self:start;border:1px solid}
.s-baru{color:var(--gold);border-color:rgba(216,173,87,.5);background:rgba(216,173,87,.1)}
.s-dalam_proses{color:var(--info);border-color:rgba(127,180,255,.45);background:rgba(127,180,255,.08)}
.s-lulus{color:var(--ok);border-color:rgba(69,201,139,.45);background:rgba(69,201,139,.08)}
.s-ditolak{color:var(--bad);border-color:rgba(228,119,119,.45);background:rgba(228,119,119,.08)}
.s-batal{color:var(--mute);border-color:var(--line);background:var(--soft)}
.empty,.note{border:1px dashed var(--line);border-radius:16px;padding:22px;text-align:center;color:var(--mute)}
.note.err{border-style:solid;border-color:rgba(228,119,119,.45);color:#ffd2d2;text-align:left}
.note code{background:var(--soft);padding:2px 6px;border-radius:6px;color:var(--fg)}
.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(150deg,#151b1c,#0d1112);padding:17px}
dl{margin:0;display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:9px 14px}
dt{color:var(--mute);font-size:13.5px}
dd{margin:0;white-space:pre-wrap;word-break:break-word}
dd a{color:var(--gold)}
@media (max-width:520px){dl{grid-template-columns:1fr;gap:2px}dd{margin-bottom:8px}}
.top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
.top .meta{color:var(--mute);font-size:13px;margin-top:4px}
.statusbar{display:flex;gap:6px;flex-wrap:wrap}
.statusbar button{border:1px solid var(--line);background:transparent;border-radius:99px;padding:7px 12px;font-size:13px;font-weight:700;color:var(--mute)}
.statusbar button.on{color:var(--gold-fg);background:var(--gold);border-color:var(--gold)}
textarea{width:100%;min-height:90px;background:#0b0f10;border:1px solid var(--line);border-radius:12px;padding:11px 12px;outline:none;resize:vertical}
.back{background:none;border:0;color:var(--gold);font-weight:700;padding:0}
.saved{color:var(--ok);font-size:13px}
.more{justify-self:center}
`;

const STATUS = [
  ['baru', 'Baru'], ['dalam_proses', 'Dalam proses'], ['lulus', 'Lulus'], ['ditolak', 'Ditolak'], ['batal', 'Batal']
];
const LABEL = Object.fromEntries(STATUS);
const MON = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
const PAGE = 40;

const S = { client: null, owner: false, rows: [], loaded: false, err: '', tab: 'semua', q: '', open: null, shown: PAGE,
  busy: false, armed: false, saved: '' };
let root = null, app = null, onChange = null;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => (n < 10 ? '0' : '') + n;
const when = iso => { const d = new Date(iso); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dmy = v => { const [y, m, d] = String(v || '').split('-'); return d ? `${+d} ${MON[+m - 1]} ${y}` : '-'; };
const msisdn = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '6' + d; return d; };
const formUrl = () => new URL('permohonan.html', location.href).href.split('?')[0];
const byId = id => S.rows.find(r => r.id === id);

function serviceYears(start) {
  if (!start) return '';
  const s = new Date(start), n = new Date();
  let m = (n.getFullYear() - s.getFullYear()) * 12 + n.getMonth() - s.getMonth();
  if (n.getDate() < s.getDate()) m--;
  if (m < 0) return '';
  const y = Math.floor(m / 12), r = m % 12;
  return ' (' + [y ? y + ' thn' : '', r ? r + ' bln' : '', !y && !r ? 'kurang 1 bln' : ''].filter(Boolean).join(' ') + ')';
}

function asText(r) {
  return `*BORANG PERMOHONAN ABE DIN AUTO*
Diterima: ${when(r.created_at)} · Status: ${LABEL[r.status] || r.status}

*MAKLUMAT PEMOHON*
1. Nama Penuh : ${r.full_name}
2. No I/C : ${r.ic_no}
3. Alamat Tetap : ${r.permanent_addr}
4. Alamat Sekarang : ${r.current_addr}
5. Tempoh Menetap : ${r.stay_duration}
6. No Tel Bimbit : ${r.phone}
7. Bilangan Tanggungan : ${r.dependents}
8. Taraf Perkahwinan : ${r.marital_status}
9. Bangsa : ${r.race}
10. Agama : ${r.religion}
11. Taraf Pemilikan Rumah : ${r.home_ownership}
12. Pendidikan Tertinggi : ${r.education}
13. Alamat Email : ${r.email}

*MAKLUMAT PEKERJAAN PEMOHON*
1. Nama Majikan : ${r.employer}
2. Alamat Majikan : ${r.employer_addr}
3. Jawatan : ${r.job_title}
4. Tarikh Mula Berkhidmat : ${dmy(r.job_start)}
5. Gred / Pangkat : ${r.job_grade || '-'}
6. No. Tel Pejabat/Majikan/HR : ${r.office_phone}

*MAKLUMAT PERUJUK/WARIS*
1. Nama : ${r.ref_name}
2. No. Tel Bimbit : ${r.ref_phone}
3. Alamat : ${r.ref_addr}
4. Hubungan : ${r.ref_relation}

*NAK JENIS KERETA APA?*
${r.car_wanted}`;
}

async function load() {
  S.err = '';
  const { data, error } = await S.client.from('loan_applications').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) {
    S.err = /does not exist|schema cache|loan_applications/i.test(error.message)
      ? 'Jadual permohonan belum dicipta. Jalankan fail <code>V51_PERMOHONAN_MIGRATION.sql</code> dalam Supabase SQL Editor, kemudian tekan Refresh.'
      : 'Gagal memuatkan permohonan: ' + esc(error.message);
    S.rows = [];
  } else S.rows = data || [];
  S.loaded = true;
  notify();
  render();
}
function notify() { if (onChange) onChange(S.rows.filter(r => r.status === 'baru').length); }

function filtered() {
  const q = S.q.trim().toLowerCase();
  return S.rows.filter(r => (S.tab === 'semua' || r.status === S.tab) &&
    (!q || [r.full_name, r.ic_no, r.phone, r.car_wanted, r.employer, r.email].some(x => String(x || '').toLowerCase().includes(q))));
}

function listView() {
  const counts = Object.fromEntries(STATUS.map(([k]) => [k, S.rows.filter(r => r.status === k).length]));
  const rows = filtered(), show = rows.slice(0, S.shown);
  return `
  <div class="head">
    <div><h2>Permohonan Pembeli</h2><p>Borang yang diisi oleh bakal pembeli melalui link awam.</p></div>
    <div class="row">
      <button class="btn pri" data-act="copylink">Salin link borang</button>
      <a class="btn" href="${esc(formUrl())}" target="_blank" rel="noopener">Buka borang</a>
      <button class="btn" data-act="refresh">Refresh</button>
    </div>
  </div>
  <div class="tabs" role="tablist">
    <button class="tab ${S.tab === 'semua' ? 'on' : ''}" data-tab="semua">Semua<b>${S.rows.length}</b></button>
    ${STATUS.map(([k, l]) => `<button class="tab ${S.tab === k ? 'on' : ''}" data-tab="${k}">${l}<b>${counts[k]}</b></button>`).join('')}
  </div>
  <input class="search" id="q" placeholder="Cari nama, No. I/C, telefon atau kereta..." value="${esc(S.q)}" aria-label="Cari permohonan">
  ${!S.loaded ? '<div class="empty">Memuatkan permohonan...</div>'
    : S.err ? `<div class="note err">${S.err}</div>`
    : !rows.length ? `<div class="empty">${S.rows.length ? 'Tiada permohonan yang sepadan.' : 'Belum ada permohonan. Kongsi link borang kepada bakal pembeli untuk mula menerima permohonan.'}</div>`
    : `<div class="list">${show.map(r => `
      <button class="item" data-open="${r.id}">
        <strong>${esc(r.full_name)}</strong><span class="chip s-${r.status}">${esc(LABEL[r.status] || r.status)}</span>
        <span class="car">${esc(r.car_wanted)}</span>
        <small>${esc(r.phone)} · ${esc(r.job_title)}, ${esc(r.employer)} · ${when(r.created_at)}</small>
      </button>`).join('')}
      ${rows.length > show.length ? `<button class="btn more" data-act="more">Tunjuk lagi (${rows.length - show.length})</button>` : ''}
    </div>`}`;
}

function dl(pairs) {
  return '<dl>' + pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') + '</dl>';
}
function tel(v) { return `<a href="tel:${esc(String(v).replace(/[^0-9+]/g, ''))}">${esc(v)}</a>`; }

function detailView(r) {
  const wa = 'https://wa.me/' + msisdn(r.phone) + '?text=' + encodeURIComponent(`Salam ${r.full_name}, ini Abe Din Auto berkenaan permohonan kereta anda (${r.car_wanted}).`);
  return `
  <button class="back" data-act="back">← Semua permohonan</button>
  <div class="card">
    <div class="top">
      <div><h2>${esc(r.full_name)}</h2><div class="meta">Diterima ${when(r.created_at)}${r.updated_at && r.updated_at !== r.created_at ? ' · dikemas kini ' + when(r.updated_at) : ''}</div></div>
      <span class="chip s-${r.status}">${esc(LABEL[r.status] || r.status)}</span>
    </div>
    <div class="row" style="margin-top:14px">
      <a class="btn wa" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp pemohon</a>
      <a class="btn" href="tel:${esc(String(r.phone).replace(/[^0-9+]/g, ''))}">Telefon</a>
      <button class="btn" data-act="copy">Salin semua maklumat</button>
    </div>
  </div>
  <div class="card">
    <h3>Status & nota</h3>
    <div class="statusbar">${STATUS.map(([k, l]) => `<button class="${r.status === k ? 'on' : ''}" data-status="${k}" ${S.busy ? 'disabled' : ''}>${l}</button>`).join('')}</div>
    <textarea id="note" placeholder="Nota dalaman: cth. dokumen diterima, bank dihantar, tarikh susulan..." maxlength="2000" style="margin-top:12px">${esc(r.staff_note || '')}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn pri" data-act="savenote" ${S.busy ? 'disabled' : ''}>Simpan nota</button><span class="saved">${esc(S.saved)}</span></div>
  </div>
  <div class="card"><h3>Kereta diminati</h3><div style="white-space:pre-wrap;font-size:16px;font-weight:600">${esc(r.car_wanted)}</div></div>
  <div class="card"><h3>Maklumat pemohon</h3>${dl([
    ['Nama penuh', esc(r.full_name)], ['No. I/C', esc(r.ic_no)], ['No. tel bimbit', tel(r.phone)],
    ['Alamat tetap', esc(r.permanent_addr)], ['Alamat sekarang', esc(r.current_addr)], ['Tempoh menetap', esc(r.stay_duration)],
    ['Bilangan tanggungan', esc(r.dependents)], ['Taraf perkahwinan', esc(r.marital_status)], ['Bangsa', esc(r.race)],
    ['Agama', esc(r.religion)], ['Taraf pemilikan rumah', esc(r.home_ownership)], ['Pendidikan tertinggi', esc(r.education)],
    ['Email', `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`]])}</div>
  <div class="card"><h3>Maklumat pekerjaan</h3>${dl([
    ['Nama majikan', esc(r.employer)], ['Alamat majikan', esc(r.employer_addr)], ['Jawatan', esc(r.job_title)],
    ['Mula berkhidmat', esc(dmy(r.job_start)) + esc(serviceYears(r.job_start))], ['Gred / pangkat', esc(r.job_grade || '-')],
    ['Tel pejabat / HR', tel(r.office_phone)]])}</div>
  <div class="card"><h3>Perujuk / waris</h3>${dl([
    ['Nama', esc(r.ref_name)], ['No. tel bimbit', tel(r.ref_phone)], ['Alamat', esc(r.ref_addr)], ['Hubungan', esc(r.ref_relation)]])}</div>
  ${S.owner ? `<div class="row"><button class="btn danger ${S.armed ? 'armed' : ''}" data-act="delete" ${S.busy ? 'disabled' : ''}>${S.armed ? 'Tekan sekali lagi untuk padam' : 'Padam permohonan'}</button></div>` : ''}`;
}

function render() {
  if (!app) return;
  const r = S.open && byId(S.open);
  if (S.open && !r) S.open = null;
  const focusQ = app.getRootNode().activeElement?.id === 'q';
  const caret = focusQ ? app.querySelector('#q').selectionStart : 0;
  app.innerHTML = r ? detailView(r) : listView();
  if (focusQ) { const q = app.querySelector('#q'); if (q) { q.focus(); q.setSelectionRange(caret, caret); } }
}

async function update(r, patch) {
  S.busy = true; render();
  const { data, error } = await S.client.from('loan_applications').update(patch).eq('id', r.id).select().maybeSingle();
  S.busy = false;
  if (error || !data) { S.saved = ''; alertMsg('Gagal simpan: ' + (error?.message || 'tiada akses')); render(); return false; }
  Object.assign(r, data);
  notify(); render();
  return true;
}
function alertMsg(m) { S.saved = ''; const n = app.querySelector('.saved'); if (n) { n.style.color = 'var(--bad)'; n.textContent = m; } else console.warn(m); }

async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) {} t.remove();
  }
  const o = btn.textContent; btn.textContent = 'Disalin ✓'; setTimeout(() => { btn.textContent = o; }, 1600);
}

function onClick(e) {
  const b = e.target.closest('button,[data-open]'); if (!b) return;
  const r = S.open && byId(S.open);
  if (b.dataset.tab) { S.tab = b.dataset.tab; S.shown = PAGE; render(); return; }
  if (b.dataset.open) { S.open = b.dataset.open; S.armed = false; S.saved = ''; render(); host?.scrollIntoView?.({ block: 'start' }); return; }
  if (b.dataset.status && r) { if (r.status !== b.dataset.status) update(r, { status: b.dataset.status }).then(ok => { if (ok) S.saved = ''; }); return; }
  switch (b.dataset.act) {
    case 'refresh': S.loaded = false; render(); load(); break;
    case 'more': S.shown += PAGE; render(); break;
    case 'copylink': copy(formUrl(), b); break;
    case 'back': S.open = null; S.armed = false; render(); break;
    case 'copy': if (r) copy(asText(r), b); break;
    case 'savenote':
      if (r) { const v = app.querySelector('#note').value.trim(); update(r, { staff_note: v || null }).then(ok => { if (ok) { S.saved = 'Nota disimpan ✓'; render(); } }); }
      break;
    case 'delete':
      if (!r) break;
      if (!S.armed) { S.armed = true; render(); setTimeout(() => { if (S.armed) { S.armed = false; render(); } }, 4000); break; }
      S.armed = false; S.busy = true; render();
      S.client.from('loan_applications').delete().eq('id', r.id).then(({ error }) => {
        S.busy = false;
        if (error) { render(); alertMsg('Gagal padam: ' + error.message); return; }
        S.rows = S.rows.filter(x => x.id !== r.id); S.open = null; notify(); render();
      });
      break;
  }
}
function onInput(e) { if (e.target.id === 'q') { S.q = e.target.value; S.shown = PAGE; render(); } }

let host = null;
export function mountPermohonan(el, ctx) {
  host = el;
  S.owner = ctx?.profile?.role === 'owner';
  onChange = ctx?.onCount || null;
  root = el.shadowRoot || el.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style><div class="shell"><div class="wrap" id="app"></div></div>`;
  app = root.getElementById('app');
  app.addEventListener('click', onClick);
  app.addEventListener('input', onInput);
  if (S.client !== ctx.client) { S.client = ctx.client; S.rows = []; S.loaded = false; S.open = null; }
  render();
  load();
}
