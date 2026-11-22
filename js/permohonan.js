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


/* V83 Sales Advisor: compact actions and editable applications */
.app-record{border-top:1px solid var(--line);padding:10px 0;min-width:0}
.app-summary{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0}
.app-summary b{font-size:14px}
.app-summary small{flex:1 1 100%;font-size:12px}
.app-read{font-size:10px;padding:3px 8px;border-radius:99px;font-weight:800}
.app-read.unread{background:#53411c;color:#ffe1a1}
.app-read.read{background:#183a2d;color:#a7efc6}
.app-actions{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}
.app-actions .btn{flex:0 1 auto;min-height:44px;font-size:12px;padding:9px 11px}
.app-actions .app-delete{border-color:#884140;color:#ffb8b5}
.app-filter{margin-bottom:8px}
.app-filter .on{border-color:var(--gold);color:var(--gold)}
.app-edit{background:#121a1a;border:1px solid var(--line);padding:12px;border-radius:12px;margin:10px 0}
.app-edit h4{margin:0 0 4px;color:var(--gold)}
.app-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
.app-edit-field{font-size:12px;min-width:0}
.app-edit-field span{display:block;margin-bottom:5px}
.app-edit-field input{min-width:0;max-width:100%;font-size:16px}
@container(max-width:680px){.app-fields{grid-template-columns:1fr}.app-actions .btn{flex:1 1 calc(50% - 6px)}}

/* Responsive staff workspace: use the available width without horizontal overflow. */
:host,.shell,.wrap{width:100%;min-width:0;max-width:none}
.shell{container-type:inline-size}
.wrap{gap:clamp(12px,1.5vw,20px)}
.card{min-width:0;overflow-wrap:anywhere;padding:clamp(14px,1.7vw,24px)}
.steps{grid-template-columns:repeat(3,minmax(0,1fr))}
.steps div{min-width:0}
.row{min-width:0}
.row .btn{flex:1 1 180px;min-width:0;min-height:44px}
.link{min-width:0;overflow-wrap:anywhere}
.field input{max-width:100%;min-width:0;font-size:16px}
.app-entry{min-width:0}
.app-entry>div{min-width:0;flex:1}
.app-entry button{flex:0 0 auto;min-height:42px}
#applications{min-width:0}
.app-detail{max-width:100%;min-width:0}
@container (min-width:960px){
  .steps{gap:16px}
  .steps div{padding:18px}
  .app-entry{padding:15px 4px}
}
@container (max-width:680px){
  .steps{grid-template-columns:1fr}
  .steps div{display:grid;grid-template-columns:28px minmax(0,1fr);gap:0 12px;align-items:start}
  .steps div::before{grid-row:span 2;margin:0}
  .app-entry{align-items:flex-start;flex-direction:column}
  .app-entry button{width:100%}
}
@container (max-width:420px){
  h2{font-size:20px}
  .card{padding:14px;border-radius:14px}
  .row{flex-direction:column;align-items:stretch}
  .row .btn{flex:0 0 auto;width:100%}
  .btn{min-height:46px}
}
/* V108: susunan baharu — Permohonan diterima di atas */
.pm-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}
.pm-head-act{display:flex;gap:8px}
.pm-head-act .btn{flex:0 0 auto;min-height:42px}
.pm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pm-tab{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1px solid var(--line);background:var(--soft);border-radius:14px;padding:10px 12px;cursor:pointer;color:var(--mute);font-size:12.5px;font-weight:700;text-align:left}
.pm-tab b{font-size:22px;color:var(--fg);line-height:1.1}
.pm-tab.on{border-color:var(--gold);background:rgba(216,173,87,.12);color:var(--gold)}
.pm-tab.on b{color:var(--gold)}
.pm-tab[data-app-filter=unread] b{color:#ffcf6e}
.pm-search{margin:12px 0 2px}
.pm-search input{font-size:16px}
#applications{display:flex;flex-direction:column;gap:10px;margin-top:6px}
.pm-item{border:1px solid var(--line);border-radius:14px;background:#0d1213;padding:12px;min-width:0}
.pm-item.is-new{border-color:rgba(230,183,93,.55);background:linear-gradient(150deg,rgba(230,183,93,.09),#0d1213 60%)}
.pm-top{display:flex;gap:11px;align-items:flex-start;min-width:0}
.pm-av{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:14px;background:#1f2627;color:var(--gold)}
.pm-item.is-new .pm-av{background:var(--gold);color:var(--gold-fg)}
.pm-main{min-width:0;flex:1}
.pm-name{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pm-name b{font-size:15.5px;overflow-wrap:anywhere}
.pm-meta{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px;font-size:12.5px;color:var(--mute)}
.pm-car{color:var(--fg);font-weight:600}
.pm-act{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:stretch}
.pm-act>.btn{flex:1 1 0;min-height:42px;font-size:13px;padding:8px 10px}
.pm-act .btn.on{border-color:var(--gold);color:var(--gold)}
.pm-more{position:relative;flex:0 0 auto}
.pm-more>summary{list-style:none;min-height:42px;min-width:46px;padding:8px 12px;font-size:18px;line-height:1}
.pm-more>summary::-webkit-details-marker{display:none}
.pm-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:5;display:flex;flex-direction:column;gap:6px;min-width:150px;padding:8px;border:1px solid var(--line);border-radius:12px;background:#141a1b;box-shadow:0 12px 30px rgba(0,0,0,.45)}
.pm-menu .btn{min-height:40px;font-size:13px;justify-content:flex-start}
.pm-detail{margin-top:10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pm-dsec{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#080b0c;min-width:0}
.pm-dsec h5{margin:0 0 6px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
.pm-dsec dl{margin:0;display:flex;flex-direction:column;gap:5px}
.pm-dsec dl div{display:grid;grid-template-columns:minmax(90px,38%) 1fr;gap:8px;font-size:13px}
.pm-dsec dt{color:var(--mute)}.pm-dsec dd{margin:0;overflow-wrap:anywhere}
.pm-detail>.hint{grid-column:1/-1}
.pm-empty{padding:22px 14px;text-align:center;color:var(--mute);border:1px dashed var(--line);border-radius:14px;font-size:14px}
.pm-share h3{margin-bottom:10px}
.pm-ok{margin-bottom:12px;font-size:13px}
.pm-share-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:6px}
.pm-share-grid>div{min-width:0}
.pm-share-grid .row{margin-top:10px}
.pm-how{margin-top:14px;font-size:13px;color:var(--mute)}
.pm-how summary{cursor:pointer;color:var(--fg);font-weight:600}
.pm-how ol{margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:4px}
@container (max-width:680px){
  .pm-share-grid,.pm-detail{grid-template-columns:1fr}
  .pm-act>.btn{flex:1 1 calc(50% - 6px)}
  .pm-tab b{font-size:19px}
  .pm-head-act{width:100%}.pm-head-act .btn.pri{flex:1}
}
`;

const S = { phone: '', q: '' };
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
  return `Salam, ini Abe Din Auto 🚗\n\nSila isi borang permohonan di link ini:\n${formLink()}\n\nSelepas tekan "Hantar & Simpan Permohonan", maklumat direkod dalam sistem. Anda boleh kongsi salinan melalui WhatsApp.`;
}
function render() {
  if (!app) return;
  const num = abeDin();
  const link = formLink();
  const toCustomer = 'https://wa.me/' + msisdn(S.phone) + '?text=' + encodeURIComponent(inviteText());
  app.innerHTML = `
  <div class="pm-head"><div><h2>Permohonan</h2><p class="lead">Semak permohonan pelanggan dan kongsi borang.</p></div>
    <div class="pm-head-act"><button class="btn" data-act="reload" title="Muat semula">↻</button><button class="btn pri" data-act="jump-share">＋ Kongsi borang</button></div></div>
  <section class="card pm-inbox">
    <div class="pm-tabs" role="tablist">
      <button type="button" class="pm-tab on" data-app-filter="all"><span>Semua</span><b data-n="all">–</b></button>
      <button type="button" class="pm-tab" data-app-filter="unread"><span>Belum baca</span><b data-n="unread">–</b></button>
      <button type="button" class="pm-tab" data-app-filter="read"><span>Sudah baca</span><b data-n="read">–</b></button>
    </div>
    <div class="pm-search"><input id="app-q" type="search" placeholder="Cari nama, telefon atau kereta…" value="${esc(S.q || '')}" autocomplete="off"></div>
    <p class="hint" id="applications-count">Memuatkan rekod…</p>
    <p id="app-feedback" role="status" aria-live="polite" class="hint"></p>
    <div id="applications" role="status">Memuatkan rekod…</div>
  </section>
  <section class="card pm-share" id="pm-share">
    <h3>Kongsi borang kepada pelanggan</h3>
    ${num ? `<p class="ok pm-ok">✓ Salinan borang boleh dihantar ke WhatsApp <b>+${esc(num)}</b></p>`
          : `<div class="warn">Nombor WhatsApp Abe Din belum ditetapkan. Owner perlu isi di <b>Tetapan → WhatsApp Abe Din</b>.</div>`}
    <div class="pm-share-grid">
      <div>
        <label>Link borang</label>
        <div class="link" id="link">${esc(link)}</div>
        <div class="row"><button class="btn pri" data-act="copy">Salin link</button><a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Buka borang</a></div>
      </div>
      <div>
        <label for="phone">Hantar terus ke WhatsApp pelanggan</label>
        <input id="phone" type="tel" inputmode="tel" value="${esc(S.phone)}" placeholder="cth: 012-345 6789">
        <div class="row"><a class="btn wa" id="send" href="${esc(toCustomer)}" target="_blank" rel="noopener">Hantar link</a><button class="btn" data-act="copymsg">Salin mesej</button></div>
        <div class="hint">Biarkan kosong untuk pilih kenalan dalam WhatsApp.</div>
      </div>
    </div>
    <details class="pm-how"><summary>Cara ia berfungsi</summary><ol><li>Staf kongsi link borang.</li><li>Pelanggan isi maklumat pemohon, pekerjaan, waris dan kereta.</li><li>Permohonan disimpan dalam sistem dan muncul di senarai atas.</li></ol></details>
  </section>`;
}



let applications = [];
let editingId = null;
let expandedId = null;
let clipboardSnapshot = null;
let viewFilter = 'all';
let busy = false;
const fieldNames={nama:'Nama',ic:'No. IC',tel:'Telefon',alamatTetap:'Alamat tetap',alamatSekarang:'Alamat sekarang',tempoh:'Tempoh menetap',tanggungan:'Tanggungan',kahwin:'Perkahwinan',bangsa:'Bangsa',agama:'Agama',rumah:'Rumah',pendidikan:'Pendidikan',email:'Emel',majikan:'Majikan',alamatMajikan:'Alamat majikan',jawatan:'Jawatan',mulaKerja:'Mula kerja',gred:'Gred',telPejabat:'Telefon pejabat',warisNama:'Nama waris',warisTel:'Telefon waris',warisHubungan:'Hubungan waris',warisAlamat:'Alamat waris',kereta:'Kereta diminati'};
const validRecordId = id => /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(id||''));
const getRecord = id => applications.find(x=>x.id===id);
const detailsOf = a => a.details && typeof a.details==='object' && !Array.isArray(a.details) ? a.details : {};
const recordText = a => [
  'ABE DIN AUTO | PERMOHONAN PELANGGAN',
  'Nama: '+(a.applicant_name||'-'),
  'Telefon: '+(a.applicant_phone||'-'),
  'Emel: '+(a.applicant_email||'-'),
  'Kereta: '+(a.car_interest||'-'),
  'Status: '+(a.read_at?'Sudah Baca':'Belum Baca'),
  'Tarikh: '+new Date(a.created_at).toLocaleString('ms-MY'),
  'Rujukan: '+a.id,
  ...Object.entries(fieldNames).map(([key,label])=>label+': '+(detailsOf(a)[key]??'-')),
  ...Object.entries(detailsOf(a)).filter(([key])=>!(key in fieldNames)).map(([key,value])=>key+': '+String(value))
].join('\n');
const snapshot = a => ({
  applicant_name:a.applicant_name||'',applicant_phone:a.applicant_phone||'',
  applicant_email:a.applicant_email||'',car_interest:a.car_interest||'',
  details:detailsOf(a)
});
function notify(message, error=false){
 const node=app?.querySelector('#app-feedback');
 if(!node)return;
 node.className=error?'warn':'ok';
 node.textContent=message;
}
function editForm(a){
 const d=detailsOf(a);
 const detailKeys=[...new Set([...Object.keys(fieldNames),...Object.keys(d)])].filter(k=>/^[a-zA-Z][a-zA-Z0-9_]*$/.test(k));
 const field=(name,label,value,type='text')=>'<label class="app-edit-field"><span>'+esc(label)+'</span><input name="'+esc(name)+'" type="'+type+'" value="'+esc(value??'')+'" '+(name==='applicant_name'?'required':'')+'></label>';
 return '<form class="app-edit" data-edit-form="'+esc(a.id)+'"><h4>Edit Permohonan</h4><p class="hint">Perubahan hanya disimpan selepas tekan Simpan. Paste tidak mengubah rekod secara automatik.</p>'+
  '<div class="app-fields">'+
  field('applicant_name','Nama pelanggan',a.applicant_name)+
  field('applicant_phone','Telefon pelanggan',a.applicant_phone,'tel')+
  field('applicant_email','Emel',a.applicant_email,'email')+
  field('car_interest','Kereta diminati',a.car_interest)+
  detailKeys.map(key=>field('detail_'+key,fieldNames[key]||key,d[key])).join('')+
  '</div><div class="app-actions"><button class="btn" type="button" data-op="paste" data-id="'+esc(a.id)+'">Paste dari clipboard</button><button class="btn pri" type="submit">Simpan</button><button class="btn" type="button" data-op="cancel" data-id="'+esc(a.id)+'">Batal</button></div></form>';
}
const groups=[['Pemohon',['nama','ic','tel','email','kahwin','tanggungan','bangsa','agama','pendidikan']],['Alamat',['alamatTetap','alamatSekarang','tempoh','rumah']],['Pekerjaan',['majikan','jawatan','gred','mulaKerja','telPejabat','alamatMajikan']],['Waris / Rujukan',['warisNama','warisHubungan','warisTel','warisAlamat']],['Kereta',['kereta']]];
function detailView(a){
 const d=detailsOf(a),known=new Set(groups.flatMap(g=>g[1]));
 const extra=Object.keys(d).filter(k=>!known.has(k)&&d[k]!==''&&d[k]!=null);
 const sec=(t,keys)=>{const rows=keys.filter(k=>d[k]!==undefined&&d[k]!==''&&d[k]!=null);if(!rows.length)return '';return '<div class="pm-dsec"><h5>'+esc(t)+'</h5><dl>'+rows.map(k=>'<div><dt>'+esc(fieldNames[k]||k)+'</dt><dd>'+esc(d[k])+'</dd></div>').join('')+'</dl></div>'};
 return '<div class="pm-detail">'+groups.map(g=>sec(g[0],g[1])).join('')+(extra.length?sec('Lain-lain',extra):'')+'<p class="hint">Rujukan: '+esc(a.id)+'</p></div>';
}
function ago(t){const s=(Date.now()-new Date(t))/1000;if(s<3600)return Math.max(1,Math.round(s/60))+' min lalu';if(s<86400)return Math.round(s/3600)+' jam lalu';if(s<172800)return 'Semalam';return new Date(t).toLocaleDateString('ms-MY',{day:'numeric',month:'short',year:'numeric'})}
function renderApplications(){
 const target=app?.querySelector('#applications');if(!target)return;
 const q=String(S.q||'').trim().toLowerCase();
 const base=q?applications.filter(a=>[a.applicant_name,a.applicant_phone,a.car_interest,a.applicant_email].some(x=>String(x||'').toLowerCase().includes(q))):applications;
 const rows=base.filter(a=>viewFilter==='all'||(viewFilter==='unread'?!a.read_at:!!a.read_at));
 const unread=applications.filter(a=>!a.read_at).length;
 const n={all:applications.length,unread,read:applications.length-unread};
 app.querySelectorAll('[data-n]').forEach(b=>b.textContent=n[b.dataset.n]);
 const count=app.querySelector('#applications-count');if(count)count.textContent=q?rows.length+' padanan untuk "'+S.q+'"':'';
 app.querySelectorAll('[data-app-filter]').forEach(b=>b.classList.toggle('on',b.dataset.appFilter===viewFilter));
 target.innerHTML=rows.length?(window.adaPg?window.adaPg.rows('apps',rows,renderApplications):rows).map(a=>{
  const isUnread=!a.read_at,open=expandedId===a.id;
  const phone=msisdn(a.applicant_phone);
  const text='Salam '+(a.applicant_name||'')+', saya dari Abe Din Auto berkenaan permohonan kereta '+(a.car_interest||'')+'.';
  const wa=phone?'https://wa.me/'+phone+'?text='+encodeURIComponent(text):'';
  const ini=String(a.applicant_name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  return '<article class="pm-item'+(isUnread?' is-new':'')+(open?' is-open':'')+'">'+
   '<div class="pm-top"><span class="pm-av">'+esc(ini)+'</span><div class="pm-main"><div class="pm-name"><b>'+esc(a.applicant_name||'-')+'</b>'+(isUnread?'<span class="app-read unread">Baru</span>':'')+'</div>'+
   '<div class="pm-meta">'+(a.car_interest?'<span class="pm-car">🚗 '+esc(a.car_interest)+'</span>':'')+(a.applicant_phone?'<span>📞 '+esc(a.applicant_phone)+'</span>':'')+'<span>🕒 '+esc(ago(a.created_at))+'</span></div></div></div>'+
   '<div class="pm-act">'+(wa?'<a class="btn wa" href="'+esc(wa)+'" target="_blank" rel="noopener noreferrer">WhatsApp</a>':'<button class="btn" disabled>Tiada telefon</button>')+
   '<button type="button" class="btn'+(open?' on':'')+'" data-op="view" data-id="'+esc(a.id)+'">'+(open?'Tutup':'Lihat butiran')+'</button>'+
   '<button type="button" class="btn '+(isUnread?'pri':'')+'" data-op="read" data-id="'+esc(a.id)+'">'+(isUnread?'✓ Sudah baca':'Belum baca')+'</button>'+
   '<details class="pm-more"><summary class="btn" aria-label="Lagi">⋯</summary><div class="pm-menu">'+
    '<button type="button" class="btn" data-op="edit" data-id="'+esc(a.id)+'">Edit</button>'+
    '<button type="button" class="btn" data-op="copy" data-id="'+esc(a.id)+'">Copy</button>'+
    '<button type="button" class="btn" data-op="paste" data-id="'+esc(a.id)+'">Paste</button>'+
    '<button type="button" class="btn app-delete" data-op="delete" data-id="'+esc(a.id)+'">Padam</button></div></details></div>'+
   (open?detailView(a):'')+(editingId===a.id?editForm(a):'')+'</article>';
 }).join('')+(window.adaPg?window.adaPg.nav('apps',rows.length):''):'<div class="pm-empty">'+(applications.length?(q?'Tiada padanan untuk carian ini.':'Tiada permohonan bagi status ini.'):'Belum ada permohonan diterima. Kongsi borang kepada pelanggan di bawah.')+'</div>';
}

async function loadApplications(){
 const target=app?.querySelector('#applications');
 if(!target||!ctx.client)return;
 target.textContent='Memuatkan rekod…';
 const {data,error}=await ctx.client.from('buyer_applications')
   .select('id,created_at,applicant_name,applicant_phone,applicant_email,car_interest,details,status,read_at,read_by')
   .is('deleted_at',null).order('created_at',{ascending:false}).limit(300);
 if(!app?.contains(target))return;
 if(error){target.textContent='Rekod tidak dapat dimuatkan: '+(error.message||'Semak akses staf.');return;}
 applications=data||[];
 if(editingId&&!getRecord(editingId))editingId=null;
 if(expandedId&&!getRecord(expandedId))expandedId=null;
 renderApplications();
}
async function updateApplication(a,patch,message){
 const query=ctx.client.from('buyer_applications').update(patch,{count:'exact'}).eq('id',a.id).is('deleted_at',null);
 // Archived rows leave the SELECT scope immediately; do not ask PostgREST
 // to SELECT them back after a soft delete.
 const {error,count}=await query;
 if(error)throw error;
 if(count===0)throw new Error('Rekod tidak berubah. Semak kebenaran akses.');
 notify(message);
 await loadApplications();
}
async function handleApplicationAction(button){
 const op=button.dataset.op,id=button.dataset.id;
 const a=getRecord(id);if(!a||!validRecordId(id)||busy)return;
 if(op==='view'){expandedId=expandedId===id?null:id;renderApplications();return;}
 if(op==='edit'){editingId=editingId===id?null:id;renderApplications();return;}
 if(op==='cancel'){editingId=null;renderApplications();return;}
 if(op==='copy'){
  clipboardSnapshot=snapshot(a);
  await copy(recordText(a),button);
  notify('Maklumat permohonan disalin. Paste boleh digunakan untuk mengisi borang Edit.');return;
 }
 if(op==='paste'){
  editingId=id;renderApplications();
  let saved=clipboardSnapshot;
  // Clipboard permission may be unavailable on iPhone. In that case reuse the last
  // record explicitly copied inside this module, rather than altering saved data.
  if(!saved&&navigator.clipboard?.readText){
   try{
    const input=await navigator.clipboard.readText();
    const parsed=JSON.parse(input);
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))saved=parsed;
   }catch(_){}
  }
  if(!saved){notify('Tiada data Copy yang boleh ditampal. Tekan Copy pada rekod dahulu.',true);return;}
  const form=app.querySelector('[data-edit-form="'+id+'"]');
  if(!form)return;
  for(const [key,value] of Object.entries(saved)){
   if(key==='details'&&value&&typeof value==='object'&&!Array.isArray(value)){
    for(const [k,v] of Object.entries(value)){
     const field=form.elements.namedItem('detail_'+k);
     if(field)field.value=String(v??'');
    }
   }else{
    const field=form.elements.namedItem(key);
    if(field)field.value=String(value??'');
   }
  }
  notify('Data ditampal ke borang Edit. Semak dahulu, kemudian tekan Simpan.');
  return;
 }
 if(op==='delete'){
  if(!confirm('Padam permohonan '+a.applicant_name+' daripada senarai? Rekod akan diarkibkan untuk audit.'))return;
  if(!confirm('Sahkan sekali lagi: rekod akan hilang daripada senarai aktif. Teruskan?'))return;
 }
 if(op!=='read'&&op!=='delete')return;
 busy=true;button.disabled=true;
 try{
  if(op==='read'){
   const readAt=a.read_at?null:new Date().toISOString();
   await updateApplication(a,{read_at:readAt,read_by:readAt?(ctx.profile?.id||null):null},readAt?'Ditanda Sudah Baca.':'Ditanda Belum Baca.');
  }else{
   const stamp=new Date().toISOString();
   await updateApplication(a,{deleted_at:stamp,deleted_by:ctx.profile?.id||null},'Permohonan diarkibkan daripada senarai.');
  }
 }catch(e){notify(e.message||String(e),true)}
 finally{busy=false;button.disabled=false}
}
async function submitApplicationEdit(form){
 const id=form.dataset.editForm,a=getRecord(id);if(!a||busy)return;
 const fd=new FormData(form);
 const name=String(fd.get('applicant_name')||'').trim();
 const phone=String(fd.get('applicant_phone')||'').trim();
 if(!name||!phone){notify('Nama dan nombor telefon pelanggan diperlukan.',true);return;}
 const updated={...detailsOf(a)};
 for(const [key] of Object.entries(fieldNames)){
  if(fd.has('detail_'+key))updated[key]=String(fd.get('detail_'+key)||'').trim();
 }
 for(const key of Object.keys(updated)){
  if(fd.has('detail_'+key))updated[key]=String(fd.get('detail_'+key)||'').trim();
 }
 const email=String(fd.get('applicant_email')||'').trim(),car=String(fd.get('car_interest')||'').trim();
 // Keep the detailed form fields in sync with the indexed summary fields.
 updated.nama=name;updated.tel=phone;updated.email=email;updated.kereta=car;
 const patch={applicant_name:name,applicant_phone:phone,applicant_email:email,
  car_interest:car,details:updated};
 busy=true;const btn=form.querySelector('button[type=submit]');if(btn)btn.disabled=true;
 try{await updateApplication(a,patch,'Permohonan pelanggan berjaya dikemas kini.');editingId=null;renderApplications()}
 catch(e){notify(e.message||String(e),true)}
 finally{busy=false;if(btn)btn.disabled=false}
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
    if (e.target.id === 'app-q') { S.q = e.target.value; renderApplications(); return; }
    if (e.target.id === 'phone') S.phone = e.target.value;
    else return;
    refreshLinks();
  });
  app.addEventListener('submit',e=>{const f=e.target.closest('form[data-edit-form]');if(!f)return;e.preventDefault();submitApplicationEdit(f)});
  app.addEventListener('click', e => {
    const filter=e.target.closest('button[data-app-filter]');
    if(filter){viewFilter=filter.dataset.appFilter;renderApplications();return;}
    const action=e.target.closest('button[data-op]');
    if(action){handleApplicationAction(action);return;}
    const b=e.target.closest('button[data-act]');if(!b)return;
    if(b.dataset.act==='copy')copy(formLink(),b);
    if(b.dataset.act==='copymsg')copy(inviteText(),b);
    if(b.dataset.act==='reload')loadApplications();
    if(b.dataset.act==='jump-share'){const sh=app.querySelector('#pm-share');sh?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>app.querySelector('#phone')?.focus({preventScroll:true}),450)}
  });
  render();
  loadApplications();
  window.__adaLive?.(el, ['buyer_applications'], loadApplications);
}
