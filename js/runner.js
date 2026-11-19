// Abe Din Auto – modul Runner (trace trip, upah, baki wang pendahuluan).
// Dimuat oleh app.html melalui import('./js/runner.js'). Jadual: runner_* (lihat V47_RUNNER_MIGRATION.sql).
// UI diasingkan dalam Shadow DOM supaya tidak bercampur dengan CSS sistem sedia ada.
const CSS=`
/* Layout: satu lajur sempit (telefon dahulu), tab Trip dan Laporan, butiran trip dibuka dalam halaman yang sama. */
/* Rupa hitam dan kuning mengikut logo Abe Din Auto. Sengaja satu tema gelap sahaja. */
:host{display:block;
  --bg:#0a0a09;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;
  --pri:#e8b10b;--pri-fg:#141000;--hl:#ffd24a;--hl-fg:#141000;--ok:#4ac27a;--bad:#c23b36;
  --f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;
  color-scheme:dark;
}
.brand{display:flex;justify-content:center;padding-block:2px 0}
.logo{width:min(72%,270px);height:auto;display:block}
.sum{border-top:2px solid var(--pri)}
*{box-sizing:border-box}
.shell{background:var(--bg);color:var(--fg);font:15px/1.45 var(--f);
  padding-block:14px 48px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.wrap{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:24px;letter-spacing:-.015em;font-weight:800}
h2{margin:0;font-size:20px;letter-spacing:-.01em;font-weight:700}
button,input,select{font:inherit;color:inherit}
.head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.mute{color:var(--mute);font-size:14px}
.tabs{display:flex;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px}
.tabs button{flex:1;border:0;background:none;color:var(--mute);font-weight:600;padding:10px;border-radius:999px;cursor:pointer}
.tabs button[aria-pressed=true]{background:var(--pri);color:var(--pri-fg)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0}
.sum b{font-size:30px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.r{display:flex;justify-content:space-between;align-items:center;gap:10px}
.r>*{min-width:0}
.trip{display:flex;flex-direction:column;gap:8px;width:100%;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;cursor:pointer}
.trip b{font-size:16px}
.num{font-variant-numeric:tabular-nums;font-weight:700}
.chip{font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--soft);white-space:nowrap}
.chip.s1{background:var(--hl);color:var(--hl-fg)}
.chip.s2,.chip.paid{background:var(--ok);color:#06140b}
.chip.due{background:transparent;border:1px solid var(--line);color:var(--mute)}
.plate{display:inline-block;background:var(--hl);color:var(--hl-fg);font-weight:800;letter-spacing:.05em;padding:2px 8px;border-radius:6px;font-size:13px;white-space:nowrap}
.btn{border:0;border-radius:14px;padding:14px;font-weight:700;font-size:16px;cursor:pointer;background:var(--pri);color:var(--pri-fg);width:100%}
.btn.alt{background:var(--soft);color:var(--fg)}
.btn.bad{background:var(--bad);color:#fff}
.sm{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:8px 12px;cursor:pointer;font-size:14px}
.sm.go{background:var(--pri);color:var(--pri-fg);border-color:var(--pri);font-weight:700}
.back,.lnk,.x{border:0;background:none;color:var(--pri);font-weight:700;cursor:pointer;padding:0;text-align:left}
.back{font-size:14px;align-self:flex-start}
.x{color:var(--mute);font-size:18px;line-height:1;padding:4px 8px}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--hl);outline-offset:2px}
label{display:block;font-size:13px;color:var(--mute);margin-bottom:4px}
.field{width:100%;border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:11px 13px;min-width:0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form{display:flex;flex-direction:column;gap:12px}
.steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.steps li{display:flex;gap:10px;align-items:center;color:var(--mute)}
.steps li:before{content:"";width:14px;height:14px;border-radius:50%;border:2px solid var(--line);flex:none}
.steps li.on{color:var(--fg)}
.steps li.on:before{background:var(--pri);border-color:var(--pri)}
.steps li.now{color:var(--fg);font-weight:700}
.steps li.now:before{background:var(--hl);border-color:var(--hl)}
.steps small{margin-left:auto;color:var(--mute);font-weight:400}
.line{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)}
.line:first-of-type{border-top:0}
.inline{display:flex;gap:8px;align-items:stretch}
.inline .field{flex:1}
.tot{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid var(--fg);padding-top:10px}
.tot b{font-size:28px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:14px}
th{font-size:12px;font-weight:600;color:var(--mute);text-align:right;padding:4px 6px}
td{padding:9px 6px;border-top:1px solid var(--line);text-align:right;white-space:nowrap}
th:first-child,td:first-child{text-align:left}
tr.zero td{color:var(--mute)}
.bar{height:4px;background:var(--soft);border-radius:2px;margin-top:5px;min-width:60px}
.bar i{display:block;height:100%;background:var(--pri);border-radius:2px}
.years{display:flex;gap:8px;flex-wrap:wrap}
.years button[aria-pressed=true]{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}
.note{background:var(--soft);border-radius:12px;padding:10px 12px;font-size:14px}
.note.err{background:var(--bad);color:#fff}
.empty{text-align:center;padding:28px 12px;display:flex;flex-direction:column;gap:10px;align-items:center}
.empty p{margin:0;color:var(--mute);max-width:32ch}
.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cols3 div{display:flex;flex-direction:column;gap:2px;min-width:0}
.cols3 b{font-variant-numeric:tabular-nums}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pth{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:0;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;text-align:left;min-width:0}
.pth img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
.pth span{font-size:12px;padding:4px 6px;color:var(--mute)}
.vh{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}
.vh:focus-visible+label{outline:3px solid var(--hl);outline-offset:2px}
label.btn{font-size:16px;margin:0;text-align:center;cursor:pointer}
.zoom{position:fixed;inset:0;z-index:20;background:rgba(5,12,14,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.zoom img{max-width:100%;max-height:68vh;border-radius:8px}
.zoom span{color:#fff}
.zoom .btn{max-width:360px}
.sum .mute{display:block}
.grp{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:6px}
.trip{gap:10px}
.trip .t{display:flex;justify-content:space-between;align-items:center;gap:10px;min-width:0}
.trip .t b{font-size:17px;overflow-wrap:anywhere}
.trip .amt{font-size:18px;white-space:nowrap}
.trip .route{display:flex;flex-wrap:wrap;gap:4px 8px;color:var(--mute);font-size:14px}
.trip .foot{border-top:1px solid var(--line);padding-top:10px}
/* Saiz tulisan lebih kecil dan jadual Laporan lebih padat */
.shell{font-size:14px}
h1{font-size:22px}
h2{font-size:18px}
.mute{font-size:13px}
.sum b{font-size:26px}
.sum .cols3 b{font-size:16px;overflow-wrap:anywhere}
.cols3{gap:8px}
.tot b{font-size:24px}
.btn{font-size:15px;padding:13px}
label.btn{font-size:15px}
.trip .t b{font-size:16px}
.trip .amt{font-size:17px}
table{font-size:13px}
th{font-size:11px}
td{padding:7px 5px}
tr.zero td{font-size:12px}
.bar{margin-top:4px}
.neg{color:#ff8a80}
.pos{color:var(--ok)}
label.tick{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--fg);margin:0;cursor:pointer}
.tick input{width:20px;height:20px;accent-color:var(--pri);flex:none;margin:0}
/* Kotak borang sama tinggi dan sama lebar, termasuk medan tarikh */
.two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.two>*{min-width:0}
.field{height:46px;max-width:100%;min-width:0;display:block}
input[type=date].field{-webkit-appearance:none;appearance:none;text-align:left}
input[type=date].field::-webkit-date-and-time-value{text-align:left}
input[type=checkbox].field{height:auto}
.chips{display:flex;flex-wrap:wrap;gap:8px}
/* Layout lebih kecil dan lega */
.shell{font-size:13.5px;padding-block:12px 40px}
.wrap{max-width:500px;gap:12px}
.logo{width:min(60%,210px)}
h1{font-size:20px}
h2{font-size:17px}
.mute{font-size:12.5px}
.tabs button{padding:8px;font-size:13.5px}
.card{padding:14px;border-radius:14px;gap:10px}
.sum b{font-size:24px}
.sum .cols3 b{font-size:15px}
.tot b{font-size:22px}
.trip{padding:12px 14px;border-radius:14px;gap:8px}
.trip .t b{font-size:15px}
.trip .amt{font-size:16px}
.trip .route{font-size:13px}
.btn{font-size:14px;padding:12px;border-radius:12px}
label.btn{font-size:14px}
.sm{font-size:13px;padding:7px 11px}
.field{height:42px;padding:8px 12px;font-size:14px;border-radius:10px}
label{font-size:12px}
.chip{font-size:11px;padding:3px 8px}
.plate{font-size:12px;padding:2px 7px}
.line{padding:7px 0}
.note{font-size:13px;padding:9px 11px}
table{font-size:12.5px}
th{font-size:10.5px}
td{padding:6px 5px}
.grp{margin-top:4px}
.steps{gap:8px}
/* Satu lagi langkah lebih kecil */
.shell{font-size:13px;padding-block:10px 36px}
.wrap{max-width:460px;gap:10px}
.logo{width:min(54%,185px)}
h1{font-size:18px}
h2{font-size:16px}
.mute{font-size:12px}
.tabs button{padding:7px;font-size:13px}
.card{padding:12px;border-radius:12px;gap:9px}
.sum b{font-size:22px}
.sum .cols3 b{font-size:14px}
.tot b{font-size:20px}
.trip{padding:10px 12px;border-radius:12px;gap:7px}
.trip .t b{font-size:14px}
.trip .amt{font-size:15px}
.trip .route{font-size:12.5px}
.trip .foot{padding-top:8px}
.btn{font-size:13.5px;padding:11px;border-radius:11px}
label.btn{font-size:13.5px}
.sm{font-size:12.5px;padding:6px 10px}
.field{height:40px;padding:7px 11px;font-size:13.5px}
label{font-size:11.5px}
.chip{font-size:10.5px;padding:2px 7px}
.plate{font-size:11.5px;padding:2px 6px}
.line{padding:6px 0}
.note{font-size:12.5px;padding:8px 10px}
table{font-size:12px}
th{font-size:10px}
td{padding:5px 4px}
.zoom img{max-height:62vh}
/* Tablet / iPad dan skrin lebar: lajur lebih luas, tulisan lebih selesa */
@media (min-width:700px){
  .shell{font-size:15.5px;padding-block:20px 56px}
  .wrap{max-width:860px;gap:16px}
  .logo{width:min(40%,300px)}
  .field{height:50px}
  .trip{padding:16px 20px;border-radius:16px;gap:10px}
  .card{padding:20px 22px}
  .pgrid{grid-template-columns:repeat(4,1fr);gap:10px}
  .sum .cols3 b{font-size:20px}
}
@media (min-width:1100px){
  .wrap{max-width:980px}
  .pgrid{grid-template-columns:repeat(5,1fr)}
}
.pager{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px}
.pager .sm:disabled{opacity:.35;cursor:default}
.req-reason{height:auto;min-height:88px;resize:vertical}.cols3 .card{padding:9px}.cols3 .card b{font-size:18px}
.tabs{flex-wrap:wrap}.tabs button{min-width:85px}
button:disabled{opacity:.6;cursor:wait}

.shell{background:transparent;padding:0}
.wrap{max-width:900px;margin:0 auto}
.brand{display:none}
`;

