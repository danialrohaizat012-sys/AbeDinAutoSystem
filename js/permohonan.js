// Abe Din Auto – modul Permohonan: staf salin / kongsi link borang permohonan.html kepada pelanggan.
// Borang tidak menyimpan data: bila pelanggan tekan Hantar, maklumat dibuka terus dalam WhatsApp Abe Din
// (nombor dari Tetapan > WhatsApp Abe Din). Dimuat oleh app.html melalui import('./js/permohonan.js').
const CSS = `
:host{display:block;--bg:#080b0c;--soft:rgba(255,255,255,.055);--line:#2d3536;--fg:#f3eee2;--mute:#969da8;
  --gold:#d8ad57;--gold-fg:#0b0d0e;--ok:#45c98b;--warn:#e6b75d;
  --f:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f)}
.wrap{display:flex;flex-direction:column;gap:14px;max-width:760px}
h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.01em}
h3{margin:0 0 12px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
p{margin:0}
.lead{color:var(--mute);font-size:14px;margin-top:4px}
button,input,select{font:inherit;color:inherit}
.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(150deg,#151b1c,#0d1112);padding:17px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;counter-reset:s}
.steps div{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--soft);font-size:13.5px;color:var(--mute)}
.steps div b{display:block;color:var(--fg);font-size:14px;margin-bottom:2px}
.steps div::before{counter-increment:s;content:counter(s);display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:var(--gold);color:var(--gold-fg);font-weight:800;font-size:13px;margin-bottom:8px}
@media (max-width:560px){.steps{grid-template-columns:1fr}.steps div{display:grid;grid-template-columns:24px 1fr;gap:0 10px;align-items:start}.steps div::before{grid-row:span 2;margin:0}}
label{display:block;font-size:13.5px;font-weight:600;margin:0 0 6px}
.field{margin-bottom:14px}
input,select{width:100%;background:#0b0f10;border:1px solid var(--line);border-radius:12px;padding:11px 12px;outline:none}
input:focus,select:focus{border-color:var(--gold)}
.hint{font-size:12.5px;color:var(--mute);margin-top:5px}
.check{display:flex;gap:8px;align-items:center;font-weight:500;font-size:14px;margin:0 0 14px;cursor:pointer}
.check input{width:18px;height:18px;accent-color:var(--gold)}
.link{display:flex;gap:8px;align-items:center;background:#0b0f10;border:1px dashed #4a3f28;border-radius:12px;padding:11px 12px;font-size:13.5px;word-break:break-all;color:var(--gold)}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.btn{flex:1 1 auto;border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:11px 14px;font-weight:700;font-size:14px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;color:var(--fg);cursor:pointer}
.btn.pri{background:var(--gold);border-color:var(--gold);color:var(--gold-fg)}
.btn.wa{background:#1fa855;border-color:#1fa855;color:#fff}
.warn{border:1px solid rgba(230,183,93,.45);background:rgba(230,183,93,.08);color:#f6dfae;border-radius:14px;padding:12px 14px;font-size:14px}
.ok{color:var(--ok);font-size:14px}
.app-entry{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
.app-entry small{color:var(--mute);display:block;overflow-wrap:anywhere}
.app-detail{white-space:pre-wrap;overflow-wrap:anywhere;background:#080b0c;padding:12px;border-radius:10px;font-size:13px;line-height:1.7}
`;

const S = { phone: '' };
let app = null, ctx = {};

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const msisdn = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '6' + d; return d; };
const abeDin = () => String(ctx.publicSettings?.whatsapp_number || '').replace(/\D/g, '');

function formLink() {
  const u = new URL('/permohonan.html', location.origin); // sentiasa dari root (dashboard berada di /admin/)
  u.search = '';
  return u.href;
}
function inviteText() {
  return `Salam, ini Abe Din Auto 🚗\n\nSila isi borang permohonan di link ini:\n${formLink()}\n\nSelepas tekan "Hantar", maklumat anda akan terus masuk ke WhatsApp kami. Terima kasih!`;
}
function render() {
  if (!app) return;
  const num = abeDin();
  const link = formLink();
  const toCustomer = 'https://wa.me/' + msisdn(S.phone) + '?text=' + encodeURIComponent(inviteText());
  app.innerHTML = `
  <div><h2>Borang Permohonan</h2><p class="lead">Kongsi link borang kepada pelanggan. Maklumat yang dihantar akan disimpan dalam sistem untuk semakan staf.</p></div>
  <div class="steps">
    <div><b>Staf kongsi link</b>Salin link atau hantar terus ke WhatsApp pelanggan.</div>
    <div><b>Pelanggan isi borang</b>Maklumat pemohon, pekerjaan, perujuk/waris dan kereta.</div>
    <div><b>Simpan ke sistem</b>Permohonan direkod dahulu, kemudian boleh kongsi melalui WhatsApp.</div>
  </div>
  ${num ? `<p class="ok">✓ Borang akan dihantar ke WhatsApp <b>+${esc(num)}</b> (ikut Tetapan).</p>`
        : `<div class="warn">Nombor WhatsApp Abe Din belum ditetapkan. Owner perlu isi di <b>Tetapan → WhatsApp Abe Din</b>, jika tidak pelanggan perlu pilih sendiri kepada siapa mahu hantar.</div>`}
  <div class="card">
    <h3>Link borang</h3>
    <div class="link" id="link">${esc(link)}</div>
    <div class="row">
      <button class="btn pri" data-act="copy">Salin link</button>
      <a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Buka borang</a>
    </div>
  </div>
  <div class="card">
    <h3>Hantar terus ke pelanggan</h3>
    <div class="field">
      <label for="phone">No. WhatsApp pelanggan</label>
      <input id="phone" type="tel" inputmode="tel" value="${esc(S.phone)}" placeholder="cth: 012-345 6789">
      <div class="hint">Biarkan kosong untuk pilih kenalan dalam WhatsApp.</div>
    </div>
    <div class="row"><a class="btn wa" id="send" href="${esc(toCustomer)}" target="_blank" rel="noopener">Hantar link melalui WhatsApp</a>
      <button class="btn" data-act="copymsg">Salin mesej</button></div>
  </div>
  <div class="card"><h3>Permohonan diterima</h3><button class="btn" data-act="reload">Muat semula rekod</button><div id="applications" style="margin-top:12px" role="status">Memuatkan rekod…</div></div>`;
}


