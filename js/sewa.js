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
.terma{white-space:pre-wrap;font-size:13.5px;color:#cfd3da;max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#0b0f10}
`;

const STATUS = { baru: 'Baru', disahkan: 'Disahkan', selesai: 'Selesai', batal: 'Batal' };
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
      <div class="row"><button class="btn pri" data-a="print">Cetak / PDF Perjanjian</button>
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
        ['Tempoh', tempoh(r)], ['Remark', r.remark]])}</section>
      <section class="card"><h3>Dokumen</h3>${docs.length ? `<div class="docs">${docs.map(([k, p]) => {
        const u = S.urls[p], pdf = /\.pdf$/i.test(p);
        return `<a class="doc" ${u ? `href="${esc(u)}" target="_blank" rel="noopener"` : ''}><div class="im" style="${u && !pdf ? `background-image:url('${esc(u)}')` : ''}">${pdf ? 'PDF' : u ? '' : '…'}</div><span>${DOC_LABEL[k] || k}</span></a>`;
      }).join('')}</div>` : '<p class="mute">Tiada dokumen.</p>'}</section>
      <section class="card"><h3>Tandatangan & Terma dipersetujui</h3><div class="sig"><img src="${esc(r.tandatangan)}" alt="Tandatangan ${esc(r.nama)}"></div>
        <div class="terma" style="margin-top:12px">${esc(r.terma_snapshot || '-')}</div></section>
      ${owner ? `<div class="row"><button class="btn danger" data-a="delete">Padam perjanjian & dokumen</button></div>` : ''}`;
  }

  function termaView() {
    return `<button class="back" data-a="back">← Senarai Sewa</button><h2>Terma & Syarat</h2>
      <p class="mute">Teks ini dipaparkan pada borang pelanggan. Setiap perjanjian menyimpan salinan terma pada masa ia dihantar, jadi perubahan tidak menjejaskan perjanjian lama.</p>
      <section class="card"><textarea id="terma" style="min-height:360px">${S.terma === null ? 'Memuatkan…' : esc(S.terma)}</textarea>
      <div class="row" style="margin-top:10px;align-items:center"><button class="btn pri" data-a="save-terma">Simpan Terma</button><span class="msg" id="t-msg"></span></div></section>`;
  }

  function render() {
    app.innerHTML = S.view === 'detail' ? detailView() : S.view === 'terma' ? termaView() : listView();
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

  function printAgreement(r) {
    const w = window.open('', '_blank'); if (!w) { alert('Benarkan pop-up untuk cetak.'); return; }
    const row = (k, v) => `<tr><th>${k}</th><td>${esc(v || '-')}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html lang="ms"><head><meta charset="utf-8"><title>Perjanjian Sewa ${esc(r.ref_no)}</title>
      <base href="${esc(location.href)}"><style>
      body{font:13px/1.45 Arial,sans-serif;color:#111;margin:28px;max-width:780px}
      header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1f2f57;padding-bottom:10px}
      header img{height:70px} h1{font-size:20px;color:#1f2f57;margin:0;text-align:right} .ref{text-align:right;color:#555}
      h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#1f2f57;margin:18px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}
      table{width:100%;border-collapse:collapse} th{width:34%;text-align:left;font-weight:600;color:#444;padding:4px 8px 4px 0;vertical-align:top} td{padding:4px 0;white-space:pre-wrap}
      .terma{white-space:pre-wrap;font-size:11.5px;color:#333} .sign{display:flex;gap:40px;margin-top:26px}
      .sign div{flex:1} .sign img{height:90px;display:block} .line{border-top:1px solid #333;padding-top:4px;margin-top:4px;font-size:12px}
      @media print{body{margin:12mm}}</style></head><body>
      <header><img src="abedin-car-rental-logo.webp" alt="Abedin Car Rental"><div><h1>PERJANJIAN SEWA</h1><div class="ref">No Rujukan: <b>${esc(r.ref_no)}</b><br>Tarikh: ${when(r.created_at)}</div></div></header>
      <h2>Maklumat Peribadi</h2><table>${row('Sewaan', jenisTxt(r.jenis_sewa))}${row('Nama Penuh', r.nama)}${row('Email', r.email)}${row('No Telefon', r.telefon)}${row('No KP / Passport', r.no_kp)}${row('Alamat', [r.alamat, `${r.poskod} ${r.bandar}`, `${r.negeri}, ${r.negara}`].join('\n'))}${row('No Lesen', r.no_lesen)}${row('Tarikh Luput Lesen', r.lesen_luput ? dmy(r.lesen_luput) : '')}</table>
      <h2>Maklumat Kenderaan</h2><table>${row('Model', r.model)}${row('Kumpulan', r.kumpulan)}</table>
      <h2>Penghantaran & Pengambilan</h2><table>${row('Ambil', `${r.ambil_lokasi}\n${dmy(r.ambil_tarikh)} ${hm(r.ambil_masa)}`)}${row('Pulang', `${r.pulang_lokasi}\n${dmy(r.pulang_tarikh)} ${hm(r.pulang_masa)}`)}${row('Tempoh', tempoh(r))}${row('Remark', r.remark)}</table>
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