export const mountRunner=(function(){

var MON=['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis'];
var PLACES=['CARRO','CARSOME','Johor Bahru','Mersing','Kuantan','Kemaman','Kuala Terengganu','Kota Bharu','Kuala Lumpur','Shah Alam','Seremban','Melaka','Ipoh','Pulau Pinang','Gua Musang','Kuala Krai'];
var EXP=['Tol','Minyak','Makan','Penginapan','Tiket balik','Lain-lain'];
var ST=['Belum ambil','Dalam perjalanan','Sampai kedai'];
var app=null,H={},reg={addEventListener:function(t,f){H[t]=f}};
var S={trips:[],paid:{},tab:'trip',view:'list',open:null,month:'',year:String(new Date().getFullYear()),
  admin:false,owner:false,canEditTrip:false,client:null,requests:[],requestBusy:false,audits:[],receipts:[],staff:[],receiptBusy:false,db:null,loaded:false,slow:false,err:'',pending:false,confirmDel:null,
  photoList:[],photosOn:false,pw:null,pwId:null,zoom:null,busy:false,topups:[],confirmTop:null,ownp:{},rname:'',editName:false,page:0};
var PH=['Depan','Belakang','Kiri','Kanan','Dalam kereta','Odometer','Geran','Kerosakan','Lain-lain'];
var q=Promise.resolve();
function staffName(id){var v=S.staff.find(function(p){return p.id===id});return v?(v.full_name||'Staf'):id?'Staf ('+String(id).slice(0,7)+')':'Belum ditetapkan'}
function pendingUpah(id){return S.requests.some(function(r){return r.trip_id===id&&r.status==='pending'})}
function requestForTrip(id){return S.requests.filter(r=>r.trip_id===id).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))}
function upahStatus(r){return r.status==='pending'?'Menunggu Owner':r.status==='approved'?'Diluluskan':'Ditolak'}