let applications=[];
const fieldNames={nama:'Nama',ic:'No. IC',tel:'Telefon',alamatTetap:'Alamat tetap',alamatSekarang:'Alamat sekarang',tempoh:'Tempoh menetap',tanggungan:'Tanggungan',kahwin:'Perkahwinan',bangsa:'Bangsa',agama:'Agama',rumah:'Rumah',pendidikan:'Pendidikan',email:'Emel',majikan:'Majikan',alamatMajikan:'Alamat majikan',jawatan:'Jawatan',mulaKerja:'Mula kerja',gred:'Gred',telPejabat:'Telefon pejabat',warisNama:'Nama waris',warisTel:'Telefon waris',warisHubungan:'Hubungan waris',warisAlamat:'Alamat waris',kereta:'Kereta diminati'};
async function loadApplications(){
 const target=app?.querySelector('#applications');
 if(!target||!ctx.client)return;
 target.textContent='Memuatkan rekod…';
 const {data,error}=await ctx.client.from('buyer_applications')
  .select('id,created_at,applicant_name,applicant_phone,car_interest,details,status')
  .order('created_at',{ascending:false}).limit(100);
 if(!app?.contains(target))return;
 if(error){target.textContent='Rekod tidak dapat dimuatkan. Semak akses staf dan sambungan database.';return;}
 applications=data||[];
 target.innerHTML=applications.length?applications.map(a=>
 '<div class="app-entry"><div><b>'+esc(a.applicant_name)+'</b><small>'+
 esc(new Date(a.created_at).toLocaleString('ms-MY'))+' · '+esc(a.applicant_phone)+' · '+esc(a.car_interest)+
 '</small></div><button class="btn" data-view="'+esc(a.id)+'">Lihat butiran</button></div>').join(''):
 '<p class="hint">Belum ada permohonan diterima.</p>';
}
function showApplication(id){
 const item=applications.find(a=>a.id===id);
 if(!item)return;
 const target=app.querySelector('#applications');
 target.querySelector('.app-detail')?.remove();
 const node=document.createElement('div');node.className='app-detail';
 node.textContent='Tarikh: '+new Date(item.created_at).toLocaleString('ms-MY')+'\nRujukan: '+item.id+'\n\n'+
 Object.entries(fieldNames).map(([key,label])=>label+': '+String(item.details?.[key]||'-')).join('\n');
 [...target.querySelectorAll('button[data-view]')].find(b=>b.dataset.view===id)?.closest('.app-entry')?.after(node);
}

// Kemas kini link tanpa render semula (supaya fokus input tidak hilang).
function refreshLinks() {
  const link = formLink();
  app.querySelector('#link').textContent = link;
  app.querySelector('a[target][href*="permohonan.html"]').href = link;
  app.querySelector('#send').href = 'https://wa.me/' + msisdn(S.phone) + '?text=' + encodeURIComponent(inviteText());
}

async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) {} t.remove();
  }
  const o = btn.textContent; btn.textContent = 'Disalin ✓'; setTimeout(() => { btn.textContent = o; }, 1600);
}

export function mountPermohonan(el, c) {
  ctx = c || {};
  const root = el.shadowRoot || el.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style><div class="shell"><div class="wrap" id="app"></div></div>`;
  app = root.getElementById('app');
  app.addEventListener('input', e => {
    if (e.target.id === 'phone') S.phone = e.target.value;
    else return;
    refreshLinks();
  });
  app.addEventListener('click', e => {
    const view=e.target.closest('button[data-view]');if(view){showApplication(view.dataset.view);return;}
    const b = e.target.closest('button[data-act]'); if (!b) return;
    if (b.dataset.act === 'copy') copy(formLink(), b);
    if (b.dataset.act === 'copymsg') copy(inviteText(), b);
    if (b.dataset.act === 'reload') loadApplications();
  });
  render();
  loadApplications();
}
