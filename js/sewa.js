// Abe Din Auto – modul Sewa (Abedin Car Rental: Perjanjian Sewa).
// Borang awam: sewa.html → RPC submit_sewa. Jadual: sewa_agreements, sewa_settings; storan: sewa-docs
// (lihat V60_SEWA_MIGRATION.sql). Dimuat oleh app.html melalui import('./js/sewa.js').
// UI dalam Shadow DOM supaya tidak bercampur dengan CSS sistem sedia ada.
const CSS = `
:host{display:block;--bg:#080b0c;--card:#121718;--soft:rgba(255,255,255,.05);--line:#2a3233;--fg:#f3eee2;--mute:#969da8;
  --gold:#d8ad57;--gold-fg:#0b0d0e;--ok:#45c98b;--warn:#e6b75d;--bad:#f08a7e;--blue:#7ea6ff;
  --f:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f)}
.wrap{display:flex;flex-direction:column;gap:14px;max-width:900px}
h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.01em}
h3{margin:0 0 10px;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
p{margin:0}
.mute{color:var(--mute);font-size:13.5px}
button,input,select,textarea{font:inherit;color:inherit}
.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(150deg,#151b1c,#0d1112);padding:16px}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.brand{background:#f5f7fd;border-radius:14px;padding:8px 12px;display:inline-flex}
.brand img{height:46px;width:auto;display:block}
.link{display:flex;gap:8px;align-items:center;background:#0b0f10;border:1px dashed #4a3f28;border-radius:12px;padding:10px 12px;font-size:13.5px;word-break:break-all;color:var(--gold)}
.row{display:flex;gap:8px;flex-wrap:wrap}
.btn{border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:10px 14px;font-weight:700;font-size:14px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;color:var(--fg);cursor:pointer;min-height:42px}
.btn.pri{background:var(--gold);border-color:var(--gold);color:var(--gold-fg)}
.btn.wa{background:#1fa855;border-color:#1fa855;color:#fff}
.btn.danger{border-color:#5a2a26;color:var(--bad)}
.btn.sm{padding:7px 11px;min-height:34px;font-size:13px}
.btn:disabled{opacity:.5;cursor:default}
.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 13px;font-weight:700;font-size:13px;color:var(--mute);cursor:pointer;white-space:nowrap}
.tab[aria-pressed=true]{background:var(--gold);border-color:var(--gold);color:var(--gold-fg)}
.tab i{font-style:normal;opacity:.75;margin-left:4px}
input,select,textarea{width:100%;background:#0b0f10;border:1px solid var(--line);border-radius:12px;padding:11px 12px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--gold)}
textarea{resize:vertical;min-height:90px}
.list{display:flex;flex-direction:column;gap:10px}
.item{display:grid;grid-template-columns:1fr auto;gap:4px 12px;width:100%;text-align:left;border:1px solid var(--line);background:var(--card);border-radius:16px;padding:14px 16px;cursor:pointer}
.item:hover{border-color:#4a3f28}
.item b{font-size:15.5px}
.item .sub{color:var(--mute);font-size:13px;grid-column:1/-1}
.ref{font-variant-numeric:tabular-nums;color:var(--gold);font-weight:700;font-size:12.5px;letter-spacing:.04em}
.chip{font-size:11.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:4px 9px;border-radius:999px;align-self:start;white-space:nowrap}
.st-baru{background:#2b2410;color:var(--warn)}
.st-disahkan{background:#14243f;color:var(--blue)}
.st-selesai{background:#11291d;color:var(--ok)}
.st-batal{background:#2d1513;color:var(--bad)}
.empty{text-align:center;color:var(--mute);padding:30px 10px}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px 18px}
.kv div{min-width:0}
.kv small{display:block;color:var(--mute);font-size:12px}
.kv span{display:block;font-weight:600;overflow-wrap:anywhere;white-space:pre-wrap}
.docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.doc{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#0b0f10;text-decoration:none;color:var(--fg);display:flex;flex-direction:column}
.doc .im{aspect-ratio:4/3;background:#1a2021 center/cover no-repeat;display:grid;place-items:center;color:var(--mute);font-weight:800}
.doc span{padding:8px 10px;font-size:12.5px;font-weight:600}
.sig{background:#fff;border-radius:12px;padding:6px;max-width:420px}
.sig img{width:100%;display:block}
.stbar{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
@media (max-width:520px){.stbar{grid-template-columns:repeat(2,1fr)}}
.stbar button[aria-pressed=true]{outline:2px solid var(--gold);outline-offset:1px}
.back{background:none;border:0;color:var(--gold);font-weight:700;cursor:pointer;padding:4px 0}
.msg{font-size:13px;color:var(--mute);min-height:18px}
.msg.err{color:var(--bad)}
.ed{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ed .full{grid-column:1/-1}
@media (max-width:560px){.ed{grid-template-columns:1fr}}
.ed label{display:block;font-size:12.5px;font-weight:600;color:var(--mute);margin-bottom:5px}
.ed input:disabled,.ed select:disabled,.ed textarea:disabled{opacity:.6}
.ed h4{grid-column:1/-1;margin:6px 0 -2px;font-size:15px;color:var(--fg)}
.seg2{display:flex;gap:8px}
.seg2 label{flex:1;display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0;color:var(--fg);font-size:14px;cursor:pointer}
.seg2 input{width:auto;accent-color:var(--gold)}
.tot input{font-weight:800;color:var(--gold);font-size:16px}
.savebar{position:sticky;bottom:calc(76px + env(safe-area-inset-bottom));display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#0c1112f2;border:1px solid var(--line);border-radius:16px;padding:10px 12px;backdrop-filter:blur(10px);z-index:2}
.terma{white-space:pre-wrap;font-size:13.5px;color:#cfd3da;max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#0b0f10}
`;