function pad(n){return (n<10?'0':'')+n}
function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function fmt(n){return (+n||0).toLocaleString('en-MY',{minimumFractionDigits:0,maximumFractionDigits:2})}
function rm(n){return 'RM'+fmt(n)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dshort(d){if(!d)return '';var p=d.split('-');return (+p[2])+' '+MON[+p[1]-1]}
function tshort(iso){var d=new Date(iso);return d.getDate()+' '+MON[d.getMonth()]+', '+pad(d.getHours())+':'+pad(d.getMinutes())}
function expSum(t){return (t.exp||[]).reduce(function(a,e){return a+(+e.a||0)},0)}
function tot(t){return (+t.upah||0)+expSum(t)}
function byId(id){return S.trips.filter(function(t){return t.id===id})[0]}
function $(id){return app?app.querySelector('#'+id):null}
function ae(){return app&&app.getRootNode().activeElement}
function monthLabel(ym){var p=ym.split('-');return MON[+p[1]-1]+' '+p[0]}

function shrink(file){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){
      URL.revokeObjectURL(url);
      var tries=[[1000,.72],[800,.6],[640,.5]],u='';
      for(var i=0;i<tries.length;i++){
        var s=Math.min(1,tries[i][0]/Math.max(im.width,im.height)),c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        u=c.toDataURL('image/jpeg',tries[i][1]);
        if(u.length<200000)break;
      }
      if(u.length>240000)rej(new Error('gambar terlalu besar'));else res(u);
    };
    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('fail bukan gambar yang boleh dibaca'))};
    im.src=url;
  });
}
function watchPhotos(id){
  if(S.pwId===id)return;
  if(S.pw){S.pw();S.pw=null}
  S.pwId=id;S.photoList=[];S.photosOn=false;
  if(!id||!S.db)return;
  S.pw=S.db.collection('photos').where('trip','==',id).onSnapshot(function(sn){
    S.photoList=sn.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})})
      .filter(function(p){return String(p.img).indexOf('data:image/')===0})
      .sort(function(a,b){return (a.at||'').localeCompare(b.at||'')});
    S.photosOn=true;sched();
  },function(e){S.err='Tidak dapat baca gambar ('+((e&&e.code)||'ralat')+').';S.photosOn=true;sched()});
}
function photosCard(){
  var h='<div class="card"><b>Gambar kereta</b>';
  if(!S.photosOn)h+='<span class="mute">Memuatkan gambar…</span>';
  else if(!S.photoList.length)h+='<span class="mute">Belum ada gambar. Ambil depan, belakang, kiri, kanan dan odometer.</span>';
  else h+='<div class="pgrid">'+S.photoList.map(function(p){return '<button class="pth" data-act="zoom" data-id="'+esc(p.id)+'"><img src="'+esc(p.img)+'" alt="'+esc(p.label)+'"><span>'+esc(p.label)+'</span></button>'}).join('')+'</div>';
  h+='<div><label for="p-label">Jenis gambar</label><select class="field" id="p-label">'+PH.map(function(l){return '<option>'+l+'</option>'}).join('')+'</select></div>'+
    '<input class="vh" id="p-file" type="file" accept="image/*" multiple'+(S.busy?' disabled':'')+'><label class="btn alt" for="p-file">'+(S.busy?'Memuat naik…':'Tambah gambar')+'</label></div>';
  return h;
}
function rmn(n){return (n<0?'-':'')+rm(Math.abs(n))}
function neg(n){return n<0?' neg':''}
function ldate(iso){var d=new Date(iso);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function bal(){
  var inn=0,out=0,due=0;
  S.topups.forEach(function(x){inn+=+x.amt||0});
  Object.keys(S.paid).forEach(function(id){var p=S.paid[id],t=byId(id);out+=(+(p&&p.amount))||(t?tot(t):0)});
  S.trips.forEach(function(t){if(!S.paid[t.id]&&!isOwn(t))due+=tot(t)});
  return {inn:inn,out:out,due:due,bal:inn-out,after:inn-out-due};
}
function balView(){
  var b=bal(),h='';
  h+='<div class="card sum"><span class="mute">Baki wang pendahuluan, '+esc(rn())+'</span><b class="'+neg(b.bal).trim()+'">'+rmn(b.bal)+'</b>'+
    '<div class="cols3"><div><span class="mute">Diberi</span><b>'+rm(b.inn)+'</b></div><div><span class="mute">Ditolak</span><b>'+rm(b.out)+'</b></div><div><span class="mute">Belum tolak</span><b>'+rm(b.due)+'</b></div></div>'+
    '<div class="r"><span class="mute">Baki jika semua trip ditolak</span><span class="num'+neg(b.after)+'">'+rmn(b.after)+'</span></div></div>';
  if(S.owner)h+='<div class="card form"><b>Tambah wang kepada runner</b>'+
    '<div class="two"><div><label for="b-amt">Jumlah (RM)</label><input class="field" id="b-amt" type="number" inputmode="decimal" min="0" placeholder="3000"></div>'+
    '<div><label for="b-date">Tarikh</label><input class="field" id="b-date" type="date" value="'+today()+'"></div></div>'+
    '<div><label for="b-note">Nota (pilihan)</label><input class="field" id="b-note" placeholder="Contoh: Duit untuk trip minggu ini"></div>'+
    '<button class="btn" data-act="addtop">Simpan wang diberi</button></div>';
  var L=[];
  S.topups.forEach(function(x){L.push({k:(x.date||ldate(x.at||new Date().toISOString()))+'T00:00:00',inn:true,id:x.id,a:+x.amt||0,t:'Wang diberi',s:x.note||'',d:x.date||''})});
  Object.keys(S.paid).forEach(function(id){
    var p=S.paid[id],t=byId(id),a=(+(p&&p.amount))||(t?tot(t):0),d=p&&p.at?ldate(p.at):'';
    L.push({k:(d||'0000-00-00')+'T23:59:59',inn:false,id:id,a:-a,t:t?t.car+' '+t.plate:'Trip yang dipadam',s:t?t.from+' ke '+(t.to||'Kota Bharu'):'',d:d});
  });
  L.sort(function(x,y){return x.k.localeCompare(y.k)});
  var run=0;L.forEach(function(e){run+=e.a;e.r=run});
  h+='<div class="card"><b>Penyata</b>';
  if(!L.length)h+='<span class="mute">Belum ada rekod. Tambah wang diberi atau tolak bayaran trip dari baki.</span>';
  L.slice().reverse().forEach(function(e){
    h+='<div class="line"><div style="min-width:0"><div>'+esc(e.t)+'</div><div class="mute">'+(e.d?dshort(e.d):'')+(e.s?(e.d?', ':'')+esc(e.s):'')+'</div></div>'+
      '<div style="text-align:right;flex:none"><div class="num'+(e.a<0?'':' pos')+'">'+(e.a<0?'-':'+')+rm(Math.abs(e.a))+'</div><div class="mute">Baki '+rmn(e.r)+'</div>'+
      (S.owner&&e.inn?(S.confirmTop===e.id?'<button class="sm" data-act="deltopok" data-id="'+esc(e.id)+'">Sahkan padam</button>':'<button class="lnk mute" data-act="deltop" data-id="'+esc(e.id)+'">Padam</button>'):'')+'</div></div>';
  });
  return h+'</div>';
}
function write(fn){var p;try{p=Promise.resolve(fn())}catch(e){p=Promise.reject(e)}p.catch(function(e){S.err='Tidak dapat simpan: '+((e&&e.message)||'cuba lagi'); render()})}
function patch(id,data){write(function(){return S.db.doc('trips/'+id).update(data)})}

/* ---------- views ---------- */
function isOwn(t){return !!S.ownp[t.id]}
function rn(){return S.rname||'runner'}
function STN(t){return t.kind==='hantar'?['Belum bertolak','Dalam perjalanan','Sampai destinasi']:ST}
function kindName(t){return t.kind==='hantar'?'Hantar':'Ambil'}
function statusChip(t){return '<span class="chip s'+(t.st||0)+'">'+STN(t)[t.st||0]+'</span>'}
function paidChip(t){return S.paid[t.id]?'<span class="chip paid">Dibayar</span>':isOwn(t)?'<span class="chip paid">Dibayar pemilik</span>':'<span class="chip due">Belum bayar</span>'}

function tripCard(t){
  return '<button class="trip" data-open="'+esc(t.id)+'">'+
    '<div class="t"><b>'+esc(t.car)+'</b><span class="num amt">'+rm(tot(t))+'</span></div>'+
    '<div class="t"><span class="r" style="gap:8px"><span class="plate">'+esc(t.plate)+'</span><span class="chip">'+kindName(t)+'</span></span><span class="mute">'+dshort(t.date)+'</span></div>'+
    '<div class="route"><span>'+esc(t.from)+'</span><span aria-label="ke">→</span><span>'+esc(t.to||'Kota Bharu')+'</span></div>'+
    '<div class="t foot">'+statusChip(t)+paidChip(t)+'</div>'+
    '<div class="mute">PIC: '+esc(staffName(t.assigned_to))+(pendingUpah(t.id)?' · Permohonan upah pending':'')+'</div></button>';
}

function listView(){
  var cur=today().slice(0,7),h='';
  var ts=S.trips.slice().sort(function(a,b){return (b.date||'').localeCompare(a.date||'')||(b.created||0)-(a.created||0)});
  var m=ts.filter(function(t){return (t.date||'').slice(0,7)===cur});
  var msum=m.reduce(function(a,t){return a+tot(t)},0);
  h+='<div class="card sum"><div class="r"><div><span class="mute">Bulan ini, '+monthLabel(cur)+'</span><b>'+rm(msum)+'</b></div><span class="chip">'+m.length+' trip</span></div><div class="r"><span class="mute">Baki wang pendahuluan</span><span class="num'+neg(bal().bal)+'">'+rmn(bal().bal)+'</span></div></div>';
  h+='<div class="cols3"><div class="card"><span class="mute">Trip aktif</span><b>'+S.trips.filter(function(t){return (t.st||0)<2}).length+'</b></div><div class="card"><span class="mute">Belum bayar</span><b>'+S.trips.filter(function(t){return !S.paid[t.id]&&!isOwn(t)}).length+'</b></div><div class="card"><span class="mute">Upah pending</span><b>'+S.requests.filter(function(r){return r.status==='pending'}).length+'</b></div></div>'+
    '<button class="btn" data-act="new">Tambah trip</button>';
  if(S.month){
    ts=ts.filter(function(t){return (t.date||'').slice(0,7)===S.month});
    h+='<div class="note r"><span>Papar trip '+monthLabel(S.month)+'</span><button class="lnk" data-act="clearm">Papar semua</button></div>';
  }
  if(!S.loaded){h+='<div class="note">Memuatkan trip…'+(S.slow?' Sambungan perlahan, data mungkin belum terkini.':'')+'</div>';return h}
  if(!ts.length){
    h+=S.month?'<div class="empty"><p>Tiada trip pada bulan ini.</p></div>':
      '<div class="empty"><b>Belum ada trip</b><p>Tambah trip pertama bila anda upah runner ambil kereta.</p></div>';
    return h;
  }
  var all=ts,PP=10,pages=Math.max(1,Math.ceil(ts.length/PP));
  if(S.page>=pages)S.page=pages-1;if(S.page<0)S.page=0;
  ts=ts.slice(S.page*PP,S.page*PP+PP);
  var g='';
  ts.forEach(function(t){
    var ym=(t.date||'').slice(0,7);
    if(!S.month&&ym!==g){
      g=ym;
      var gt=0,gn=0;all.forEach(function(x){if((x.date||'').slice(0,7)===ym){gt+=tot(x);gn++}});
      h+='<div class="grp"><b>'+(ym?monthLabel(ym):'Tanpa tarikh')+'</b><span class="mute">'+gn+' trip, '+rm(gt)+'</span></div>';
    }
    h+=tripCard(t);
  });
  if(pages>1)h+='<div class="pager"><button class="sm" data-act="pprev"'+(S.page===0?' disabled':'')+'>← Sebelum</button><span class="mute">Halaman '+(S.page+1)+' / '+pages+' ('+all.length+' trip)</span><button class="sm" data-act="pnext"'+(S.page>=pages-1?' disabled':'')+'>Seterusnya →</button></div>';
  return h;
}

function presetChips(){
  return '<div><label>Pilih lokasi cepat</label><div class="chips">'+
    ['CARRO','CARSOME'].map(function(p){return '<button class="sm" data-act="preset" data-v="'+p+'">'+p+'</button>'}).join('')+
    '<button class="sm" data-act="preset" data-v="">Lain-lain, isi sendiri</button></div></div>';
}
function newView(){
  return '<button class="back" data-act="back">← Semua trip</button>'+
  '<div class="card form"><h2>Trip baharu</h2>'+
  '<div><label for="f-kind">Kategori</label><select class="field" id="f-kind"><option value="ambil">Ambil kereta (bawa ke kedai)</option><option value="hantar">Hantar kereta (dari kedai ke pelanggan)</option></select></div>'+
  '<div><label for="f-car">Model kereta</label><input class="field" id="f-car" placeholder="Contoh: Toyota Vios 2019"></div>'+
  '<div class="two"><div><label for="f-plate">No. plat</label><input class="field" id="f-plate" placeholder="JQR 4821"></div>'+
  '<div><label for="f-date">Tarikh</label><input class="field" id="f-date" type="date" value="'+today()+'"></div></div>'+
  presetChips()+
  '<div class="two"><div><label for="f-from">Dari</label><input class="field" id="f-from" list="places" placeholder="Johor Bahru"></div>'+
  '<div><label for="f-to">Ke</label><input class="field" id="f-to" list="places" value="Kota Bharu"></div></div>'+
  (S.admin?'<div><label for="f-upah">Upah runner (RM)</label><input class="field" id="f-upah" type="number" inputmode="decimal" min="0" placeholder="600"></div>':'')+
  '<datalist id="places">'+PLACES.map(function(p){return '<option value="'+p+'">'}).join('')+'</datalist>'+
  (S.owner?'<label class="tick"><input type="checkbox" id="f-own"> Dibayar oleh pemilik, tidak ditolak dari baki</label>':'')+
  '<button class="btn" data-act="create">Simpan trip</button></div>';
}

function editView(t){
  var st=t.st||0,ck=t.ck||[];
  var h='<button class="back" data-act="view">← Kembali ke trip</button>'+
  '<div class="card form"><h2>Edit trip</h2>'+
  '<div><label for="e-kind">Kategori</label><select class="field" id="e-kind"><option value="ambil"'+(t.kind==='hantar'?'':' selected')+'>Ambil kereta</option><option value="hantar"'+(t.kind==='hantar'?' selected':'')+'>Hantar kereta</option></select></div>'+
  '<div><label for="e-car">Model kereta</label><input class="field" id="e-car" value="'+esc(t.car)+'"></div>'+
  '<div class="two"><div><label for="e-plate">No. plat</label><input class="field" id="e-plate" value="'+esc(t.plate)+'"></div>'+
  '<div><label for="e-date">Tarikh</label><input class="field" id="e-date" type="date" value="'+esc(t.date)+'"></div></div>'+
  presetChips()+
  '<div class="two"><div><label for="e-from">Dari</label><input class="field" id="e-from" list="places" value="'+esc(t.from)+'"></div>'+
  '<div><label for="e-to">Ke</label><input class="field" id="e-to" list="places" value="'+esc(t.to||'Kota Bharu')+'"></div></div>'+
  '<div><label for="e-st">Status</label><select class="field" id="e-st">'+STN(t).map(function(s,i){return '<option value="'+i+'"'+(i===st?' selected':'')+'>'+s+'</option>'}).join('')+'</select></div>'+
  '<datalist id="places">'+PLACES.map(function(p){return '<option value="'+p+'">'}).join('')+'</datalist>'+
  '<div><label for="e-assigned">Staf bertanggungjawab</label><select class="field" id="e-assigned"><option value="">Belum ditetapkan</option>'+S.staff.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===t.assigned_to?' selected':'')+'>'+esc(p.full_name||'Staf')+'</option>'}).join('')+'</select></div>'+
  '<button class="btn" data-act="saveedit">Simpan perubahan</button></div>';
  if(ck.length){
    h+='<div class="card"><b>Check-in</b>';
    ck.forEach(function(c,i){h+='<div class="line"><span>'+esc(c.p)+' <span class="mute">'+tshort(c.t)+'</span></span><button class="x" data-act="delck" data-i="'+i+'" aria-label="Buang check-in '+esc(c.p)+'">×</button></div>'});
    h+='</div>';
  }
  return h;
}


