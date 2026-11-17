import { SEWA_LOGO } from './sewa-logo.js';
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
.ovl{position:fixed;inset:0;z-index:2147483000;background:#f5f7fd;display:flex;flex-direction:column}
.ovl .bar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));background:#1f2f57;color:#fff;font-weight:700;font-size:14px}
.ovl .bar a{color:#fff;font-size:13px;opacity:.85}
.ovl iframe{flex:1;width:100%;border:0;background:#f5f7fd}
.pk{width:100%;border-collapse:separate;border-spacing:0 6px}
.pk th{text-align:left;font-size:12px;color:var(--mute);font-weight:600;padding:0 6px 0 0}
.pk td{padding:0 6px 0 0}.pk td:first-child{width:22%}.pk td:last-child{width:44px;padding:0}
.pk input{padding:9px 10px}
.terma h4{margin:12px 0 4px;color:var(--gold);font-size:13px}.terma p{margin:0 0 6px}.terma p b{color:var(--gold)}
.terma{font-size:13px;color:#cfd3da;max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#0b0f10}
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
const KSTATUS = { aktif: 'Aktif', servis: 'Servis', tidak_aktif: 'Tidak Aktif' };
const fmtRM = v => 'RM ' + Number(v || 0).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const aktifSewa = r => r.status === 'baru' || r.status === 'disahkan';
const mula = r => new Date(`${r.ambil_tarikh}T${hm(r.ambil_masa)}`);
const akhir = r => new Date(`${r.pulang_tarikh}T${hm(r.pulang_masa)}`);
// Harga pakej: [{hari, harga}] — HARGA SEHARI bagi tempoh sewa (cth 1 hari RM650/hari, 2 hari RM600/hari,
// 3 hari RM550/hari, 4 hari RM500/hari). Jumlah = hari × harga sehari pakej terbesar yang tidak melebihi tempoh.
function pakejTier(k, jenis) {
  return (Array.isArray(k?.pakej) ? k.pakej : []).map(x => ({ hari: +x.hari, harga: +(jenis === 'agen' ? x.agen : x.customer) }))
    .filter(x => x.hari > 0 && x.harga > 0).sort((a, b) => a.hari - b.hari);
}
function kiraPakej(t, n, fallbackHari) {
  if (!t.length) return fallbackHari > 0 ? { total: n * fallbackHari, kadar: fallbackHari, label: `${n} hari × ${fmtRM(fallbackHari)}` } : null;
  const base = [...t].reverse().find(x => x.hari <= n) || t[0], kadar = base.harga;
  return { total: +(n * kadar).toFixed(2), kadar, label: `${n} hari × ${fmtRM(kadar)}` };
}
// Kiraan caj (ikut T&C): minimum sehari; baki >12 jam = sehari penuh; baki ≤12 jam × harga sejam (had kadar sehari)
function kiraHarga(k, jenis, a, b) {
  const jam = (b - a) / 36e5; if (!k || !(jam > 0)) return null;
  const hJam = Number(jenis === 'agen' ? k.harga_jam_agen : k.harga_jam_customer) || 0;
  let hari = Math.floor(jam / 24), baki = Math.ceil(jam - hari * 24 - 1e-9);
  if (hari === 0) { hari = 1; baki = 0; }
  if (baki > 12) { hari += 1; baki = 0; }
  const p = kiraPakej(pakejTier(k, jenis), hari, Number(jenis === 'agen' ? k.harga_hari_agen : k.harga_hari_customer) || 0);
  if (!p) return null;
  const tambahan = baki ? Math.min(hJam ? baki * hJam : p.kadar, p.kadar) : 0;
  const terang = p.label + (baki ? ` + ${baki} jam ${hJam ? '× ' + fmtRM(hJam) : '(dikira sehari)'}` : '');
  return { hari, baki, caj_sewa: +p.total.toFixed(2), tambahan_masa: +tambahan.toFixed(2), deposit: Number(k.deposit) || 0, hHari: p.kadar, terang };
}
// Terma: baris "## Tajuk" = tajuk bahagian, "1. teks" = klausa bernombor
function termaHtml(t) {
  return String(t || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    if (l.startsWith('## ')) return `<h4>${esc(l.slice(3))}</h4>`;
    const m = l.match(/^(\d+)\.\s+(.*)$/);
    return m ? `<p><b>${m[1]}.</b> ${esc(m[2])}</p>` : `<p>${esc(l)}</p>`;
  }).join('') || '-';
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
  const formUrl = ctx.publicFormUrl || new URL(ctx.formPath || 'sewa.html', location.href.split('#')[0].split('?')[0]).href;
  const logoSrc = SEWA_LOGO;
  const S = { staf: null, wa: null, kereta: [], keretaErr: '', kid: null, rows: [], loaded: false, error: '', filter: 'semua', q: '', view: 'list', id: null, terma: null, urls: {}, msg: '' };

  async function load() {
    S.error = '';
    const { data, error } = await client.from('sewa_agreements')
      .select('*').order('created_at', { ascending: false }).limit(500);
    if (error) S.error = /relation|does not exist|schema cache/i.test(error.message)
      ? 'Jadual Sewa belum wujud. Jalankan V60_SEWA_MIGRATION.sql dalam Supabase SQL Editor.' : error.message;
    const k = await client.from('sewa_kereta').select('*').order('model');
    S.kereta = k.data || []; S.keretaErr = k.error ? k.error.message : '';
    S.rows = data || []; S.loaded = true; render();
  }
  const keretaOf = id => S.kereta.find(k => k.id === id);
  function bertindih(kid, a, b, kecuali) {
    return S.rows.filter(r => r.kereta_id === kid && r.id !== kecuali && aktifSewa(r) && mula(r) < b && akhir(r) > a);
  }

  function shareCard() {
    const wa = `https://wa.me/?text=${encodeURIComponent('Sila lengkapkan Perjanjian Sewa Abedin Car Rental di pautan ini:\n' + formUrl)}`;
    return `<section class="card"><h3>Pautan borang pelanggan</h3>
      <div class="link">${esc(formUrl)}</div>
      <div class="row" style="margin-top:10px"><button class="btn pri" data-a="copy">Salin pautan</button>
      <a class="btn wa" href="${wa}" target="_blank" rel="noopener">Kongsi WhatsApp</a>
      <button class="btn" data-a="buka-borang">Buka borang</button></div>
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
      <button class="tab" data-a="stok" aria-pressed="false">🚗 Stok Kereta<i>${S.kereta.length}</i></button>
      ${owner ? `<button class="tab" data-a="terma" aria-pressed="false">⚙ Tetapan</button>${ctx.manageStaff ? '<button class="tab" data-a="staf" aria-pressed="false">👤 Staf</button>' : ''}` : ''}</div>
      <div class="row"><input id="q" placeholder="Cari nama, no rujukan, telefon, model…" value="${esc(S.q)}" style="flex:1;min-width:200px"><button class="btn" data-a="refresh">Refresh</button></div>
      ${S.error ? `<div class="card" style="border-color:#5a2a26;color:var(--bad)">${esc(S.error)}</div>` : ''}
      <div class="list">${!S.loaded ? '<div class="empty">Memuatkan…</div>' : rows.map(r => `
        <button class="item" data-open="${r.id}"><div><span class="ref">${esc(r.ref_no)}</span><br><b>${esc(r.nama)}</b></div>
        <span class="chip st-${r.status}">${STATUS[r.status] || r.status}</span>
        <span class="sub">${esc(r.model)}${r.no_pendaftaran ? ' (' + esc(r.no_pendaftaran) + ')' : ''} · ${jenisTxt(r.jenis_sewa)}${r.jenis_harga === 'agen' ? ' · Agen' + (r.nama_agen ? ': ' + esc(r.nama_agen) : '') : ''} · ${dmy(r.ambil_tarikh)} ${hm(r.ambil_masa)} → ${dmy(r.pulang_tarikh)} ${hm(r.pulang_masa)}<br>${esc(r.telefon)} · dihantar ${when(r.created_at)}</span></button>`).join('')
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
        ['Jenis Harga', r.jenis_harga === 'agen' ? 'Agen' + (r.nama_agen ? ' – ' + r.nama_agen : '') : r.jenis_harga === 'customer' ? 'Customer' : ''],
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
        <div class="terma" style="margin-top:12px">${termaHtml(r.terma_snapshot)}</div></section>
      ${owner ? `<div class="row"><button class="btn danger" data-a="delete">Padam perjanjian & dokumen</button></div>` : ''}`;
  }

  function adminFilled(r) {
    return ['no_pendaftaran', 'ambil_jarak', 'ambil_minyak', 'pulang_jarak', 'pulang_minyak', 'sewa_hari', 'caj_sewa', 'caj_hantar',
      'tambahan_masa', 'imbuhan_perlindungan', 'jumlah', 'deposit', 'remark_admin', 'kereta_id', 'jenis_harga'].some(k => r[k] !== null && r[k] !== undefined && r[k] !== '')
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
      <section class="card"><h3>Maklumat Kenderaan & Harga</h3><div class="ed">
        <div class="full"><label for="e-kereta">Pilih kereta dari stok</label><select id="e-kereta" data-k="kereta_id"><option value="">— Tidak dipilih / isi manual —</option>${S.kereta.map(k => {
          const tindih = bertindih(k.id, mula(r), akhir(r), r.id);
          return `<option value="${esc(k.id)}"${r.kereta_id === k.id ? ' selected' : ''}${k.status !== 'aktif' && r.kereta_id !== k.id ? ' disabled' : ''}>${esc(k.model)} · ${esc(k.no_pendaftaran)}${k.status !== 'aktif' ? ' (' + KSTATUS[k.status] + ')' : ''}${tindih.length ? ' ⚠ bertindih' : ''}</option>`;
        }).join('')}</select>${S.kereta.length ? '' : '<p class="mute" style="margin-top:6px">Belum ada kereta dalam stok. Tambah di tab 🚗 Stok Kereta.</p>'}<div class="mute" id="e-tindih" style="color:var(--warn);margin-top:6px"></div></div>
        <div class="full"><label>Jenis Harga</label><div class="seg2">${[['customer', 'Customer'], ['agen', 'Agen']].map(([v, l]) => `<label><input type="radio" name="e-jh" data-k="jenis_harga" value="${v}"${(r.jenis_harga || 'customer') === v ? ' checked' : ''}>${l}</label>`).join('')}</div></div>
        <div class="full" id="w-agen"${r.jenis_harga === 'agen' ? '' : ' hidden'}><label for="e-nama_agen">Nama Agen</label><input id="e-nama_agen" data-k="nama_agen" value="${esc(r.nama_agen || '')}" maxlength="120" placeholder="Nama agen"></div>
        ${inp('model', '1. Model')}${inp('no_pendaftaran', '2. No Pendaftaran', { ph: 'cth: DEF 1234' })}${inp('kumpulan', '3. Kumpulan')}
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
        <div class="full row" style="align-items:center"><button type="button" class="btn sm" data-a="kira">↻ Kira semula ikut harga stok</button><span class="mute" id="e-kira"></span></div>
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
    const r = S.rows.find(x => x.id === S.id);
    const jh = () => app.querySelector('input[name=e-jh]:checked')?.value || 'customer';
    const masa = () => [new Date(`${g('ambil_tarikh').value}T${g('ambil_masa').value}`), new Date(`${g('pulang_tarikh').value}T${g('pulang_masa').value}`)];
    const semakTindih = () => {
      const k = keretaOf(g('kereta').value), [a, b] = masa(), t = k ? bertindih(k.id, a, b, r.id) : [];
      g('tindih').textContent = t.length ? `⚠ Kereta ini sudah ditempah pada masa bertindih: ${t.map(x => `${x.ref_no} (${dmy(x.ambil_tarikh)}–${dmy(x.pulang_tarikh)})`).join(', ')}` : '';
    };
    const set = (k, v) => { g(k).value = v === null || v === undefined ? '' : v; };
    kira = (tulis = true) => {
      const k = keretaOf(g('kereta').value), [a, b] = masa(), h = kiraHarga(k, jh(), a, b), m = g('kira');
      if (!k) { m.textContent = 'Pilih kereta dari stok untuk kiraan automatik.'; return; }
      if (!h) { m.textContent = 'Semak tarikh dan masa ambil/pulang.'; return; }
      m.textContent = `${jh() === 'agen' ? 'Harga Agen' : 'Harga Customer'}: ${h.terang}`;
      if (!tulis) return;
      set('sewa_hari', h.hari); set('caj_sewa', h.caj_sewa.toFixed(2)); set('tambahan_masa', h.tambahan_masa.toFixed(2));
      set('deposit', h.deposit.toFixed(2)); total();
    };
    g('kereta').addEventListener('change', () => {
      const k = keretaOf(g('kereta').value);
      if (k) { set('model', k.model); set('no_pendaftaran', k.no_pendaftaran); set('kumpulan', k.kumpulan || ''); }
      semakTindih(); kira();
    });
    app.querySelectorAll('input[name=e-jh]').forEach(x => x.addEventListener('change', () => { app.querySelector('#w-agen').hidden = jh() !== 'agen'; kira(); }));
    ['ambil_tarikh', 'ambil_masa', 'pulang_tarikh', 'pulang_masa'].forEach(k => g(k).addEventListener('change', () => { semakTindih(); kira(); }));
    g('sewa_hari').addEventListener('input', () => {
      const k = keretaOf(g('kereta').value), d = num('sewa_hari'); if (!k || d === null) return;
      set('caj_sewa', (d * Number(jh() === 'agen' ? k.harga_hari_agen : k.harga_hari_customer)).toFixed(2)); total();
    });
    semakTindih();
    // kira automatik bila dibuka kali pertama dan caj belum diisi
    kira(r.caj_sewa === null || r.caj_sewa === undefined);
  }
  let kira = () => {};

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
    if (p.jenis_harga !== 'agen') p.nama_agen = null;
    for (const k of ['ambil_jarak', 'pulang_jarak', 'sewa_hari', 'jumlah', 'deposit', ...CAJ.map(c => c[0])])
      if (p[k] !== null && p[k] !== undefined && (isNaN(p[k]) || p[k] < 0)) throw new Error('Nilai tidak sah pada medan nombor.');
    if (p.ambil_jarak != null && p.pulang_jarak != null && p.pulang_jarak < p.ambil_jarak) throw new Error('Jarak pulang lebih rendah daripada jarak ambil.');
    for (const k of ['ambil_jarak', 'pulang_jarak']) if (p[k] != null) p[k] = Math.round(p[k]);
    return p;
  }

  function sedangDisewa(kid) {
    const now = new Date();
    return S.rows.find(r => r.kereta_id === kid && aktifSewa(r) && mula(r) <= now && akhir(r) > now);
  }
  function stokView() {
    const kst = k => `<span class="chip ${k.status === 'aktif' ? 'st-selesai' : k.status === 'servis' ? 'st-baru' : 'st-batal'}">${KSTATUS[k.status]}</span>`;
    return `<button class="back" data-a="back">← Senarai Sewa</button>
      <div class="head"><div><h2>Stok Kereta Sewa</h2><p class="mute">Harga Customer dan Agen digunakan untuk kiraan automatik dalam Edit Dokumen Sewa.</p></div>
      ${owner ? '<button class="btn pri" data-kereta="baru">+ Tambah Kereta</button>' : ''}</div>
      ${S.keretaErr ? `<div class="card" style="border-color:#5a2a26;color:var(--bad)">${esc(/relation|does not exist|schema cache/i.test(S.keretaErr) ? 'Jadual stok belum wujud. Jalankan V60_SEWA_MIGRATION.sql terkini dalam Supabase SQL Editor.' : S.keretaErr)}</div>` : ''}
      <div class="list">${S.kereta.map(k => {
        const now = sedangDisewa(k.id), next = S.rows.filter(r => r.kereta_id === k.id && aktifSewa(r) && mula(r) > new Date()).sort((a, b) => mula(a) - mula(b))[0];
        return `<button class="item" data-kereta="${esc(k.id)}"${owner ? '' : ' style="cursor:default"'}><div><span class="ref">${esc(k.no_pendaftaran)}</span><br><b>${esc(k.model)}</b></div>${kst(k)}
          <span class="sub">${[k.kumpulan, k.warna, k.tahun].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</span>
          <div class="sub" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">
            ${[['customer', 'Customer', 'gold'], ['agen', 'Agen', 'blue']].map(([j, l, c]) => { const t = pakejTier(k, j); return `<div style="border:1px solid var(--line);border-radius:10px;padding:8px 10px"><small style="display:block">${l}</small>${t.length ? t.map(x => `<div style="display:flex;justify-content:space-between;gap:6px"><span>${x.hari} hari${x === t[t.length - 1] ? '+' : ''}</span><b style="color:var(--${c})">${fmtRM(x.harga)}<small style="font-weight:500">/hari</small></b></div>`).join('') : `<b style="color:var(--${c});font-size:15px">${fmtRM(k['harga_hari_' + j])}</b>/hari`}<div style="margin-top:3px">${fmtRM(k['harga_jam_' + j])}/jam</div></div>`; }).join('')}</div>
          <span class="sub">Deposit ${fmtRM(k.deposit)}${now ? ` · <b style="color:var(--warn)">Sedang disewa (${esc(now.ref_no)}) hingga ${dmy(now.pulang_tarikh)}</b>` : next ? ` · Tempahan seterusnya ${dmy(next.ambil_tarikh)}` : ' · Tiada tempahan'}</span></button>`;
      }).join('') || '<div class="empty">Belum ada kereta dalam stok.</div>'}</div>`;
  }
  function keretaForm() {
    const k = S.kid === 'baru' ? { status: 'aktif' } : keretaOf(S.kid) || {};
    const f = (key, l, o = {}) => `<div class="${o.full ? 'full' : ''}"><label for="k-${key}">${l}</label><input id="k-${key}" data-kk="${key}" type="${o.type || 'text'}"${o.type === 'number' ? ` min="0" step="${o.step || '0.01'}" inputmode="decimal"` : ''} placeholder="${o.ph || ''}" value="${esc(k[key] ?? '')}"></div>`;
    return `<button class="back" data-a="stok">← Stok Kereta</button><h2>${S.kid === 'baru' ? 'Tambah Kereta' : 'Edit Kereta'}</h2>
      <section class="card"><h3>Kenderaan</h3><div class="ed">
        ${f('model', 'Model *', { ph: 'cth: Toyota Alphard' })}${f('no_pendaftaran', 'No Pendaftaran *', { ph: 'cth: DEF 1234' })}
        ${f('kumpulan', 'Kumpulan', { ph: 'cth: MPV' })}${f('warna', 'Warna')}${f('tahun', 'Tahun', { type: 'number', step: '1', ph: 'cth: 2022' })}
        <div><label for="k-status">Status</label><select id="k-status" data-kk="status">${Object.entries(KSTATUS).map(([v, l]) => `<option value="${v}"${k.status === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div></section>
      <section class="card"><h3>Harga Sehari Ikut Tempoh Sewa</h3>
        <p class="mute" style="margin-bottom:10px">Isi <b>harga sehari</b> bagi setiap tempoh. Contoh Alphard: 1 hari RM650, 2 hari RM600 (jumlah RM1,200), 3 hari RM550 (RM1,650), 4 hari RM500 (RM2,000). Tekan <b>+ Tambah tempoh</b> untuk 7 hari, 30 hari dan lain-lain.</p>
        <table class="pk"><thead><tr><th>Hari</th><th>Customer RM/hari</th><th>Agen RM/hari</th><th></th></tr></thead><tbody id="pk-body">${pakejRows(k)}</tbody></table>
        <div class="row" style="margin-top:10px;align-items:center"><button type="button" class="btn sm" data-a="pk-add">+ Tambah tempoh</button><span class="mute" id="k-untung"></span></div>
        <p class="mute" style="margin-top:10px">Jumlah = bilangan hari × harga sehari tempoh itu. Tempoh lebih panjang daripada baris terakhir guna harga baris terakhir (cth 6 hari × harga 4 hari).</p><div id="k-contoh" class="mute" style="margin-top:6px"></div></section>
      <section class="card"><h3>Tambahan Masa & Deposit</h3><div class="ed">
        ${f('harga_jam_customer', 'Customer: harga sejam (RM)', { type: 'number', ph: '0.00' })}${f('harga_jam_agen', 'Agen: harga sejam (RM)', { type: 'number', ph: '0.00' })}
        ${f('deposit', 'Sekuriti Deposit (RM)', { type: 'number', ph: '0.00' })}<div></div>
        <div class="full"><label for="k-nota">Nota</label><textarea id="k-nota" data-kk="nota" maxlength="1000">${esc(k.nota || '')}</textarea></div>
      </div><p class="mute" style="margin-top:10px">Baki 12 jam ke bawah dicaj ikut harga sejam (tidak melebihi kadar sehari). Baki lebih 12 jam dikira sehari penuh.</p></section>
      <div class="savebar"><button class="btn pri" data-a="save-kereta">Simpan</button>${S.kid !== 'baru' ? '<button class="btn danger" data-a="del-kereta">Padam</button>' : ''}<span class="msg" id="k-msg"></span></div>`;
  }
  function pakejRow(x = {}) {
    return `<tr><td><input type="number" min="1" step="1" inputmode="numeric" data-pk="hari" value="${esc(x.hari ?? '')}" placeholder="cth 7"></td>
      <td><input type="number" min="0" step="0.01" inputmode="decimal" data-pk="customer" value="${esc(x.customer ?? '')}" placeholder="0.00"></td>
      <td><input type="number" min="0" step="0.01" inputmode="decimal" data-pk="agen" value="${esc(x.agen ?? '')}" placeholder="0.00"></td>
      <td><button type="button" class="btn sm danger" data-a="pk-del" title="Buang">✕</button></td></tr>`;
  }
  function pakejRows(k) {
    const ada = (Array.isArray(k.pakej) ? k.pakej : []).slice().sort((a, b) => a.hari - b.hari);
    const rows = ada.length ? ada : (Number(k.harga_hari_customer) > 0 ? [{ hari: 1, customer: k.harga_hari_customer, agen: k.harga_hari_agen }] : []);
    for (const h of [1, 2, 3]) if (!rows.some(x => +x.hari === h)) rows.push({ hari: h });
    return rows.sort((a, b) => a.hari - b.hari).map(pakejRow).join('');
  }
  function bacaPakej() {
    const out = [], seen = new Set();
    for (const tr of app.querySelectorAll('#pk-body tr')) {
      const v = k => tr.querySelector(`[data-pk=${k}]`).value.trim();
      const hari = v('hari'), c = v('customer'), ag = v('agen');
      if (!hari && !c && !ag) continue;
      const h = Number(hari);
      if (!Number.isInteger(h) || h < 1) throw new Error('Bilangan hari pakej mesti nombor bulat 1 ke atas.');
      if (seen.has(h)) throw new Error(`Pakej ${h} hari diisi lebih sekali.`);
      const cc = c === '' ? 0 : Number(c), aa = ag === '' ? 0 : Number(ag);
      if (isNaN(cc) || isNaN(aa) || cc < 0 || aa < 0) throw new Error('Semak harga pakej.');
      if (!cc && !aa) continue;
      seen.add(h); out.push({ hari: h, customer: cc, agen: aa });
    }
    return out.sort((a, b) => a.hari - b.hari);
  }
  function wireKereta() {
    const u = () => {
      let t = []; try { t = bacaPakej(); } catch { }
      const one = t[0], el = app.querySelector('#k-untung');
      el.textContent = one && one.customer && one.agen ? `Beza Customer − Agen (${one.hari} hari): ${fmtRM(one.customer - one.agen)} sehari` : '';
      app.querySelector('#k-contoh').innerHTML = t.filter(x => x.customer).length ? 'Jumlah Customer: ' + t.filter(x => x.customer).map(x => `${x.hari} hari = <b>${fmtRM(x.hari * x.customer)}</b>`).join(' · ') : '';
    };
    app.querySelector('#pk-body').addEventListener('input', u); u();
  }

  function stafView() {
    const rows = S.staf;
    return `<button class="back" data-a="back">← Senarai Sewa</button><h2>Staf</h2>
      <p class="mute">Staf daftar sendiri di halaman admin (pautan "Daftar akaun staf"). Akaun baharu tidak aktif sehingga anda tekan <b>Aktifkan</b>.</p>
      <div class="list">${rows === null ? '<div class="empty">Memuatkan…</div>' : rows.map(u => `<div class="item" style="cursor:default">
        <div><b>${esc(u.full_name || '(tiada nama)')}</b><br><span class="mute">${esc(u.email || '')}</span></div>
        <span class="chip ${u.enabled ? 'st-selesai' : 'st-baru'}">${u.enabled ? (u.role === 'owner' ? 'Owner' : 'Staf aktif') : 'Belum aktif'}</span>
        ${u.id === ctx.profile.id ? '<span class="sub">Akaun anda</span>' : `<div class="sub row" style="margin-top:6px">
          <button class="btn sm${u.enabled ? ' danger' : ' pri'}" data-a="staf-on" data-uid="${esc(u.id)}" data-v="${u.enabled ? '0' : '1'}">${u.enabled ? 'Nyahaktif' : 'Aktifkan'}</button>
          <button class="btn sm" data-a="staf-role" data-uid="${esc(u.id)}" data-v="${u.role === 'owner' ? 'staf' : 'owner'}">${u.role === 'owner' ? 'Jadikan Staf' : 'Jadikan Owner'}</button></div>`}
      </div>`).join('') || '<div class="empty">Tiada akaun.</div>'}</div><p class="msg" id="s-msg">${esc(S.msg)}</p>`;
  }

  function termaView() {
    return `<button class="back" data-a="back">← Senarai Sewa</button><h2>Tetapan</h2>
      ${ctx.manageStaff ? `<section class="card"><h3>No WhatsApp Abedin Car Rental</h3>
        <p class="mute" style="margin-bottom:8px">Pelanggan boleh tekan butang WhatsApp selepas hantar borang. Format: 60123456789</p>
        <div class="row"><input id="wa" inputmode="tel" placeholder="60123456789" value="${esc(S.wa ?? '')}" style="flex:1;min-width:180px"><button class="btn pri" data-a="save-wa">Simpan</button></div>
        <p class="msg" id="w-msg"></p></section>` : ''}
      <h2 style="margin-top:6px">Terma & Syarat</h2>
      <p class="mute">Teks ini dipaparkan pada borang pelanggan. Setiap perjanjian menyimpan salinan terma pada masa ia dihantar, jadi perubahan tidak menjejaskan perjanjian lama.<br>Format: tulis <b>## Tajuk</b> untuk tajuk bahagian, dan <b>1. teks</b> untuk setiap klausa.</p>
      <section class="card"><textarea id="terma" style="min-height:360px">${S.terma === null ? 'Memuatkan…' : esc(S.terma)}</textarea>
      <div class="row" style="margin-top:10px;align-items:center"><button class="btn pri" data-a="save-terma">Simpan Terma</button><span class="msg" id="t-msg"></span></div></section>`;
  }

  function render() {
    app.innerHTML = S.view === 'staf' ? stafView() : S.view === 'stok' ? stokView() : S.view === 'kereta' ? keretaForm() : S.view === 'edit' ? editView() : S.view === 'detail' ? detailView() : S.view === 'terma' ? termaView() : listView();
    if (S.view === 'edit') wireEdit(); else kira = () => {};
    if (S.view === 'kereta') wireKereta();
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
    const v = x => esc(x === null || x === undefined || x === '' ? '-' : x);
    const kv = (k, x) => `<tr><th>${k}</th><td>${v(x)}</td></tr>`;
    const tarikhBuat = new Date(r.created_at).toLocaleDateString('en-GB');
    const ak = r.aksesori || {};
    const akMark = x => x === 'Ada' ? '<span class="ok">✓ Ada</span>' : x === 'Tiada' ? '<span class="no">✗ Tiada</span>' : x === 'Rosak' ? '<span class="bad">! Rosak</span>' : '<span class="na">—</span>';
    const caj = CAJ.map(([k, l]) => `<tr><th>${l}</th><td class="num">${v(rm(r[k]))}</td></tr>`).join('');
    const css = `
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      @page{size:A4;margin:9mm}
      body{margin:0;font:10.5px/1.42 "Helvetica Neue",Arial,sans-serif;color:#1b2236;background:#fff}
      .page{width:192mm;margin:0 auto}
      .tc-page{break-before:page;page-break-before:always}
      .hero{display:flex;align-items:center;gap:14px;background:linear-gradient(120deg,#0f1c3a,#1d2f5c);color:#fff;border-radius:12px;padding:12px 16px;border-bottom:3px solid #c9a24b}
      .hero img{width:74px;height:74px;flex:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}
      .hero .t{flex:1}
      .hero h1{margin:0;font:700 21px/1.1 Georgia,"Times New Roman",serif;letter-spacing:.08em;color:#e8c875}
      .hero .s{margin-top:3px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#c8cfe0}
      .hero .meta{text-align:right;font-size:10px;color:#c8cfe0;line-height:1.6}
      .hero .meta b{display:block;font-size:15px;color:#fff;letter-spacing:.06em}
      .chips{display:flex;gap:6px;margin:9px 0 2px;flex-wrap:wrap}
      .chip{border:1px solid #d9dfeb;background:#f6f8fc;border-radius:99px;padding:3px 10px;font-size:9.5px;font-weight:700;color:#1d2f5c;text-transform:uppercase;letter-spacing:.06em}
      .chip.gold{background:#fbf3df;border-color:#e2c47c;color:#7a5a12}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
      .card{border:1px solid #dfe4ee;border-radius:10px;padding:8px 11px;break-inside:avoid}
      .card h3{margin:0 0 5px;font:700 9.5px/1 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#1d2f5c;display:flex;align-items:center;gap:6px}
      .card h3:before{content:"";width:3px;height:11px;background:#c9a24b;border-radius:2px}
      .full{grid-column:1/-1}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;font-weight:600;color:#6a7389;width:40%;padding:2.5px 6px 2.5px 0;vertical-align:top}
      td{padding:2.5px 0;vertical-align:top;white-space:pre-wrap;font-weight:600}
      .sched th,.sched td{border-bottom:1px solid #eef1f6;padding:4px 6px 4px 0;width:auto}
      .sched thead th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#1d2f5c;border-bottom:1.5px solid #c9a24b}
      .sched tbody th{width:22%}
      .num{text-align:right}
      .calc th{width:auto}
      .calc .tot th,.calc .tot td{background:#0f1c3a;color:#e8c875;font-size:12.5px;font-weight:800;padding:6px 8px}
      .calc .tot th{border-radius:6px 0 0 6px} .calc .tot td{border-radius:0 6px 6px 0}
      .calc .dep th,.calc .dep td{padding-top:6px;color:#1d2f5c}
      .ok{color:#14804a;font-weight:700}.no{color:#7b8496}.bad{color:#c62828;font-weight:700}.na{color:#aab1c0}
      .sig{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px;break-inside:avoid}
      .sig.one{grid-template-columns:minmax(0,55%)}
      .sig .box{border:1px dashed #c3cad8;border-radius:10px;padding:8px 11px;min-height:118px;display:flex;flex-direction:column;justify-content:flex-end}
      .sig img{height:62px;width:auto;object-fit:contain;align-self:flex-start;margin-bottom:2px}
      .sig .ln{border-top:1px solid #1b2236;padding-top:4px;font-size:9.5px;color:#4b5468}
      .sig .ln b{color:#1b2236;font-size:10.5px}
      .decl{margin-top:9px;font-size:9.5px;color:#4b5468;border-left:3px solid #c9a24b;padding:3px 0 3px 8px}
      .foot{margin-top:8px;text-align:center;font-size:8.5px;color:#8a93a6;letter-spacing:.06em}
      .tc-head{display:flex;align-items:center;gap:10px;border-bottom:2px solid #0f1c3a;padding-bottom:6px;margin-bottom:6px}
      .tc-head img{width:52px;height:52px}
      .tc-head h2{margin:0;flex:1;font:700 17px Georgia,serif;letter-spacing:.1em;color:#0f1c3a}
      .tc-head span{font-size:9px;color:#6a7389;text-align:right}
      .terma{font-size:10.2px;line-height:1.43;text-align:justify}
      .terma h4{font:700 10.8px Arial,sans-serif;margin:7px 0 2px;color:#0f1c3a;text-decoration:underline;text-underline-offset:2px;break-after:avoid;page-break-after:avoid}
      .terma h4:first-child{margin-top:2px}
      .terma p{margin:0 0 3px;padding-left:20px;text-indent:-20px;break-inside:avoid;page-break-inside:avoid}
      .terma p b{display:inline-block;width:20px;text-indent:0;color:#9a7424}
      .agree{margin-top:14px;border:1px solid #dfe4ee;border-radius:10px;padding:10px 13px;break-inside:avoid;page-break-inside:avoid}
      .agree .q{font:700 12.5px Georgia,serif;color:#0f1c3a}
      .agree .sig{margin-top:4px}.agree .sig .box{min-height:96px;border:0;padding:0}
      .agree .sig img{height:60px}
      @media screen{body{background:#e9edf4;padding:16px 0}.page{background:#fff;padding:9mm;box-shadow:0 4px 24px rgba(0,0,0,.12);margin-bottom:16px;width:210mm}}`;
    w.document.write(`<!DOCTYPE html><html lang="ms"><head><meta charset="utf-8"><title>Perjanjian Sewa ${esc(r.ref_no)} – ${esc(r.nama)}</title><style>${css}</style></head><body>
      <div class="page">
        <div class="hero"><img src="${esc(logoSrc)}" alt="Abe Din Car Rental">
          <div class="t"><h1>PERJANJIAN SEWA</h1><div class="s">Abe Din Car Rental · Trust &amp; Reliability</div></div>
          <div class="meta">No Rujukan<b>${esc(r.ref_no)}</b>Tarikh: ${tarikhBuat}</div></div>
        <div class="chips"><span class="chip gold">${jenisTxt(r.jenis_sewa)}</span><span class="chip">${esc(STATUS[r.status] || r.status)}</span>${r.no_pendaftaran ? `<span class="chip">${esc(r.no_pendaftaran)}</span>` : ''}${tempoh(r) ? `<span class="chip">${esc(tempoh(r))}</span>` : ''}</div>
        <div class="grid">
          <div class="card"><h3>Maklumat Penyewa</h3><table>${kv('Nama Penuh', r.nama)}${kv('No KP / Passport', r.no_kp)}${kv('No Telefon', r.telefon)}${kv('Email', r.email)}${kv('Alamat', [r.alamat, `${r.poskod} ${r.bandar}`, `${r.negeri}, ${r.negara}`].join('\n'))}${kv('No Lesen', r.no_lesen)}${kv('Luput Lesen', r.lesen_luput ? dmy(r.lesen_luput) : '')}</table></div>
          <div class="card"><h3>Maklumat Kenderaan</h3><table>${kv('Model', r.model)}${kv('No Pendaftaran', r.no_pendaftaran)}${kv('Kumpulan', r.kumpulan)}${kv('Jenis Sewaan', jenisTxt(r.jenis_sewa))}</table>
            <h3 style="margin-top:9px">Aksesori</h3><table>${AKSESORI.map(([k, l]) => `<tr><th>${l}</th><td>${akMark(ak[k])}</td></tr>`).join('')}</table></div>
          <div class="card full"><h3>Penghantaran &amp; Pengambilan</h3><table class="sched"><thead><tr><th></th><th>Ambil</th><th>Pulang</th></tr></thead><tbody>
            <tr><th>Lokasi</th><td>${v(r.ambil_lokasi)}</td><td>${v(r.pulang_lokasi)}</td></tr>
            <tr><th>Tarikh &amp; Masa</th><td>${dmy(r.ambil_tarikh)} · ${hm(r.ambil_masa)}</td><td>${dmy(r.pulang_tarikh)} · ${hm(r.pulang_masa)}</td></tr>
            <tr><th>Jarak (odometer)</th><td>${v(km(r.ambil_jarak))}</td><td>${v(km(r.pulang_jarak))}</td></tr>
            <tr><th>Minyak</th><td>${v(r.ambil_minyak)}</td><td>${v(r.pulang_minyak)}</td></tr></tbody></table></div>
          <div class="card"><h3>Caj Sewaan</h3><table class="calc">${kv('Sewa (Hari)', r.sewa_hari ?? '')}${caj}
            <tr class="tot"><th>JUMLAH</th><td class="num">${v(rm(r.jumlah))}</td></tr>
            <tr class="dep"><th>Sekuriti Deposit</th><td class="num">${v(rm(r.deposit))}</td></tr></table></div>
          <div class="card"><h3>Catatan</h3><table>${kv('Pelanggan', r.remark)}${kv('Abe Din Car Rental', r.remark_admin)}</table></div>
        </div>
        <div class="decl">Penyewa mengesahkan maklumat di atas adalah benar, telah menerima kenderaan dalam keadaan seperti yang dinyatakan, dan bersetuju dengan Terma &amp; Syarat di muka surat berikutnya.</div>
        <div class="sig one">
          <div class="box"><img src="${esc(r.tandatangan)}" alt=""><div class="ln"><b>${esc(r.nama)}</b><br>Tandatangan Penyewa · ${esc(r.no_kp)} · ${tarikhBuat}</div></div>
        </div>
        <div class="foot">ABE DIN CAR RENTAL · ${esc(r.ref_no)} · Perjanjian</div>
      </div>
      <div class="page tc-page">
        <div class="tc-head"><img src="${esc(logoSrc)}" alt=""><h2>TERMA &amp; SYARAT</h2><span>${esc(r.ref_no)}<br>${esc(r.nama)}</span></div>
        <div class="terma">${termaHtml(r.terma_snapshot)}</div>
        <div class="agree"><div class="q">Saya setuju dengan terma dan syarat yang dinyatakan.</div>
          <div class="sig"><div class="box"><img src="${esc(r.tandatangan)}" alt=""><div class="ln"><b>${esc(r.nama)}</b><br>(Tandatangan Penyewa)</div></div>
          <div class="box" style="align-items:flex-end;text-align:right"><div style="font-size:13px;font-weight:700;margin-bottom:4px">${tarikhBuat}</div><div class="ln" style="width:100%">(Tarikh)</div></div></div></div>
        <div class="foot">ABE DIN CAR RENTAL · ${esc(r.ref_no)} · Terma &amp; Syarat</div>
      </div>
      <script>window.onload=()=>Promise.all([...document.images].map(i=>i.decode?i.decode().catch(()=>{}):0)).then(()=>setTimeout(()=>print(),350))<\/script></body></html>`);
    w.document.close();
  }

  app.addEventListener('click', async e => {
    const t = e.target.closest('[data-a],[data-f],[data-open],[data-st],[data-kereta]'); if (!t) return;
    if (t.dataset.kereta) { if (!owner) return; S.kid = t.dataset.kereta; S.view = 'kereta'; render(); scrollTo(0, 0); return; }
    const a = t.dataset.a;
    if (t.dataset.f) { S.filter = t.dataset.f; render(); return; }
    if (t.dataset.open) { S.id = t.dataset.open; S.view = 'detail'; S.msg = ''; render(); scrollTo(0, 0); signDocs(S.rows.find(x => x.id === S.id)); return; }
    const r = S.rows.find(x => x.id === S.id);
    if (t.dataset.st && r) { if (t.dataset.st !== r.status) update(r.id, { status: t.dataset.st }, 'Status dikemas kini.'); return; }
    if (a === 'copy') {
      try { await navigator.clipboard.writeText(formUrl); app.querySelector('#copy-msg').textContent = 'Pautan disalin.'; }
      catch { prompt('Salin pautan ini:', formUrl); }
    } else if (a === 'buka-borang') {
      const o = document.createElement('div'); o.className = 'ovl';
      o.innerHTML = `<div class="bar"><span>Borang Perjanjian Sewa</span><span class="row" style="align-items:center;gap:14px"><a href="${esc(formUrl)}" target="_blank" rel="noopener">Tab baru ↗</a><button class="btn sm" data-a="tutup-borang">✕ Tutup</button></span></div><iframe src="${esc(formUrl)}" title="Borang Perjanjian Sewa"></iframe>`;
      app.appendChild(o);
    } else if (a === 'tutup-borang') { app.querySelector('.ovl')?.remove(); load();
    } else if (a === 'refresh') { S.loaded = false; render(); load(); }
    else if (a === 'back') { S.view = 'list'; S.msg = ''; render(); }
    else if (a === 'nota' && r) { update(r.id, { nota_staf: app.querySelector('#nota').value.trim() || null }, 'Nota disimpan.'); }
    else if (a === 'print' && r) printAgreement(r);
    else if (a === 'stok') { S.view = 'stok'; render(); scrollTo(0, 0); }
    else if (a === 'kira') kira(true);
    else if (a === 'pk-add') { app.querySelector('#pk-body').insertAdjacentHTML('beforeend', pakejRow()); app.querySelector('#pk-body tr:last-child input').focus(); }
    else if (a === 'pk-del') { t.closest('tr').remove(); app.querySelector('#pk-body').dispatchEvent(new Event('input')); }
    else if (a === 'save-kereta') {
      const m = app.querySelector('#k-msg'), row = {}; m.classList.remove('err');
      app.querySelectorAll('[data-kk]').forEach(el => {
        const v = el.value.trim(), k = el.dataset.kk;
        row[k] = el.type === 'number' ? (v === '' ? (k === 'tahun' ? null : 0) : Number(v)) : (v || null);
      });
      if (!row.model || !row.no_pendaftaran) { m.textContent = 'Model dan No Pendaftaran wajib.'; m.classList.add('err'); return; }
      try { row.pakej = bacaPakej(); } catch (err) { m.textContent = err.message; m.classList.add('err'); return; }
      const asas = row.pakej[0];
      row.harga_hari_customer = asas ? +asas.customer : 0;
      row.harga_hari_agen = asas ? +asas.agen : 0;
      if (Object.entries(row).some(([k, v]) => typeof v === 'number' && (isNaN(v) || v < 0))) { m.textContent = 'Semak nilai harga.'; m.classList.add('err'); return; }
      row.no_pendaftaran = row.no_pendaftaran.toUpperCase(); row.status ||= 'aktif'; row.updated_at = new Date().toISOString();
      m.textContent = 'Menyimpan…';
      const q = S.kid === 'baru' ? client.from('sewa_kereta').insert(row) : client.from('sewa_kereta').update(row).eq('id', S.kid);
      const { data, error } = await q.select().single();
      if (error) { m.textContent = 'Gagal simpan: ' + (/plate_uniq|duplicate/.test(error.message) ? 'No pendaftaran sudah ada dalam stok.' : error.message); m.classList.add('err'); return; }
      S.kereta = S.kid === 'baru' ? [...S.kereta, data] : S.kereta.map(x => x.id === data.id ? data : x);
      S.kereta.sort((a, b) => a.model.localeCompare(b.model)); S.view = 'stok'; render(); scrollTo(0, 0);
    } else if (a === 'del-kereta') {
      const k = keretaOf(S.kid); if (!k || !confirm(`Padam ${k.model} (${k.no_pendaftaran}) dari stok? Perjanjian lama tidak terjejas.`)) return;
      const { error } = await client.from('sewa_kereta').delete().eq('id', k.id);
      if (error) { app.querySelector('#k-msg').textContent = 'Gagal padam: ' + error.message; return; }
      S.kereta = S.kereta.filter(x => x.id !== k.id); S.view = 'stok'; render();
    }
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
        const { data } = await client.from('sewa_settings').select('key,value').in('key', ['terma', 'whatsapp']);
        const m = Object.fromEntries((data || []).map(x => [x.key, x.value]));
        S.terma = m.terma || ''; S.wa = m.whatsapp || ''; if (S.view === 'terma') render();
      }
    } else if (a === 'save-terma') {
      const v = app.querySelector('#terma').value, m = app.querySelector('#t-msg');
      m.textContent = 'Menyimpan…'; m.classList.remove('err');
      const { error } = await client.from('sewa_settings').upsert({ key: 'terma', value: v });
      if (error) { m.textContent = 'Gagal simpan: ' + error.message; m.classList.add('err'); return; }
      S.terma = v; m.textContent = 'Terma disimpan. Borang pelanggan kini memaparkan teks baharu.';
    } else if (a === 'save-wa') {
      const v = app.querySelector('#wa').value.replace(/\D/g, '').replace(/^0/, '60'), m = app.querySelector('#w-msg');
      const { error } = await client.from('sewa_settings').upsert({ key: 'whatsapp', value: v });
      if (error) { m.textContent = 'Gagal simpan: ' + error.message; m.classList.add('err'); return; }
      S.wa = v; app.querySelector('#wa').value = v; m.classList.remove('err'); m.textContent = 'No WhatsApp disimpan.';
    } else if (a === 'staf') {
      S.view = 'staf'; S.msg = ''; S.staf = null; render();
      const { data, error } = await client.from('profiles').select('id,email,full_name,role,enabled,created_at').order('created_at');
      S.staf = data || []; S.msg = error ? 'Gagal muat: ' + error.message : ''; if (S.view === 'staf') render();
    } else if (a === 'staf-on' || a === 'staf-role') {
      const uid = t.dataset.uid, patch = a === 'staf-on' ? { enabled: t.dataset.v === '1' } : { role: t.dataset.v };
      if (a === 'staf-role' && t.dataset.v === 'owner' && !confirm('Jadikan akaun ini Owner? Owner boleh ubah semua data, harga dan staf.')) return;
      const { data, error } = await client.from('profiles').update(patch).eq('id', uid).select('id,email,full_name,role,enabled,created_at').single();
      if (error) { S.msg = 'Gagal: ' + error.message; render(); return; }
      S.staf = S.staf.map(x => x.id === uid ? data : x); S.msg = 'Dikemas kini.'; render();
    }
  });

  render(); load();
}