const STATUS = { baru: 'Baru', disahkan: 'Disahkan', selesai: 'Selesai', batal: 'Batal' };
const MINYAK = ['Kosong', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'Penuh'];
const AKSESORI = [['tayar_gantian', 'Tayar Gantian'], ['pembuka_tayar', 'Pembuka Tayar & Alatan'], ['penutup_roda', 'Penutup Roda / Rim Tayar'], ['radio', 'Radio / Permainan CD'], ['kerusi', 'Kerusi Depan / Belakang']];
const CAJ = [['caj_sewa', 'Caj Sewa'], ['caj_hantar', 'Caj Penghantaran & Pengambilan'], ['tambahan_masa', 'Tambahan Masa'], ['imbuhan_perlindungan', 'Imbuhan Perlindungan']];
const rm = v => v === null || v === undefined || v === '' ? '' : 'RM ' + Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const km = v => v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('ms-MY') + ' km';
function hariSewa(r) {
  const a = new Date(`${r.ambil_tarikh}T${hm(r.ambil_masa)}`), b = new Date(`${r.pulang_tarikh}T${hm(r.pulang_masa)}`);
  const h = (b - a) / 36e5; return h > 0 ? Math.max(1, Math.ceil(h / 24)) : '';
}
const DOC_LABEL = { lesen: 'Lesen Memandu', kp: 'Kad Pengenalan', utiliti: 'Bil Utiliti', gambar: 'Gambar Pemandu' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dmy = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '-';
const hm = s => s ? String(s).slice(0, 5) : '';
const jenisTxt = j => j === 'chauffeur' ? 'Chauffeur' : 'Pandu Sendiri';
const when = s => s ? new Date(s).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
function tempoh(r) {
  const a = new Date(`${r.ambil_tarikh}T${hm(r.ambil_masa)}`), b = new Date(`${r.pulang_tarikh}T${hm(r.pulang_masa)}`);
  const h = Math.round((b - a) / 36e5); if (!(h > 0)) return '';
  const d = Math.floor(h / 24), j = h % 24;
  return `${d ? d + ' hari ' : ''}${j ? j + ' jam' : ''}`.trim();
}

export function mountSewa(host, ctx) {
  const client = ctx.client, owner = ctx.profile?.role === 'owner';
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style><div class="shell"><div class="wrap" id="app"></div></div>`;
  const app = root.getElementById('app');
  const formUrl = new URL('sewa.html', location.href.split('#')[0].split('?')[0]).href;
  let logoSrc = new URL('abedin-car-rental-logo.webp', location.href).href;
  // simpan logo sebagai data URL supaya sentiasa muncul dalam tetingkap cetak
  fetch(logoSrc).then(r => r.blob()).then(b => new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); })).then(d => { logoSrc = d; }).catch(() => {});
  const S = { rows: [], loaded: false, error: '', filter: 'semua', q: '', view: 'list', id: null, terma: null, urls: {}, msg: '' };

  async function load() {
    S.error = '';
    const { data, error } = await client.from('sewa_agreements')
      .select('*').order('created_at', { ascending: false }).limit(500);
    if (error) S.error = /relation|does not exist|schema cache/i.test(error.message)
      ? 'Jadual Sewa belum wujud. Jalankan V60_SEWA_MIGRATION.sql dalam Supabase SQL Editor.' : error.message;
    S.rows = data || []; S.loaded = true; render();
  }

  function shareCard() {
    const wa = `https://wa.me/?text=${encodeURIComponent('Sila lengkapkan Perjanjian Sewa Abedin Car Rental di pautan ini:\n' + formUrl)}`;
    return `<section class="card"><h3>Pautan borang pelanggan</h3>
      <div class="link">${esc(formUrl)}</div>
      <div class="row" style="margin-top:10px"><button class="btn pri" data-a="copy">Salin pautan</button>
      <a class="btn wa" href="${wa}" target="_blank" rel="noopener">Kongsi WhatsApp</a>
      <a class="btn" href="${esc(formUrl)}" target="_blank" rel="noopener">Buka borang</a></div>
      <p class="msg" id="copy-msg"></p></section>`;
  }

  function listView() {
    const counts = { semua: S.rows.length }; Object.keys(STATUS).forEach(k => counts[k] = S.rows.filter(r => r.status === k).length);
    const q = S.q.toLowerCase();
    const rows = S.rows.filter(r => (S.filter === 'semua' || r.status === S.filter) &&
      (!q || [r.ref_no, r.nama, r.telefon, r.no_kp, r.model, r.email].some(x => String(x || '').toLowerCase().includes(q))));
    return `<div class="head"><div><h2>Sewa Kereta</h2><p class="mute">Perjanjian Sewa yang dihantar oleh pelanggan melalui borang.</p></div>
      <div class="brand"><img src="abedin-car-rental-logo.webp" alt="Abedin Car Rental"></div></div>
      ${shareCard()}
      <div class="tabs">${['semua', ...Object.keys(STATUS)].map(k => `<button class="tab" data-f="${k}" aria-pressed="${S.filter === k}">${k === 'semua' ? 'Semua' : STATUS[k]}<i>${counts[k]}</i></button>`).join('')}
      ${owner ? `<button class="tab" data-a="terma" aria-pressed="false">⚙ Terma & Syarat</button>` : ''}</div>
      <div class="row"><input id="q" placeholder="Cari nama, no rujukan, telefon, model…" value="${esc(S.q)}" style="flex:1;min-width:200px"><button class="btn" data-a="refresh">Refresh</button></div>
      ${S.error ? `<div class="card" style="border-color:#5a2a26;color:var(--bad)">${esc(S.error)}</div>` : ''}
      <div class="list">${!S.loaded ? '<div class="empty">Memuatkan…</div>' : rows.map(r => `
        <button class="item" data-open="${r.id}"><div><span class="ref">${esc(r.ref_no)}</span><br><b>${esc(r.nama)}</b></div>
        <span class="chip st-${r.status}">${STATUS[r.status] || r.status}</span>
        <span class="sub">${esc(r.model)} · ${jenisTxt(r.jenis_sewa)} · ${dmy(r.ambil_tarikh)} ${hm(r.ambil_masa)} → ${dmy(r.pulang_tarikh)} ${hm(r.pulang_masa)}<br>${esc(r.telefon)} · dihantar ${when(r.created_at)}</span></button>`).join('')
        || `<div class="empty">${S.rows.length ? 'Tiada padanan.' : 'Belum ada Perjanjian Sewa. Kongsi pautan borang kepada pelanggan.'}</div>`}</div>`;
  }

  function kv(pairs) { return `<div class="kv">${pairs.map(([k, v]) => `<div><small>${k}</small><span>${esc(v || '-')}</span></div>`).join('')}</div>`; }

  function detailView() {
    const r = S.rows.find(x => x.id === S.id); if (!r) { S.view = 'list'; return listView(); }
    const tel = String(r.telefon || '').replace(/\D/g, '').replace(/^0/, '60');
    const docs = Object.entries(r.docs || {});
    return `<button class="back" data-a="back">← Senarai Sewa</button>
      <div class="head"><div><span class="ref">${esc(r.ref_no)}</span><h2>${esc(r.nama)}</h2><p class="mute">Dihantar ${when(r.created_at)}</p></div>
      <span class="chip st-${r.status}" style="font-size:13px;padding:6px 12px">${STATUS[r.status]}</span></div>
      <div class="row"><button class="btn pri" data-a="edit">✎ Edit Dokumen Sewa</button><button class="btn" data-a="print">Cetak / PDF Perjanjian</button>
        ${tel ? `<a class="btn wa" href="https://wa.me/${tel}" target="_blank" rel="noopener">WhatsApp pelanggan</a>` : ''}
        <a class="btn" href="tel:${esc(r.telefon)}">Telefon</a></div>
      <section class="card"><h3>Status</h3><div class="stbar">${Object.keys(STATUS).map(k => `<button class="btn sm" data-st="${k}" aria-pressed="${r.status === k}">${STATUS[k]}</button>`).join('')}</div>
        <label class="mute" style="display:block;margin:12px 0 6px">Nota staf (tidak dilihat pelanggan)</label>
        <textarea id="nota" maxlength="2000" placeholder="cth: deposit RM200 diterima, no plat kereta, dll.">${esc(r.nota_staf || '')}</textarea>
        <div class="row" style="margin-top:8px;align-items:center"><button class="btn sm" data-a="nota">Simpan nota</button><span class="msg" id="st-msg">${esc(S.msg)}</span></div></section>
      <section class="card"><h3>Maklumat Peribadi</h3>${kv([
        ['Sewaan', jenisTxt(r.jenis_sewa)], ['Nama Penuh', r.nama], ['Email', r.email], ['No Telefon', r.telefon], ['No KP / Passport', r.no_kp],
        ['Alamat', r.alamat], ['Bandar', r.bandar], ['Negeri', r.negeri], ['Poskod', r.poskod], ['Negara', r.negara],
        ['No Lesen', r.no_lesen], ['Tarikh Luput Lesen', r.lesen_luput ? dmy(r.lesen_luput) : '']])}</section>
      <section class="card"><h3>Kenderaan & Jadual</h3>${kv([
        ['Model', r.model], ['Kumpulan', r.kumpulan],
        ['Ambil', `${r.ambil_lokasi}\n${dmy(r.ambil_tarikh)} ${hm(r.ambil_masa)}`],
        ['Pulang', `${r.pulang_lokasi}\n${dmy(r.pulang_tarikh)} ${hm(r.pulang_masa)}`],
        ['Tempoh', tempoh(r)], ['Remark pelanggan', r.remark]])}</section>
      <section class="card"><h3>Butiran Sewaan (diisi admin)</h3>${adminFilled(r) ? kv([
        ['No Pendaftaran', r.no_pendaftaran],
        ['Ambil: Jarak / Minyak', [km(r.ambil_jarak), r.ambil_minyak].filter(Boolean).join(' · ')],
        ['Pulang: Jarak / Minyak', [km(r.pulang_jarak), r.pulang_minyak].filter(Boolean).join(' · ')],
        ['Sewa (Hari)', r.sewa_hari ?? ''], ...CAJ.map(([k, l]) => [l, rm(r[k])]),
        ['Jumlah', rm(r.jumlah)], ['Sekuriti Deposit', rm(r.deposit)],
        ...AKSESORI.map(([k, l]) => [l, (r.aksesori || {})[k]]), ['Remark admin', r.remark_admin]])
        : `<p class="mute">Belum diisi. Tekan <b>Edit Dokumen Sewa</b> untuk isi no pendaftaran, jarak, minyak, caj dan aksesori.</p>`}</section>
      <section class="card"><h3>Dokumen</h3>${docs.length ? `<div class="docs">${docs.map(([k, p]) => {
        const u = S.urls[p], pdf = /\.pdf$/i.test(p);
        return `<a class="doc" ${u ? `href="${esc(u)}" target="_blank" rel="noopener"` : ''}><div class="im" style="${u && !pdf ? `background-image:url('${esc(u)}')` : ''}">${pdf ? 'PDF' : u ? '' : '…'}</div><span>${DOC_LABEL[k] || k}</span></a>`;
      }).join('')}</div>` : '<p class="mute">Tiada dokumen.</p>'}</section>
      <section class="card"><h3>Tandatangan & Terma dipersetujui</h3><div class="sig"><img src="${esc(r.tandatangan)}" alt="Tandatangan ${esc(r.nama)}"></div>
        <div class="terma" style="margin-top:12px">${esc(r.terma_snapshot || '-')}</div></section>
      ${owner ? `<div class="row"><button class="btn danger" data-a="delete">Padam perjanjian & dokumen</button></div>` : ''}`;
  }

  function adminFilled(r) {
    return ['no_pendaftaran', 'ambil_jarak', 'ambil_minyak', 'pulang_jarak', 'pulang_minyak', 'sewa_hari', 'caj_sewa', 'caj_hantar',
      'tambahan_masa', 'imbuhan_perlindungan', 'jumlah', 'deposit', 'remark_admin'].some(k => r[k] !== null && r[k] !== undefined && r[k] !== '')
      || Object.keys(r.aksesori || {}).length > 0;
  }

  function editView() {
    const r = S.rows.find(x => x.id === S.id); if (!r) { S.view = 'list'; return listView(); }
    const lock = owner ? '' : ' disabled';
    const inp = (k, l, o = {}) => `<div class="${o.full ? 'full' : ''}${o.cls ? ' ' + o.cls : ''}"><label for="e-${k}">${l}</label>${o.area
      ? `<textarea id="e-${k}" data-k="${k}"${o.cust ? lock : ''} maxlength="${o.max || 1000}">${esc(r[k] ?? '')}</textarea>`
      : `<input id="e-${k}" data-k="${k}" type="${o.type || 'text'}"${o.step ? ` step="${o.step}" min="0" inputmode="decimal"` : ''}${o.ph ? ` placeholder="${o.ph}"` : ''} value="${esc(o.val !== undefined ? o.val : (o.type === 'time' ? hm(r[k]) : r[k] ?? ''))}"${o.cust ? lock : ''}>`}</div>`;
    const sel = (k, l, opts, val) => `<div><label for="e-${k}">${l}</label><select id="e-${k}" data-k="${k}"><option value="">-----pilih minyak-----</option>${opts.map(o => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('')}</select></div>`;
    const ak = r.aksesori || {};
    const C = { cust: true };
    return `<button class="back" data-a="detail">← ${esc(r.ref_no)}</button>
      <div class="head"><div><h2>Edit Dokumen Sewa</h2><p class="mute">${esc(r.nama)} · ${esc(r.ref_no)}</p></div></div>
      ${owner ? '' : '<p class="mute">Maklumat yang diisi pelanggan hanya boleh diubah oleh Owner.</p>'}
      <section class="card"><h3>Maklumat Peribadi</h3><div class="ed">
        <div class="full"><label>Sewaan</label><div class="seg2">${['pandu_sendiri', 'chauffeur'].map(j => `<label><input type="radio" name="e-jenis" data-k="jenis_sewa" value="${j}"${r.jenis_sewa === j ? ' checked' : ''}${lock}>${jenisTxt(j)}</label>`).join('')}</div></div>
        ${inp('nama', '1. Nama Penuh', { ...C, full: true })}${inp('email', '2. Email', { ...C, type: 'email' })}${inp('telefon', '3. No Telefon Bimbit', { ...C, type: 'tel' })}
        ${inp('no_kp', '4. No KP / Passport', C)}${inp('alamat', '5. Alamat', { ...C, area: true, full: true, max: 400 })}
        ${inp('bandar', '6. Bandar', C)}${inp('negeri', '7. Negeri', C)}${inp('poskod', '8. Poskod', C)}${inp('negara', '9. Negara', C)}
        ${inp('no_lesen', '10. No Lesen Memandu', C)}${inp('lesen_luput', '11. Tarikh Luput', { ...C, type: 'date' })}
      </div></section>
      <section class="card"><h3>Maklumat Kenderaan</h3><div class="ed">
        ${inp('model', '1. Model', C)}${inp('no_pendaftaran', '2. No Pendaftaran', { ph: 'cth: DEF 1234' })}${inp('kumpulan', '3. Kumpulan', C)}
      </div></section>
      <section class="card"><h3>Penghantaran & Pengambilan</h3><div class="ed">
        <h4>Ambil</h4>${inp('ambil_lokasi', '1. Lokasi', { ...C, full: true })}${inp('ambil_tarikh', '2. Tarikh Mula', { ...C, type: 'date' })}${inp('ambil_masa', '3. Masa Mula', { ...C, type: 'time' })}
        ${inp('ambil_jarak', '4. Jarak (km)', { type: 'number', step: '1', ph: 'Bacaan odometer' })}${sel('ambil_minyak', 'Minyak', MINYAK, r.ambil_minyak)}
        <h4>Pulang</h4>${inp('pulang_lokasi', '1. Lokasi', { ...C, full: true })}${inp('pulang_tarikh', '2. Tarikh Akhir', { ...C, type: 'date' })}${inp('pulang_masa', '3. Masa Akhir', { ...C, type: 'time' })}
        ${inp('pulang_jarak', '4. Jarak (km)', { type: 'number', step: '1', ph: 'Bacaan odometer' })}${sel('pulang_minyak', 'Minyak', MINYAK, r.pulang_minyak)}
        <div class="full mute" id="e-pakai"></div>
      </div></section>
      <section class="card"><h3>Calculation</h3><div class="ed">
        ${inp('sewa_hari', '1. Sewa (Hari)', { type: 'number', step: '0.5', val: r.sewa_hari ?? hariSewa(r) })}
        ${CAJ.map(([k, l], i) => inp(k, `${i + 2}. ${l} (RM)`, { type: 'number', step: '0.01', ph: '0.00' })).join('')}
        ${inp('jumlah', '6. Jumlah (RM)', { type: 'number', step: '0.01', ph: 'Dikira automatik', cls: 'tot' })}${inp('deposit', '7. Sekuriti Deposit (RM)', { type: 'number', step: '0.01', ph: '0.00' })}
      </div></section>
      <section class="card"><h3>Aksesori</h3><div class="ed">
        ${AKSESORI.map(([k, l], i) => `<div><label for="a-${k}">${i + 1}. ${l}</label><select id="a-${k}" data-ak="${k}"><option value="">-----pilih-----</option>${['Ada', 'Tiada', 'Rosak'].map(o => `<option${ak[k] === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>`).join('')}
      </div></section>
      <section class="card"><h3>Remark</h3><div class="ed">
        ${inp('remark', 'Remark pelanggan', { ...C, area: true, full: true })}${inp('remark_admin', 'Remark admin (dicetak dalam perjanjian)', { area: true, full: true })}
      </div></section>
      <div class="savebar"><button class="btn pri" data-a="save-edit">Update</button><button class="btn" data-a="save-print">Update & Cetak</button><span class="msg" id="e-msg"></span></div>`;
  }

  function wireEdit() {
    const g = id => app.querySelector('#e-' + id);
    const num = id => { const v = g(id)?.value; return v === '' || v == null ? null : Number(v); };
    const pakai = () => {
      const a = num('ambil_jarak'), b = num('pulang_jarak'), el = g('pakai');
      el.textContent = a !== null && b !== null ? (b >= a ? `Jarak dipandu: ${(b - a).toLocaleString('ms-MY')} km` : 'Jarak pulang lebih rendah daripada jarak ambil.') : '';
    };
    const total = () => {
      const parts = CAJ.map(([k]) => num(k)); if (parts.every(v => v === null)) return;
      g('jumlah').value = parts.reduce((t, v) => t + (v || 0), 0).toFixed(2);
    };
    CAJ.forEach(([k]) => g(k).addEventListener('input', total));
    ['ambil_jarak', 'pulang_jarak'].forEach(k => g(k).addEventListener('input', pakai));
    pakai();
  }

  const WAJIB = ['nama', 'email', 'telefon', 'no_kp', 'alamat', 'bandar', 'negeri', 'poskod', 'negara', 'model', 'ambil_lokasi', 'pulang_lokasi', 'ambil_tarikh', 'pulang_tarikh', 'ambil_masa', 'pulang_masa'];
  function collect() {
    const p = {}, num = v => v === '' ? null : Number(v);
    app.querySelectorAll('[data-k]').forEach(el => {
      if (el.disabled) return;
      if (el.type === 'radio') { if (el.checked) p[el.dataset.k] = el.value; return; }
      const v = el.value.trim(), k = el.dataset.k;
      if (WAJIB.includes(k) && !v) throw new Error('Medan wajib kosong: ' + (el.closest('div').querySelector('label')?.textContent || k));
      p[k] = el.type === 'number' ? num(v) : (v === '' ? null : v);
      if (k === 'no_pendaftaran' && p[k]) p[k] = p[k].toUpperCase();
    });
    const ak = {}; app.querySelectorAll('[data-ak]').forEach(el => { if (el.value) ak[el.dataset.ak] = el.value; });
    p.aksesori = ak;
    for (const k of ['ambil_jarak', 'pulang_jarak', 'sewa_hari', 'jumlah', 'deposit', ...CAJ.map(c => c[0])])
      if (p[k] !== null && p[k] !== undefined && (isNaN(p[k]) || p[k] < 0)) throw new Error('Nilai tidak sah pada medan nombor.');
    if (p.ambil_jarak != null && p.pulang_jarak != null && p.pulang_jarak < p.ambil_jarak) throw new Error('Jarak pulang lebih rendah daripada jarak ambil.');
    for (const k of ['ambil_jarak', 'pulang_jarak']) if (p[k] != null) p[k] = Math.round(p[k]);
    return p;
  }

  function termaView() {
    return `<button class="back" data-a="back">← Senarai Sewa</button><h2>Terma & Syarat</h2>
      <p class="mute">Teks ini dipaparkan pada borang pelanggan. Setiap perjanjian menyimpan salinan terma pada masa ia dihantar, jadi perubahan tidak menjejaskan perjanjian lama.</p>
      <section class="card"><textarea id="terma" style="min-height:360px">${S.terma === null ? 'Memuatkan…' : esc(S.terma)}</textarea>
      <div class="row" style="margin-top:10px;align-items:center"><button class="btn pri" data-a="save-terma">Simpan Terma</button><span class="msg" id="t-msg"></span></div></section>`;
  }

  function render() {
    app.innerHTML = S.view === 'edit' ? editView() : S.view === 'detail' ? detailView() : S.view === 'terma' ? termaView() : listView();
    if (S.view === 'edit') wireEdit();
    const q = app.querySelector('#q');
    if (q) q.oninput = () => { S.q = q.value; const pos = q.selectionStart; render(); const n = app.querySelector('#q'); n.focus(); n.setSelectionRange(pos, pos); };
  }

  async function signDocs(r) {
    const paths = Object.values(r.docs || {}).filter(p => !S.urls[p]);
    if (!paths.length) return;
    const { data } = await client.storage.from('sewa-docs').createSignedUrls(paths, 3600);
    (data || []).forEach(x => { if (x.signedUrl) S.urls[x.path] = x.signedUrl; });
    if (S.view === 'detail' && S.id === r.id) render();
  }

  async function update(id, patch, okMsg) {
    const { data, error } = await client.from('sewa_agreements').update(patch).eq('id', id).select().single();
    if (error) { S.msg = 'Gagal simpan: ' + error.message; render(); return; }
    S.rows = S.rows.map(x => x.id === id ? data : x); S.msg = okMsg; render();
  }

  function printAgreement(r, w0) {
    const w = w0 || window.open('', '_blank'); if (!w) { alert('Benarkan pop-up untuk cetak.'); return; }
    const row = (k, v) => `<tr><th>${k}</th><td>${esc(v || '-')}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html lang="ms"><head><meta charset="utf-8"><title>Perjanjian Sewa ${esc(r.ref_no)}</title>
      <base href="${esc(location.href)}"><style>
      body{font:13px/1.45 Arial,sans-serif;color:#111;margin:28px;max-width:780px}
      header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1f2f57;padding-bottom:10px}
      header img{height:70px} h1{font-size:20px;color:#1f2f57;margin:0;text-align:right} .ref{text-align:right;color:#555}
      h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#1f2f57;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}
      table{width:100%;border-collapse:collapse} th{width:34%;text-align:left;font-weight:600;color:#444;padding:4px 8px 4px 0;vertical-align:top} td{padding:4px 0;white-space:pre-wrap}
      .terma{white-space:pre-wrap;font-size:11.5px;color:#333} .two th,.two td{width:auto} .tot th,.tot td{font-weight:800;font-size:14px;border-top:1px solid #333;padding-top:6px} h2{break-after:avoid} table{break-inside:avoid} .sign{display:flex;gap:40px;margin-top:26px}
      .sign div{flex:1} .sign img{height:90px;display:block} .line{border-top:1px solid #333;padding-top:4px;margin-top:4px;font-size:12px}
      @media print{body{margin:12mm}}</style></head><body>
      <header><img src="${esc(logoSrc)}" alt="Abedin Car Rental"><div><h1>PERJANJIAN SEWA</h1><div class="ref">No Rujukan: <b>${esc(r.ref_no)}</b><br>Tarikh: ${when(r.created_at)}</div></div></header>
      <h2>Maklumat Peribadi</h2><table>${row('Sewaan', jenisTxt(r.jenis_sewa))}${row('Nama Penuh', r.nama)}${row('Email', r.email)}${row('No Telefon', r.telefon)}${row('No KP / Passport', r.no_kp)}${row('Alamat', [r.alamat, `${r.poskod} ${r.bandar}`, `${r.negeri}, ${r.negara}`].join('\n'))}${row('No Lesen', r.no_lesen)}${row('Tarikh Luput Lesen', r.lesen_luput ? dmy(r.lesen_luput) : '')}</table>
      <h2>Maklumat Kenderaan</h2><table>${row('Model', r.model)}${row('No Pendaftaran', r.no_pendaftaran)}${row('Kumpulan', r.kumpulan)}</table>
      <h2>Penghantaran & Pengambilan</h2><table>${row('Ambil', `${r.ambil_lokasi}\n${dmy(r.ambil_tarikh)} ${hm(r.ambil_masa)}`)}${row('Pulang', `${r.pulang_lokasi}\n${dmy(r.pulang_tarikh)} ${hm(r.pulang_masa)}`)}${row('Tempoh', tempoh(r))}</table>
      <table class="two"><tr><th></th><th>Ambil</th><th>Pulang</th></tr><tr><th>Jarak</th><td>${esc(km(r.ambil_jarak) || '-')}</td><td>${esc(km(r.pulang_jarak) || '-')}</td></tr><tr><th>Minyak</th><td>${esc(r.ambil_minyak || '-')}</td><td>${esc(r.pulang_minyak || '-')}</td></tr></table>
      <h2>Calculation</h2><table>${row('Sewa (Hari)', r.sewa_hari ?? '')}${CAJ.map(([k, l]) => row(l, rm(r[k]))).join('')}<tr class="tot"><th>Jumlah</th><td>${esc(rm(r.jumlah) || '-')}</td></tr>${row('Sekuriti Deposit', rm(r.deposit))}</table>
      <h2>Aksesori</h2><table>${AKSESORI.map(([k, l]) => row(l, (r.aksesori || {})[k])).join('')}</table>
      <h2>Remark</h2><table>${row('Pelanggan', r.remark)}${row('Abedin Car Rental', r.remark_admin)}</table>
      <h2>Terma dan Syarat</h2><div class="terma">${esc(r.terma_snapshot)}</div>
      <div class="sign"><div><img src="${esc(r.tandatangan)}" alt=""><div class="line">Tandatangan Penyewa<br>${esc(r.nama)}</div></div>
      <div><div style="height:90px"></div><div class="line">Bagi pihak Abedin Car Rental<br>Nama & cop:</div></div></div>
      <script>window.onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);
    w.document.close();
  }

  app.addEventListener('click', async e => {
    const t = e.target.closest('[data-a],[data-f],[data-open],[data-st]'); if (!t) return;
    const a = t.dataset.a;
    if (t.dataset.f) { S.filter = t.dataset.f; render(); return; }
    if (t.dataset.open) { S.id = t.dataset.open; S.view = 'detail'; S.msg = ''; render(); scrollTo(0, 0); signDocs(S.rows.find(x => x.id === S.id)); return; }
    const r = S.rows.find(x => x.id === S.id);
    if (t.dataset.st && r) { if (t.dataset.st !== r.status) update(r.id, { status: t.dataset.st }, 'Status dikemas kini.'); return; }
    if (a === 'copy') {
      try { await navigator.clipboard.writeText(formUrl); app.querySelector('#copy-msg').textContent = 'Pautan disalin.'; }
      catch { prompt('Salin pautan ini:', formUrl); }
    } else if (a === 'refresh') { S.loaded = false; render(); load(); }
    else if (a === 'back') { S.view = 'list'; S.msg = ''; render(); }
    else if (a === 'nota' && r) { update(r.id, { nota_staf: app.querySelector('#nota').value.trim() || null }, 'Nota disimpan.'); }
    else if (a === 'print' && r) printAgreement(r);
    else if (a === 'edit' && r) { S.view = 'edit'; render(); scrollTo(0, 0); }
    else if (a === 'detail') { S.view = 'detail'; S.msg = ''; render(); scrollTo(0, 0); }
    else if ((a === 'save-edit' || a === 'save-print') && r) {
      const m = app.querySelector('#e-msg'); m.classList.remove('err');
      let patch; try { patch = collect(); } catch (err) { m.textContent = err.message; m.classList.add('err'); return; }
      const pw = a === 'save-print' ? window.open('', '_blank') : null;
      m.textContent = 'Menyimpan…'; t.disabled = true;
      const { data, error } = await client.from('sewa_agreements').update(patch).eq('id', r.id).select().single();
      t.disabled = false;
      if (error) {
        pw?.close();
        m.textContent = 'Gagal simpan: ' + (/sewa_tarikh_valid/.test(error.message) ? 'tarikh/masa pulang mesti selepas tarikh/masa ambil.' : error.message);
        m.classList.add('err'); return;
      }
      S.rows = S.rows.map(x => x.id === r.id ? data : x);
      if (a === 'save-print') printAgreement(data, pw);
      S.view = 'detail'; S.msg = 'Dokumen sewa dikemas kini.'; render(); scrollTo(0, 0);
    }
    else if (a === 'delete' && r) {
      if (!confirm(`Padam perjanjian ${r.ref_no} (${r.nama}) dan semua dokumennya? Tindakan ini tidak boleh dibatalkan.`)) return;
      const paths = Object.values(r.docs || {});
      if (paths.length) await client.storage.from('sewa-docs').remove(paths);
      const { error } = await client.from('sewa_agreements').delete().eq('id', r.id);
      if (error) { S.msg = 'Gagal padam: ' + error.message; render(); return; }
      S.rows = S.rows.filter(x => x.id !== r.id); S.view = 'list'; render();
    } else if (a === 'terma') {
      S.view = 'terma'; render();
      if (S.terma === null) {
        const { data } = await client.from('sewa_settings').select('value').eq('key', 'terma').maybeSingle();
        S.terma = data?.value || ''; if (S.view === 'terma') render();
      }
    } else if (a === 'save-terma') {
      const v = app.querySelector('#terma').value, m = app.querySelector('#t-msg');
      m.textContent = 'Menyimpan…'; m.classList.remove('err');
      const { error } = await client.from('sewa_settings').upsert({ key: 'terma', value: v });
      if (error) { m.textContent = 'Gagal simpan: ' + error.message; m.classList.add('err'); return; }
      S.terma = v; m.textContent = 'Terma disimpan. Borang pelanggan kini memaparkan teks baharu.';
    }
  });

  render(); load();
}