function upahRequestRow(r,showTrip){
  var t=byId(r.trip_id),h='<div class="line" style="align-items:flex-start"><div style="min-width:0"><b>'+esc(r.direction==='tambah'?'Tambah upah':'Kurangkan upah')+' '+(r.direction==='tambah'?'+':'−')+rm(r.amount)+'</b>'+
    (showTrip?'<div class="mute">'+esc(t?t.car+' · '+t.plate:'Trip tidak dijumpai')+'</div>':'')+
    '<div class="mute">Upah asal '+rm(r.base_upah)+' · Cadangan '+rm((+r.base_upah||0)+(r.direction==='tambah'?1:-1)*(+r.amount||0))+'</div>'+
    '<div class="mute" style="overflow-wrap:anywhere">'+esc(r.reason)+'</div>'+
    '<div class="mute">'+esc(upahStatus(r))+(r.review_note?' · '+esc(r.review_note):'')+'</div></div></div>';
  if(S.owner&&r.status==='pending')h+='<div class="inline"><button class="sm go" data-act="approveupah" data-id="'+esc(r.id)+'"'+(S.requestBusy?' disabled':'')+'>Luluskan</button>'+
    '<button class="sm" data-act="rejectupah" data-id="'+esc(r.id)+'"'+(S.requestBusy?' disabled':'')+'>Tolak</button></div>';
  return h;
}
function upahRequestsCard(t){
  var settled=!!S.paid[t.id]||isOwn(t),rows=requestForTrip(t.id),pending=rows.some(r=>r.status==='pending');
  var h='<div class="card form"><h2>Permohonan pelarasan upah</h2><span class="mute">Upah semasa: <b>'+rm(t.upah)+'</b>. Upah hanya berubah selepas Owner meluluskan.</span>';
  if(!S.owner&&!settled&&!pending){
    h+='<div class="two"><div><label for="req-direction">Jenis permohonan</label><select class="field" id="req-direction"><option value="tambah">Tambah upah</option><option value="kurang">Kurangkan upah</option></select></div>'+
    '<div><label for="req-amount">Jumlah pelarasan (RM)</label><input class="field" id="req-amount" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="Contoh: 50"></div></div>'+
    '<div><label for="req-reason">Sebab permohonan</label><textarea class="field req-reason" id="req-reason" rows="3" maxlength="1000" placeholder="Nyatakan alasan tambah atau kurang upah"></textarea></div>'+
    '<button class="btn" data-act="submitupah"'+(S.requestBusy?' disabled':'')+'>Hantar permohonan</button>';
  }else if(settled)h+='<div class="note">Trip sudah dibayar. Pelarasan upah tidak dibenarkan.</div>';
  else if(pending&&!S.owner)h+='<div class="note">Permohonan sedang menunggu keputusan Owner.</div>';
  if(rows.length)h+='<b>Sejarah permohonan</b>'+rows.map(r=>upahRequestRow(r,false)).join('');
  return h+'</div>';
}
function requestsView(){
  var pending=S.requests.filter(r=>r.status==='pending').sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')),
      done=S.requests.filter(r=>r.status!=='pending').sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  return '<div class="card"><h2>Permohonan pelarasan upah</h2><span class="mute">'+pending.length+' permohonan menunggu</span></div>'+
    '<div class="card"><b>Menunggu keputusan</b>'+(pending.length?pending.map(r=>upahRequestRow(r,true)).join(''):'<span class="mute">Tiada permohonan menunggu.</span>')+'</div>'+
    '<div class="card"><b>Sejarah keputusan</b>'+(done.length?done.slice(0,40).map(r=>upahRequestRow(r,true)).join(''):'<span class="mute">Belum ada keputusan.</span>')+'</div>';
}


function receiptCard(t){
 var rows=S.receipts.filter(function(r){return r.trip_id===t.id}),locked=!!S.paid[t.id]||isOwn(t);
 var h='<div class="card form"><h2>Bukti resit perbelanjaan</h2>';
 h+=rows.length?'<div class="pgrid">'+rows.map(function(r){return '<div class="pth"><img src="'+esc(r.image_data)+'" alt="Resit '+esc(r.category)+'"><span>'+esc(r.category)+' '+rm(r.amount)+(r.note?' · '+esc(r.note):'')+'</span></div>'}).join('')+'</div>':'<span class="mute">Belum ada resit dimuat naik.</span>';
 if(!locked)h+='<div class="two"><div><label for="receipt-category">Jenis belanja</label><select class="field" id="receipt-category">'+EXP.map(function(n){return '<option>'+esc(n)+'</option>'}).join('')+'</select></div>'+
 '<div><label for="receipt-amount">Jumlah RM</label><input class="field" id="receipt-amount" type="number" step=".01" min=".01" placeholder="0.00"></div></div>'+
 '<div><label for="receipt-note">Nota</label><input class="field" id="receipt-note" maxlength="250" placeholder="Pilihan"></div>'+
 '<input class="vh" id="receipt-file" type="file" accept="image/*"'+(S.receiptBusy?' disabled':'')+'><label class="btn alt" for="receipt-file">'+(S.receiptBusy?'Memuat naik resit…':'Muat naik resit')+'</label>'+
 '<span class="mute">Resit ialah bukti. Tuntutan belanja masih perlu dimasukkan berasingan.</span>';
 return h+'</div>';
}
function auditCard(t){
 var rows=S.audits.filter(function(r){return r.trip_id===t.id}).sort(function(a,b){return (b.occurred_at||'').localeCompare(a.occurred_at||'')}).slice(0,12);
 var h='<div class="card"><b>Sejarah perubahan trip</b>';
 if(!rows.length)return h+'<span class="mute">Belum ada perubahan direkodkan sejak audit diaktifkan.</span></div>';
 rows.forEach(function(r){
  var before=r.before_data||{},after=r.after_data||{},keys=['car','plate','from_loc','to_loc','trip_date','upah','kind','st','exp','ck','times','assigned_to'];
  var changed=keys.filter(function(k){return JSON.stringify(before[k])!==JSON.stringify(after[k])});
  h+='<div class="line" style="align-items:flex-start"><div><b>'+esc(r.action==='create'?'Trip dicipta':r.action==='delete'?'Trip dipadam':'Trip dikemas kini')+'</b>'+
  '<div class="mute">'+esc(r.occurred_at?new Date(r.occurred_at).toLocaleString('ms-MY'):'')+' · '+esc(staffName(r.actor_id))+'</div>'+
  (r.action==='update'?'<div class="mute">Medan: '+esc(changed.join(', ')||'Tiada')+'</div>':'')+
  (changed.includes('upah')?'<div class="mute">Upah: '+rm(before.upah)+' → '+rm(after.upah)+'</div>':'')+'</div></div>';
 });
 return h+'</div>';
}

function detailView(t){
  var paid=!!S.paid[t.id],st=t.st||0,tm=t.times||{},h='';
  h+='<div class="r"><button class="back" data-act="back">← Semua trip</button>'+(S.canEditTrip?'<button class="sm" data-act="edit">Edit trip</button>':'')+'</div>';
  h+='<div class="card"><div class="r"><div><h2>'+esc(t.car)+'</h2><div class="mute">'+kindName(t)+', '+esc(t.from)+' ke '+esc(t.to||'Kota Bharu')+', '+dshort(t.date)+'</div></div><span class="plate">'+esc(t.plate)+'</span></div>';
  h+='<ul class="steps">'+
    '<li class="'+(st>=1?'on':'now')+'">'+(t.kind==='hantar'?'Ambil kereta dari kedai':'Ambil kereta')+(tm.ambil?'<small>'+tshort(tm.ambil)+'</small>':'')+'</li>'+
    '<li class="'+(st>=2?'on':st==1?'now':'')+'">Dalam perjalanan</li>'+
    '<li class="'+(st>=2?'on':'')+'">'+(t.kind==='hantar'?'Sampai destinasi':'Sampai kedai')+(tm.sampai?'<small>'+tshort(tm.sampai)+'</small>':'')+'</li></ul>';
  if(st==0)h+='<button class="btn" data-act="next">'+(t.kind==='hantar'?'Kereta dah diambil, mula hantar':'Kereta dah diambil, mula perjalanan')+'</button>';
  if(st==1)h+='<button class="btn" data-act="next">'+(t.kind==='hantar'?'Kereta dah sampai destinasi':'Kereta dah sampai kedai')+'</button>';
  h+='</div>';

  if(st>=1){
    h+='<div class="card"><b>Check-in perjalanan</b>';
    var ck=t.ck||[];
    if(!ck.length)h+='<span class="mute">Belum ada check-in.</span>';
    ck.forEach(function(c){h+='<div class="line"><span>'+esc(c.p)+'</span><span class="mute">'+tshort(c.t)+'</span></div>'});
    if(st==1)h+='<div class="inline"><input class="field" id="c-place" list="places" placeholder="Lokasi sekarang"><button class="sm go" data-act="checkin">Check-in</button></div>'+
      '<datalist id="places">'+PLACES.map(function(p){return '<option value="'+p+'">'}).join('')+'</datalist>';
    h+='</div>';
  }

  h+='<div class="note">Staf bertanggungjawab: <b>'+esc(staffName(t.assigned_to))+'</b></div>';
  h+=photosCard();
  var ex=t.exp||[];
  h+='<div class="card"><b>Tuntutan belanja</b>';
  if(!ex.length)h+='<span class="mute">Belum ada tuntutan.</span>';
  ex.forEach(function(e,i){h+='<div class="line"><span>'+esc(e.n)+'</span><span class="r" style="gap:4px"><span class="num">'+rm(e.a)+'</span>'+(paid?'':'<button class="x" data-act="delexp" data-i="'+i+'" aria-label="Buang '+esc(e.n)+'">×</button>')+'</span></div>'});
  if(!paid)h+='<div class="inline"><select class="field" id="x-type" aria-label="Jenis belanja" style="flex:1.3">'+EXP.map(function(e){return '<option>'+e+'</option>'}).join('')+'</select>'+
    '<input class="field" id="x-amt" type="number" inputmode="decimal" min="0" placeholder="RM" aria-label="Jumlah (RM)"><button class="sm go" data-act="addexp">Tambah</button></div>';
  h+='</div>';

  h+='<div class="card"><b>Bayaran runner</b>';
  if(S.admin&&!paid&&!isOwn(t)&&!pendingUpah(t.id))h+='<div class="inline"><input class="field" id="u-amt" type="number" inputmode="decimal" min="0" value="'+esc(t.upah||'')+'" aria-label="Upah (RM)"><button class="sm" data-act="saveupah">Simpan upah</button></div>';
  h+='<div class="line"><span>Upah</span><span class="num">'+rm(t.upah)+'</span></div>'+
     '<div class="line"><span>Tuntutan</span><span class="num">'+rm(expSum(t))+'</span></div>'+
     '<div class="tot"><span class="mute">Jumlah trip</span><b>'+rm(tot(t))+'</b></div>';
  if(paid){
    h+='<div class="r"><span class="chip paid">Dibayar</span><span class="mute">'+(S.paid[t.id].at?tshort(S.paid[t.id].at):'')+'</span></div>';
    if(S.admin)h+='<button class="btn alt" data-act="unpay">Batal tolak, pulangkan ke baki</button>';
  }else if(isOwn(t)){
    h+='<div class="r"><span class="chip paid">Dibayar pemilik</span></div><span class="mute">Tidak ditolak dari baki wang pendahuluan.</span>';
    if(S.owner)h+='<label class="tick"><input type="checkbox" id="o-own" checked> Dibayar oleh pemilik, tidak ditolak dari baki</label>';
  }else{
    if(S.owner)h+='<label class="tick"><input type="checkbox" id="o-own"> Dibayar oleh pemilik, tidak ditolak dari baki</label>';
    if(S.admin&&!pendingUpah(t.id)){
      var bb=bal(),after=bb.bal-tot(t);
      h+='<div class="line"><span class="mute">Baki sebelum tolak</span><span class="num'+neg(bb.bal)+'">'+rmn(bb.bal)+'</span></div>'+
        '<div class="line"><span class="mute">Baki selepas tolak</span><span class="num'+neg(after)+'">'+rmn(after)+'</span></div>'+
        (after<0?'<div class="note">Baki wang pendahuluan tidak mencukupi untuk trip ini.</div>':'')+
        '<button class="btn" data-act="pay">Tolak '+rm(tot(t))+' dari baki</button>';
    }else h+='<span class="chip due" style="align-self:flex-start">'+(pendingUpah(t.id)?'Bayaran ditangguh: permohonan upah pending':'Menunggu bayaran daripada bos')+'</span>';
  }
  h+='</div>';
  h+=upahRequestsCard(t);
  h+=receiptCard(t);
  h+=auditCard(t);
  if(S.admin)h+=S.confirmDel===t.id?'<button class="btn bad" data-act="delok">Sahkan padam trip ini</button>':'<button class="lnk" style="align-self:center;color:var(--mute)" data-act="del">Padam trip</button>';
  if(S.zoom){
    var z=S.photoList.filter(function(p){return p.id===S.zoom})[0];
    if(z)h+='<div class="zoom" role="dialog" aria-label="Gambar '+esc(z.label)+'"><img src="'+esc(z.img)+'" alt="'+esc(z.label)+'"><span>'+esc(z.label)+', '+tshort(z.at)+'</span>'+
      '<button class="btn" data-act="unzoom">Tutup</button>'+(S.admin?'<button class="btn bad" data-act="delphoto" data-id="'+esc(z.id)+'">Padam gambar</button>':'')+'</div>';
  }
  return h;
}

function reportView(){
  var ys={};ys[String(new Date().getFullYear())]=1;
  S.trips.forEach(function(t){if(t.date)ys[t.date.slice(0,4)]=1});
  var yl=Object.keys(ys).sort().reverse();
  if(!ys[S.year])S.year=yl[0];
  var M=[],i;for(i=0;i<12;i++)M.push({n:0,u:0,x:0,due:0,own:0});
  var all={};
  S.trips.forEach(function(t){
    if(!t.date)return;
    var y=t.date.slice(0,4);all[y]=all[y]||{n:0,t:0};all[y].n++;all[y].t+=tot(t);
    if(y!==S.year)return;
    var o=M[+t.date.slice(5,7)-1];o.n++;o.u+=+t.upah||0;o.x+=expSum(t);if(!S.paid[t.id]&&!isOwn(t))o.due+=tot(t);if(isOwn(t))o.own+=tot(t);
  });
  var T={n:0,u:0,x:0,due:0,own:0},mx=0;
  M.forEach(function(o){T.n+=o.n;T.u+=o.u;T.x+=o.x;T.due+=o.due;T.own+=o.own;mx=Math.max(mx,o.u+o.x)});
  var h='<div class="years">'+yl.map(function(y){return '<button class="sm" data-y="'+y+'" aria-pressed="'+(y===S.year)+'">'+y+'</button>'}).join('')+'</div>';
  h+='<div class="card sum"><span class="mute">Jumlah bayaran '+esc(rn())+' '+S.year+'</span><b>'+rm(T.u+T.x)+'</b>'+
    '<div class="cols3"><div><span class="mute">Trip</span><b>'+T.n+'</b></div><div><span class="mute">Upah</span><b>'+rm(T.u)+'</b></div><div><span class="mute">Tuntutan</span><b>'+rm(T.x)+'</b></div></div>'+
    '<div class="r"><span class="mute">Belum dibayar</span><span class="num">'+rm(T.due)+'</span></div>'+
    '<div class="r"><span class="mute">Dibayar pemilik (tak ditolak dari baki)</span><span class="num">'+rm(T.own)+'</span></div></div>';
  h+='<div class="card"><b>Bulanan '+S.year+'</b><div class="scroll"><table><thead><tr><th>Bulan</th><th>Trip</th><th>Upah</th><th>Tuntutan</th><th>Jumlah</th></tr></thead><tbody>';
  M.forEach(function(o,k){
    var j=o.u+o.x;
    if(!o.n){h+='<tr class="zero"><td>'+MON[k]+'</td><td>–</td><td>–</td><td>–</td><td>–</td></tr>';return}
    h+='<tr><td><button class="lnk" data-m="'+S.year+'-'+pad(k+1)+'">'+MON[k]+'</button></td><td>'+o.n+'</td><td>'+fmt(o.u)+'</td><td>'+fmt(o.x)+'</td>'+
      '<td><b>'+fmt(j)+'</b><div class="bar"><i style="width:'+(mx?Math.round(j/mx*100):0)+'%"></i></div></td></tr>';
  });
  h+='</tbody></table></div><span class="mute">Ikut tarikh ambil kereta. Tekan nama bulan untuk lihat trip.</span></div>';
  var ya=Object.keys(all).sort().reverse();
  if(ya.length>1){
    h+='<div class="card"><b>Setiap tahun</b><div class="scroll"><table><thead><tr><th>Tahun</th><th>Trip</th><th>Jumlah</th></tr></thead><tbody>'+
      ya.map(function(y){return '<tr><td>'+y+'</td><td>'+all[y].n+'</td><td><b>'+fmt(all[y].t)+'</b></td></tr>'}).join('')+'</tbody></table></div></div>';
  }
  return h;
}

function render(){
  if(!app||!app.isConnected)return;
  S.pending=false;
  var h='<div class="head"><h1>Runner</h1><span class="mute">'+(S.admin?'Paparan bos':'Paparan runner')+'</span></div>'+
    '<div class="r"><span class="mute">Runner: <b style="color:var(--fg)">'+(S.rname?esc(S.rname):'belum ditetapkan')+'</b></span>'+(S.owner?'<button class="lnk" data-act="rname">'+(S.rname?'Ubah nama':'Letak nama')+'</button>':'')+'</div>';
  if(!S.db){app.innerHTML=h+'<div class="note">Menyambung ke pelayan…</div>';return}
  h+='<div class="tabs" role="group" aria-label="Pilih bahagian"><button data-tab="trip" aria-pressed="'+(S.tab==='trip')+'">Trip</button><button data-tab="lap" aria-pressed="'+(S.tab==='lap')+'">Laporan</button><button data-tab="bal" aria-pressed="'+(S.tab==='bal')+'">Baki</button>'+(S.owner?'<button data-tab="permohonan" aria-pressed="'+(S.tab==='permohonan')+'">Permohonan ('+S.requests.filter(r=>r.status==='pending').length+')</button>':'')+'</div>';
  if(S.err)h+='<div class="note err r"><span>'+esc(S.err)+'</span><button class="x" style="color:#fff" data-act="dismiss" aria-label="Tutup">×</button></div>';
  if(S.editName&&S.owner)h+='<div class="card form"><div><label for="r-name">Nama runner</label><input class="field" id="r-name" value="'+esc(S.rname)+'" placeholder="Contoh: Azman"></div>'+
    '<div class="inline"><button class="btn" data-act="savename">Simpan nama</button><button class="btn alt" data-act="cancelname">Batal</button></div></div>';
  if(S.tab==='permohonan'&&S.owner)h+=requestsView();
  else if(S.tab==='lap')h+=reportView();
  else if(S.tab==='bal')h+=balView();
  else if(S.view==='new')h+=newView();
  else if(S.view==='edit'){var te=byId(S.open);if(te)h+=editView(te);else{S.view='list';h+=listView()}}
  else if(S.view==='detail'){var t=byId(S.open);if(t)h+=detailView(t);else{S.view='list';h+=listView()}}
  else h+=listView();
  app.innerHTML=h;
}
function sched(){
  var a=ae();
  if(a&&app.contains(a)&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)){S.pending=true;return}
  render();
}
function go(tab,view,open){S.tab=tab;S.view=view;S.open=open||null;S.confirmDel=null;S.zoom=null;watchPhotos(tab==='trip'&&view==='detail'?open:null);render();window.scrollTo(0,0)}

/* ---------- actions ---------- */
reg.addEventListener('focusout',function(){
  if(!S.pending)return;
  setTimeout(function(){var a=ae();if(S.pending&&!(a&&app.contains(a)&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)))render()},400);
});
reg.addEventListener('click',function(e){
  var el=e.target.closest('[data-act],[data-open],[data-tab],[data-y],[data-m]');if(!el||!S.db)return;
  var d=el.dataset,t=S.open?byId(S.open):null,nowIso=new Date().toISOString();
  if(d.tab){S.page=0;go(d.tab,'list');return}
  if(d.open){go('trip','detail',d.open);return}
  if(d.y){S.year=d.y;render();return}
  if(d.m){S.month=d.m;S.page=0;go('trip','list');return}
  switch(d.act){
    case 'submitupah':{
      if(!t||S.owner||S.requestBusy||S.paid[t.id]||isOwn(t)||requestForTrip(t.id).some(r=>r.status==='pending'))break;
      var direction=$('req-direction').value,amount=Number($('req-amount').value),reason=$('req-reason').value.trim();
      if(!['tambah','kurang'].includes(direction)||!Number.isFinite(amount)||amount<=0||!Number.isInteger(Math.round(amount*100))||Math.abs(amount*100-Math.round(amount*100))>0.000001){S.err='Masukkan jumlah yang sah (maksimum 2 perpuluhan).';render();break}
      if(direction==='kurang'&&amount>Number(t.upah||0)){S.err='Pengurangan melebihi upah semasa.';render();break}
      if(reason.length<5){S.err='Alasan mestilah sekurang-kurangnya 5 aksara.';render();break}
      S.requestBusy=true;
      S.client.from('runner_upah_requests').insert({trip_id:t.id,direction:direction,amount:amount,base_upah:+t.upah||0,reason:reason}).then(function(res){
        if(res.error)throw res.error;S.err='';return S.db.refresh();
      }).catch(function(e){S.err='Permohonan gagal: '+(e.message||'Cuba lagi')}).then(function(){S.requestBusy=false;render()});
      break}
    case 'approveupah':case 'rejectupah':{
      if(!S.owner||S.requestBusy||!d.id)break;
      S.requestBusy=true;
      S.client.rpc('runner_decide_upah_request',{p_request_id:d.id,p_approve:d.act==='approveupah',p_note:null}).then(function(res){
        if(res.error)throw res.error;S.err='';return S.db.refresh();
      }).catch(function(e){S.err='Keputusan gagal: '+(e.message||'Cuba lagi')}).then(function(){S.requestBusy=false;render()});
      break}

    case 'zoom':S.zoom=d.id;render();break;
    case 'unzoom':S.zoom=null;render();break;
    case 'delphoto':if(S.admin){var pid=d.id;S.zoom=null;write(function(){return S.db.doc('photos/'+pid).delete()});render()}break;
    case 'addtop':{
      if(!S.owner)break;
      var ta=+$('b-amt').value;
      if(!(ta>0)){S.err='Masukkan jumlah wang diberi.';render();break}
      var rec3={amt:ta,date:$('b-date').value||today(),note:$('b-note').value.trim(),at:nowIso};
      S.err='';
      write(function(){return S.db.collection('topups').doc().set(rec3)});
      $('b-amt').value='';$('b-note').value='';break}
    case 'deltop':S.confirmTop=d.id;render();break;
    case 'deltopok':if(S.owner){var tid=d.id;S.confirmTop=null;write(function(){return S.db.doc('topups/'+tid).delete()});render()}break;
    case 'preset':{
      var pre=$('f-kind')?'f':'e',kd=$(pre+'-kind')?$(pre+'-kind').value:'ambil';
      var tg=$(pre+(kd==='hantar'?'-to':'-from'));
      if(tg){tg.value=d.v||'';if(!d.v)tg.focus()}
      break}
    case 'rname':if(S.owner){S.editName=true;render();var rf=$('r-name');if(rf)rf.focus()}break;
    case 'cancelname':S.editName=false;render();break;
    case 'savename':if(S.owner){
      var nm=$('r-name').value.trim();
      S.editName=false;S.rname=nm;
      write(function(){return S.db.doc('settings/runner').set({name:nm})});
      render()}break;
    case 'back':go('trip','list');break;
    case 'edit':if(t&&S.canEditTrip)go('trip','edit',t.id);break;
    case 'view':if(t)go('trip','detail',t.id);break;
    case 'saveedit':{
      if(!t||!S.canEditTrip)break;
      var ecar=$('e-car').value.trim(),eplate=$('e-plate').value.trim().toUpperCase(),efrom=$('e-from').value.trim();
      if(!ecar||!eplate||!efrom){S.err='Isi model kereta, no. plat dan lokasi ambil.';render();break}
      var ns=+$('e-st').value,rec2=Object.assign({},t),tm2=Object.assign({},t.times||{});
      delete rec2.id;
      if(ns<1)delete tm2.ambil;
      if(ns<2)delete tm2.sampai;
      if(ns>=1&&!tm2.ambil)tm2.ambil=nowIso;
      if(ns>=2&&!tm2.sampai)tm2.sampai=nowIso;
      rec2.car=ecar;rec2.plate=eplate;rec2.from=efrom;rec2.to=$('e-to').value.trim()||'Kota Bharu';
      rec2.date=$('e-date').value||t.date;rec2.st=ns;rec2.times=tm2;rec2.kind=$('e-kind').value;rec2.assigned_to=$('e-assigned').value||null;
      var eid=t.id;S.err='';
      write(function(){return S.db.doc('trips/'+eid).update({car:rec2.car,plate:rec2.plate,from:rec2.from,to:rec2.to,date:rec2.date,st:rec2.st,times:rec2.times,kind:rec2.kind,assigned_to:rec2.assigned_to})});
      go('trip','detail',eid);break}
    case 'delck':if(t&&S.canEditTrip){var ck2=(t.ck||[]).slice();ck2.splice(+d.i,1);patch(t.id,{ck:ck2})}break;
    case 'new':go('trip','new');break;
    case 'clearm':S.month='';S.page=0;render();break;
    case 'pprev':S.page=Math.max(0,S.page-1);render();window.scrollTo(0,0);break;
    case 'pnext':S.page++;render();window.scrollTo(0,0);break;
    case 'dismiss':S.err='';render();break;
    case 'create':{
      var car=$('f-car').value.trim(),plate=$('f-plate').value.trim().toUpperCase(),from=$('f-from').value.trim();
      if(!car||!plate||!from){S.err='Isi model kereta, no. plat dan lokasi ambil.';render();break}
      var ref=S.db.collection('trips').doc();
      var up=$('f-upah')?(+$('f-upah').value||0):0;
      var rec={car:car,plate:plate,from:from,to:$('f-to').value.trim()||'Kota Bharu',date:$('f-date').value||today(),upah:up,kind:($('f-kind')?$('f-kind').value:'ambil'),st:0,exp:[],ck:[],times:{},created:Date.now()};
      S.err='';write(function(){return ref.set(rec)});
      if(S.owner&&$('f-own')&&$('f-own').checked){var nid=ref.id;write(function(){return S.db.doc('ownerpaid/'+nid).set({at:nowIso})})}
      go('trip','detail',ref.id);break}
    case 'next':if(t){var st=t.st||0,tm=Object.assign({},t.times||{});if(st==0)tm.ambil=nowIso;else tm.sampai=nowIso;patch(t.id,{st:st+1,times:tm})}break;
    case 'checkin':{if(!t)break;var p=$('c-place').value.trim();if(!p)break;var ck=(t.ck||[]).slice();ck.push({p:p,t:nowIso});patch(t.id,{ck:ck})}break;
    case 'addexp':{if(!t)break;var a=+$('x-amt').value;if(!(a>0)){S.err='Masukkan jumlah belanja.';render();break}var ex=(t.exp||[]).slice();ex.push({n:$('x-type').value,a:a});S.err='';patch(t.id,{exp:ex})}break;
    case 'delexp':if(t){var ex2=(t.exp||[]).slice();ex2.splice(+d.i,1);patch(t.id,{exp:ex2})}break;
    case 'saveupah':if(t&&S.admin&&!pendingUpah(t.id)&&!S.paid[t.id]&&!isOwn(t))patch(t.id,{upah:+$('u-amt').value||0});break;
    case 'pay':if(t&&S.admin&&!isOwn(t)&&!pendingUpah(t.id)){var id=t.id,amt=tot(t);write(function(){return S.db.doc('payments/'+id).set({amount:amt,at:nowIso})})}break;
    case 'unpay':if(t&&S.admin){var id2=t.id;write(function(){return S.db.doc('payments/'+id2).delete()})}break;
    case 'del':S.confirmDel=S.open;render();break;
    case 'delok':if(t&&S.admin){var id3=t.id,pids=S.photoList.map(function(p){return p.id});
      write(function(){return S.db.doc('trips/'+id3).delete().then(function(){return S.db.doc('payments/'+id3).delete()}).then(function(){return S.owner?S.db.doc('ownerpaid/'+id3).delete():null}).then(function(){return Promise.all(pids.map(function(p){return S.db.doc('photos/'+p).delete()}))})});
      go('trip','list')}break;
  }
});

reg.addEventListener('change',function(e){
  var el=e.target;
  if(el&&el.id==='o-own'&&S.owner&&S.open&&S.db){
    var oid=S.open,on=el.checked;
    el.blur();
    if(on&&pendingUpah(oid)){S.err='Selesaikan permohonan upah terlebih dahulu.';render();el.checked=false;return}
    if(on&&S.paid[oid]){S.err='Batalkan tolak dari baki dahulu sebelum tandakan dibayar oleh pemilik.';render();return}
    S.err='';
    write(function(){return on?S.db.doc('ownerpaid/'+oid).set({at:new Date().toISOString()}):S.db.doc('ownerpaid/'+oid).delete()});
    return;
  }
  if(el&&el.id==='f-kind'){
    var ff=$('f-from'),ft=$('f-to');
    if(ff&&ft){
      if(el.value==='hantar'&&!ff.value.trim()&&ft.value.trim()==='Kota Bharu'){ff.value='Kota Bharu';ft.value=''}
      else if(el.value==='ambil'&&ff.value.trim()==='Kota Bharu'&&!ft.value.trim()){ff.value='';ft.value='Kota Bharu'}
    }
    return;
  }
  if(el&&el.id==='receipt-file'&&S.open&&S.db){
    var file=el.files&&el.files[0],trip=byId(S.open),amount=Number($('receipt-amount')?.value||0),category=$('receipt-category')?.value||'Lain-lain',note=$('receipt-note')?.value.trim()||'';
    if(!file)return;
    if(!trip||S.paid[trip.id]||isOwn(trip)||!(amount>0)||Math.abs(amount*100-Math.round(amount*100))>0.000001){S.err='Masukkan jumlah resit sah untuk trip belum dibayar.';render();return}
    S.receiptBusy=true;S.err='';
    shrink(file).then(function(img){return S.client.from('runner_receipts').insert({trip_id:trip.id,category:category,amount:amount,note:note,image_data:img})}).then(function(res){if(res.error)throw res.error;return S.db.refresh()}).catch(function(e){S.err='Resit tidak dapat dimuat naik: '+(e.message||'Ralat')}).then(function(){S.receiptBusy=false;render()});return;
  }
  if(!el||el.id!=='p-file'||!S.db||!S.open)return;
  var files=Array.prototype.slice.call(el.files||[]),tid=S.open,label=$('p-label')?$('p-label').value:'Lain-lain';
  el.blur();
  if(!files.length)return;
  S.busy=true;S.err='';render();
  var chain=Promise.resolve();
  files.forEach(function(f){
    chain=chain.then(function(){return shrink(f)}).then(function(img){
      return S.db.collection('photos').doc().set({trip:tid,label:label,img:img,at:new Date().toISOString()});
    });
  });
  chain.catch(function(err){S.err='Gambar tidak dapat disimpan: '+((err&&err.message)||'cuba lagi')}).then(function(){S.busy=false;render()});
});


/* ---------- sambungan ke Supabase (jadual runner_*) ---------- */
var MAP={
  trips:{table:'runner_trips',key:'id',cols:{assigned_to:'assigned_to',car:'car',plate:'plate',from:'from_loc',to:'to_loc',date:'trip_date',upah:'upah',kind:'kind',st:'st',exp:'exp',ck:'ck',times:'times',created:'created_ms'}},
  payments:{table:'runner_payments',key:'trip_id',cols:{amount:'amount',at:'paid_at'}},
  topups:{table:'runner_topups',key:'id',cols:{amt:'amt',date:'topup_date',note:'note',at:'recorded_at'}},
  ownerpaid:{table:'runner_ownerpaid',key:'trip_id',cols:{at:'marked_at'}},
  settings:{table:'runner_settings',key:'key',cols:{name:'value'}},
  audits:{table:'runner_audit',key:'id',cols:{trip_id:'trip_id',actor_id:'actor_id',action:'action',before_data:'before_data',after_data:'after_data',occurred_at:'occurred_at'}},
  receipts:{table:'runner_receipts',key:'id',cols:{trip_id:'trip_id',category:'category',amount:'amount',note:'note',image_data:'image_data',created_by:'created_by',created_at:'created_at'}},
  requests:{table:'runner_upah_requests',key:'id',cols:{trip_id:'trip_id',direction:'direction',amount:'amount',base_upah:'base_upah',reason:'reason',status:'status',requested_by:'requested_by',created_at:'created_at',reviewed_by:'reviewed_by',reviewed_at:'reviewed_at',review_note:'review_note'}},
  photos:{table:'runner_photos',key:'id',cols:{trip:'trip_id',label:'label',img:'img',at:'taken_at'}}
};
function toRow(m,id,d,partial){
  var r={};if(!partial)r[m.key]=id;
  Object.keys(d).forEach(function(k){if(m.cols[k])r[m.cols[k]]=d[k]});
  return r;
}
function fromRow(m,r){
  var d={};Object.keys(m.cols).forEach(function(k){var v=r[m.cols[k]];if(v!==null&&v!==undefined)d[k]=v});
  return {id:r[m.key],data:d};
}
function makeDb(client){
  var COLLS=['trips','payments','topups','ownerpaid','settings','requests','audits','receipts'];
  var store={},last={},seen={},lis={},pw=[],pend=0,timer=null,wgen=0,nq=Promise.resolve();
  COLLS.forEach(function(c){store[c]={};lis[c]=[]});
  function check(res){if(res&&res.error){var e=new Error(res.error.message||'Ralat pangkalan data');e.code=res.error.code;throw e}return res.data}
  function snap(map){return {docs:Object.keys(map).map(function(id){var d=map[id];return {id:id,data:function(){return d}}}),metadata:{fromCache:false}}}
  function notify(c){var sn=snap(store[c]);lis[c].forEach(function(l){l.ok(sn)})}
  function notifyP(w){w.ok(snap(w.map||{}))}
  function failAll(e){COLLS.forEach(function(c){lis[c].forEach(function(l){l.fail(e)})});pw.forEach(function(w){w.fail(e)})}
  function pullPhotos(w){
    var g=wgen;
    return client.from('runner_photos').select('*').eq('trip_id',w.trip).then(function(res){
      var rows=check(res)||[];
      if(pend||g!==wgen||pw.indexOf(w)<0)return;
      var m={};rows.forEach(function(r){var x=fromRow(MAP.photos,r);m[x.id]=x.data});
      var js=JSON.stringify(m);if(js===w.last&&w.map)return;w.last=js;w.map=m;notifyP(w);
    });
  }
  function pull(){
    var g=wgen;
    return Promise.all(COLLS.map(function(c){return client.from(MAP[c].table).select('*').limit(1000).then(check)})).then(function(all){
      if(pend||g!==wgen)return;
      COLLS.forEach(function(c,i){
        var m={};(all[i]||[]).forEach(function(r){var x=fromRow(MAP[c],r);m[x.id]=x.data});
        var js=JSON.stringify(m);
        if(js!==last[c]||!seen[c]){last[c]=js;seen[c]=1;store[c]=m;notify(c)}
      });
    }).then(function(){return Promise.all(pw.slice().map(pullPhotos))});
  }
  function tick(){
    if(!app||!app.isConnected){stop();return}
    if(!document.hidden)pull().catch(failAll);
  }
  function start(){if(timer)return;pull().catch(failAll);timer=setInterval(tick,6000)}
  function stop(){if(timer){clearInterval(timer);timer=null}}
  function newId(){var s='';while(s.length<16)s+=Math.random().toString(36).slice(2);return s.slice(0,16)}
  function ref(c,id){
    var m=MAP[c],isP=c==='photos';
    function local(fn){
      wgen++;
      if(isP){pw.forEach(function(w){fn(w.map||(w.map={}),w)});pw.forEach(notifyP)}
      else{fn(store[c]);notify(c)}
    }
    function run(fn){pend++;var p=nq.then(fn);nq=p.catch(function(){});return p.then(function(r){pend--;return r},function(e){pend--;pull().catch(function(){});throw e})}
    function after(){if(!pend)pull().catch(function(){})}
    return {id:id,
      set:function(d){
        local(function(mm,w){if(!w||w.trip===d.trip)mm[id]=d});
        return run(function(){return client.from(m.table).upsert(toRow(m,id,d)).then(check)}).then(after);
      },
      update:function(d){
        local(function(mm){if(mm[id])mm[id]=Object.assign({},mm[id],d)});
        return run(function(){return client.from(m.table).update(toRow(m,id,d,true)).eq(m.key,id).then(check)}).then(after);
      },
      delete:function(){
        local(function(mm){delete mm[id]});
        return run(function(){return client.from(m.table).delete().eq(m.key,id).then(check)}).then(after);
      }};
  }
  return {
    start:start,stop:stop,refresh:pull,
    doc:function(path){var p=path.split('/');return ref(p[0],p[1])},
    collection:function(c){
      return {
        doc:function(id){return ref(c,id||newId())},
        onSnapshot:function(ok,fail){
          var l={ok:ok,fail:fail||function(){}};lis[c].push(l);
          if(seen[c])ok(snap(store[c]));
          return function(){lis[c]=lis[c].filter(function(x){return x!==l})};
        },
        where:function(f,op,v){
          return {onSnapshot:function(ok,fail){
            var w={trip:v,ok:ok,fail:fail||function(){},map:null,last:''};pw.push(w);
            pullPhotos(w).then(function(){if(w.map===null){w.map={};w.last='{}';notifyP(w)}}).catch(w.fail);
            return function(){pw=pw.filter(function(x){return x!==w})};
          }};
        }
      };
    }
  };
}

/* ---------- pasang dalam dashboard ---------- */
var started=null;
function subscribe(db){
  var timer=setTimeout(function(){S.slow=true;sched()},10000);
  function fail(e){S.err='Tidak dapat baca data ('+((e&&e.message)||'ralat')+').';sched()}
  db.collection('trips').onSnapshot(function(sn){
    S.trips=sn.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})});
    S.loaded=true;clearTimeout(timer);S.slow=false;sched();
  },fail);
  db.collection('payments').onSnapshot(function(sn){var p={};sn.docs.forEach(function(d){p[d.id]=d.data()});S.paid=p;sched()},fail);
  db.collection('topups').onSnapshot(function(sn){S.topups=sn.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})});sched()},fail);
  db.collection('ownerpaid').onSnapshot(function(sn){var o={};sn.docs.forEach(function(d){o[d.id]=d.data()});S.ownp=o;sched()},fail);
  db.collection('audits').onSnapshot(function(sn){S.audits=sn.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})});sched()},fail);
  db.collection('receipts').onSnapshot(function(sn){S.receipts=sn.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})});sched()},fail);
  db.collection('requests').onSnapshot(function(sn){S.requests=sn.docs.map(d=>Object.assign({},d.data(),{id:d.id}));sched()},fail);
  db.collection('settings').onSnapshot(function(sn){var n='';sn.docs.forEach(function(d){if(d.id==='runner')n=(d.data().name)||''});S.rname=n;sched()},fail);
}

/* host = elemen kosong dalam #ada-cloud-view. ctx = {client, profile} */
return function mountRunner(host,ctx){
  var role=ctx&&ctx.profile&&ctx.profile.role;
  S.client=ctx.client;ctx.client.rpc('runner_staff_choices').then(function(res){if(!res.error){S.staff=res.data||[];sched()}});
  S.owner=role==='owner';S.admin=role==='owner';S.canEditTrip=role==='owner'||role==='operations';
  var root=host.shadowRoot||host.attachShadow({mode:'open'});
  root.innerHTML='<style>'+CSS+'</style><div class="shell"><div class="wrap" id="app"></div></div>';
  app=root.getElementById('app');
  ['click','change','focusout'].forEach(function(t){if(H[t])app.addEventListener(t,H[t])});
  if(!started||started.client!==ctx.client){
    if(started)started.db.stop();
    var db=makeDb(ctx.client);started={client:ctx.client,db:db};
    S.db=db;S.loaded=false;subscribe(db);
  }
  render();
  started.db.start();
};

})();
