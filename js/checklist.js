// Abe Din Auto – modul Sistem Pemeriksaan kereta (V54). Berasingan daripada menu Checklist lama.
// Dimuat oleh app.html melalui import("./js/checklist.js"). Jadual: checklist_inspections (lihat V54_CHECKLIST_MIGRATION.sql).
// UI diasingkan dalam Shadow DOM supaya tidak bercampur dengan CSS sistem sedia ada.
const SECTIONS = [
  {k:"s1",t:"Enjin",c:"--s1",items:["Oil leak / kebocoran minyak","Coolant leak","Bunyi enjin abnormal","Enjin bergegar / idle tidak stabil","Asap putih / biru / hitam","Suhu enjin normal","Radiator & radiator fan berfungsi","Hose radiator","Engine mounting","Drive belt / timing belt","Keadaan minyak enjin","Paras coolant","Tanda overheating","Scan ECU / fault code"]},
  {k:"s2",t:"Transmission / Gearbox",c:"--s2",items:["Gear masuk D/R dengan lancar","Tiada delay ketika masuk gear","Tiada hentakan gear","Tiada slip","Bunyi gearbox abnormal","Kebocoran minyak gearbox","Keadaan minyak transmission","CVT berfungsi normal (jika CVT)"]},
  {k:"s3",t:"Sistem Brek",c:"--s3",items:["Brake pad depan","Brake pad belakang","Brake disc / drum","Brake fluid","Handbrake","ABS berfungsi","Tiada bunyi brek","Kereta tidak menarik ke kiri/kanan ketika brek"]},
  {k:"s4",t:"Suspension & Steering",c:"--s4",items:["Absorber depan","Absorber belakang","Lower arm","Bush","Ball joint","Tie rod","Rack steering","Power steering","Wheel bearing","Tiada bunyi ketika jalan tidak rata","Steering tidak bergegar","Alignment normal"]},
  {k:"s5",t:"Tayar & Roda",c:"--s5",items:["Tayar depan kiri","Tayar depan kanan","Tayar belakang kiri","Tayar belakang kanan","Bunga tayar","Tahun tayar","Tayar tidak botak/retak","Sport rim / rim tidak bengkok","Spare tyre","Jack & tools"]},
  {k:"s6",t:"Body & Accident Check",c:"--s6",items:["Bonnet","Fender kiri/kanan","Pintu kiri/kanan","Roof","Quarter panel","Boot","Bumper depan","Bumper belakang","Chassis","Inner fender","Apron","Pillar A/B/C","Kesan potong / welding","Kesan banjir","Cat tidak sekata","Overspray","Panel gap","Cermin original / pernah tukar"]},
  {k:"s7",t:"Elektrikal & Aircond",c:"--s7",items:["Aircond sejuk","Blower semua speed","Compressor","Power window","Central locking","Remote / keyless","Lampu depan","Lampu belakang","Signal","Fog lamp","Brake light","Reverse light","Wiper","Washer","Horn","Meter / dashboard","Battery","Alternator","Semua warning light"]},
  {k:"s8",t:"Interior & Dokumen",c:"--s8",items:["Seat","Dashboard","Roof lining","Door trim","Carpet","Seat belt","Airbag","Radio / Android player","Reverse camera","Parking sensor","Power seat (jika ada)","Semua kunci","Manual book","Service record","Mileage","Nombor chassis","Nombor engine","Geran / eVOC","Status pinjaman","Rekod accident / banjir"]}
];
const TOTAL_ITEMS = SECTIONS.reduce((a,s)=>a+s.items.length,0);
const AKHIR = [
  {k:"enjin",t:"Enjin",o:["Excellent","Good","Repair"]},
  {k:"gearbox",t:"Gearbox",o:["Excellent","Good","Repair"]},
  {k:"body",t:"Body/Chassis",o:["Original","Accident","Major"]},
  {k:"banjir",t:"Flood (Banjir)",o:["No","Suspected","Confirmed"]}
];
const GRADES = {A:"Terus boleh jual",B:"Minor repair / detailing",C:"Perlu repair sebelum jual",D:"Masalah besar / perlu disclose kepada customer"};
const STATUS = {draf:["Draf","p-draf"],hantar:["Menunggu semakan","p-hantar"],lulus:["Disahkan","p-lulus"],ulang:["Perlu dibetulkan","p-ng"]};

const CSS=`
.trail{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.trail>li{display:flex;gap:12px;position:relative;padding:0 0 14px 0}
.trail>li:not(:last-child)::before{content:"";position:absolute;left:6px;top:16px;bottom:0;width:2px;background:var(--line)}
.trail>li>i{flex:0 0 14px;height:14px;border-radius:50%;margin-top:3px;background:#8a8577;box-shadow:0 0 0 3px var(--card)}
.trail>li.t-hantar>i{background:#f5c400}.trail>li.t-lulus>i{background:#3fbf73}.trail>li.t-ng>i{background:#e5534b}.trail>li.t-edit>i{background:#6ea8fe}
.trail>li>div{min-width:0;flex:1}.trail .th{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}
.trail ul{margin:6px 0 0;padding-left:18px;font-size:13.5px;color:var(--mute)}.trail ul li{margin:2px 0}
.tplate{font:inherit;font-weight:700;font-size:12.5px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);background:transparent;color:inherit;cursor:pointer}
.tplate:disabled{opacity:.6;cursor:default;text-decoration:line-through}
.jbar{display:grid;grid-template-columns:1fr auto;gap:8px}
:host{display:block;--bg:#0a0a09;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;
  --pri:#e8b10b;--pri-fg:#141000;--ok:#3fae6b;--ok-bg:#12321f;--ng:#e0473f;--ng-bg:#3a1513;--na:#77736a;
  --gA:#1f8a4c;--gB:#f0b400;--gC:#ef7d00;--gD:#d12b2b;--f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{background:var(--bg);color:var(--fg);font:15px/1.45 var(--f);padding:14px 0 40px;border-radius:18px}
.wrap{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:12px;padding:0 4px}
h2{margin:0;font-size:22px;letter-spacing:-.01em;font-weight:800}
h3{margin:0 0 6px;font-size:16px;font-weight:700}
p{margin:0}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
.kick{font-size:11px;letter-spacing:.14em;color:var(--pri);font-weight:700}
.mute{color:var(--mute);font-size:13.5px}
.grow{flex:1}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.row.end{justify-content:flex-end}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
.tabs{display:flex;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px;gap:2px}
.tabs button{flex:1;border:0;background:none;color:var(--mute);font-weight:600;padding:9px;border-radius:999px}
.tabs button.on{background:var(--pri);color:var(--pri-fg)}
.tabs .refresh{flex:0 0 42px;font-size:17px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.notice{padding:10px 13px;border-radius:12px;background:#2b2410;border:1px solid #5a4a14;font-size:14px}
.notice.err{background:var(--ng-bg);border-color:#6b2420}
.empty{text-align:center;padding:36px 12px;color:var(--mute)}
.field{width:100%;min-width:0;border:1px solid var(--line);background:var(--soft);border-radius:11px;padding:10px 12px;font-size:16px;color:var(--fg)}
.field:focus{outline:2px solid var(--pri);outline-offset:0}
input[type=date].field{-webkit-appearance:none;appearance:none;min-height:44px}
label{display:block;font-size:11.5px;color:var(--mute);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.btn{border:0;border-radius:12px;padding:11px 14px;font-weight:700;background:var(--pri);color:var(--pri-fg);flex:1}
.btn.alt{background:var(--soft);color:var(--fg);border:1px solid var(--line)}
.btn.narrow{flex:0 0 46px}
.sm{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:8px 12px;font-size:14px;font-weight:600}
.sm.go{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}
.sm.bad{background:var(--ng);border-color:var(--ng);color:#fff}
.sm.okb{background:var(--ok);border-color:var(--ok);color:#04140a}
.sm:disabled,.btn:disabled{opacity:.5}
.back,.lnk{border:0;background:none;color:var(--pri);font-weight:700;padding:0;text-align:left;align-self:flex-start}
.lnk.bad{color:var(--ng)}
.plate{display:inline-block;background:var(--pri);color:var(--pri-fg);font-weight:800;letter-spacing:.04em;padding:1px 7px;border-radius:6px;font-size:.8em;vertical-align:middle}
em{font-style:normal}.ng{color:var(--ng)}.ok{color:var(--ok)}
.pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.p-draf{background:#2c2a25;color:#cfc8b6}.p-hantar{background:#4a3a06;color:#ffd257}.p-lulus{background:var(--ok-bg);color:#8ce3ad}.p-ng{background:var(--ng-bg);color:#ffaaa4}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.kpi{text-align:left;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.kpi .l{font-size:11.5px;color:var(--mute);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.kpi b{font-size:32px;font-weight:800;letter-spacing:-.02em;line-height:1.1}.kpi b.sm2{font-size:24px}
.kpi small{color:var(--mute);font-size:12.5px}
.kpi.alert b{color:var(--pri)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:820px){.grid2{grid-template-columns:1fr}}
.grades{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.gbox{border:0;border-radius:12px;padding:10px 6px;color:#fff;display:flex;flex-direction:column;align-items:center;gap:2px}
.gbox b{font-size:28px;line-height:1}.gbox small{font-size:11.5px;text-align:center}
.gA{background:var(--gA)}.gB{background:var(--gB);color:#141000}.gC{background:var(--gC)}.gD{background:var(--gD)}
.bar{display:flex;align-items:center;gap:8px;font-size:14px;margin:4px 0}
.bar .nm{flex:0 0 46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar .tr{flex:1;height:9px;background:var(--soft);border-radius:6px;overflow:hidden}.bar .tr i{display:block;height:100%;background:var(--ng);border-radius:6px}
.bar .n{width:26px;text-align:right;font-weight:700}
.rec{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:6px}
.rec .rb{flex:1;min-width:0;display:flex;flex-direction:column}.rec small{color:var(--mute);font-size:12.5px}
.gchip{width:40px;height:40px;flex:0 0 40px;border-radius:10px;display:grid;place-items:center;font-weight:800;font-size:22px;background:#3a372f;color:#fff}
.gchip.sm{width:28px;height:28px;flex-basis:28px;font-size:16px;border-radius:7px}
.gchip.big{width:60px;height:60px;flex-basis:60px;font-size:36px;border-radius:14px}
.gchip.gA{background:var(--gA)}.gchip.gB{background:var(--gB);color:#141000}.gchip.gC{background:var(--gC)}.gchip.gD{background:var(--gD)}
.filters{display:flex;gap:8px;flex-wrap:wrap}.filters .field{flex:1;min-width:150px}
.chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}
.chips button{flex:0 0 auto;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}
.chips button.on{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}.chips b{margin-left:5px;opacity:.7}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.car{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.ctop{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#100f0d;border-bottom:1px solid var(--line)}
.stat{border:1.5px solid #3fae6b;color:#8ce3ad;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700;text-transform:capitalize}
.ib{font-size:12px;font-weight:700;border-radius:999px;padding:3px 10px;background:#2c2a25;color:#cfc8b6}
.ib.hantar{background:#4a3a06;color:#ffd257}.ib.lulus{background:var(--ok-bg);color:#8ce3ad}.ib.ulang{background:var(--ng-bg);color:#ffaaa4}
.cb{padding:12px 14px;flex:1;display:flex;flex-direction:column;gap:6px}
.cb h4{margin:0;font-size:17px;text-transform:uppercase;letter-spacing:.01em}
.yp{color:var(--mute);font-size:13.5px}
.ins{display:flex;gap:8px;align-items:center;font-size:13px}
.idr{border-top:1px solid var(--line);padding-top:7px;font-size:12.5px;color:var(--mute)}.idr b{color:var(--fg)}
.cf{display:flex;gap:8px;padding:0 14px 14px}
.dhead{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.dhead .grow{min-width:180px}.dhead h2{font-size:19px;line-height:1.25}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.kv div{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:14px}
.kv span{display:block;font-size:11px;color:var(--mute);text-transform:uppercase;letter-spacing:.05em}
.pre{white-space:pre-wrap}
.secsum{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}
.secsum i{width:10px;height:10px;border-radius:50%}
.nglist{margin:4px 0 6px 18px;padding:0;font-size:14px}.nglist li{margin:3px 0}
.ptab{width:100%;border-collapse:collapse;font-size:14px}
.ptab th{text-align:left;font-size:11px;color:var(--mute);text-transform:uppercase;padding:6px;border-bottom:1px solid var(--line)}
.ptab td{padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}
.ptab .num{text-align:right;white-space:nowrap}.ptab .pn{font-weight:600}
.ptab tr.siap td{color:var(--mute)}.ptab tr.siap .pn{text-decoration:line-through}
.ptab .mx{display:none;font-size:12px;color:var(--mute)}
@media(max-width:560px){.ptab .hx{display:none}.ptab .mx{display:block}}
.ptab input[type=checkbox]{width:20px;height:20px;accent-color:var(--ok)}
.gtot{display:flex;justify-content:space-between;align-items:center;background:#100f0d;border:1px solid #5a4a14;border-radius:12px;padding:11px 14px}
.gtot b{font-size:22px;color:var(--pri)}
/* form */
.info{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media(max-width:720px){.info{grid-template-columns:1fr 1fr}.fld.full{grid-column:1/-1}}
.fld{min-width:0}
.jump{position:sticky;top:0;z-index:5;display:flex;gap:6px;overflow-x:auto;padding:8px 2px;background:rgba(10,10,9,.95);backdrop-filter:blur(6px);scrollbar-width:none}
.jump::-webkit-scrollbar{display:none}
.jump button{flex:0 0 auto;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:4px 10px 4px 4px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px}
.jump i{font-style:normal;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:11px}
.jump small{color:var(--mute)}
.jump button.done{border-color:var(--ok);background:var(--ok-bg)}.jump button.hasng{border-color:var(--ng);background:var(--ng-bg)}
.sec{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;scroll-margin-top:56px}
.sech{display:flex;align-items:center;gap:10px;padding:10px 13px;color:#fff;cursor:pointer;user-select:none}
.sech .no{width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.35);display:grid;place-items:center;font-weight:800}
.sech .tt{flex:1;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
.sech .pg{font-size:12.5px;font-weight:700;background:rgba(0,0,0,.3);padding:3px 9px;border-radius:999px;white-space:nowrap}
.sech .chev{transition:transform .2s}.sec.closed .chev{transform:rotate(-90deg)}.sec.closed .secb{display:none}
.secb{padding:6px 13px 12px;display:flex;flex-direction:column}
.tools{display:flex;justify-content:flex-end;padding:4px 0}
.it{padding:9px 0;border-bottom:1px solid var(--line)}.it:last-child{border-bottom:0}
.it .top{display:flex;gap:10px;align-items:center}.it .lbl{flex:1;min-width:0;font-size:14.5px;line-height:1.3}
.seg{display:flex;border:1px solid var(--line);border-radius:9px;overflow:hidden;flex:0 0 auto}
.seg button{border:0;background:var(--soft);padding:8px 10px;font-weight:700;font-size:13px;color:var(--mute);min-width:42px}
.seg button+button{border-left:1px solid var(--line)}
.seg .ok.on{background:var(--ok);color:#04140a}.seg .ng.on{background:var(--ng);color:#fff}.seg .na.on{background:var(--na);color:#fff}
.cam{flex:0 0 auto;border:1px solid var(--line);background:var(--soft);border-radius:9px;padding:7px 9px;font-size:15px;line-height:1;cursor:pointer;position:relative;display:inline-flex;align-items:center;gap:3px}
.cam small{font-size:11px;font-weight:800;color:var(--pri)}.cam.has{border-color:#5a4a14}
.cam input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.phs{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.phs:empty{display:none}
.ph{position:relative;width:64px;height:64px;border-radius:9px;overflow:hidden;background:#222;border:1px solid var(--line);flex:0 0 64px;padding:0}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph .x{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:0;background:rgba(0,0,0,.75);color:#fff;font-size:12px;line-height:20px;padding:0;cursor:pointer}
.ph.up{display:grid;place-items:center;font-size:11px;color:var(--mute)}
.evid{display:flex;flex-direction:column;gap:10px}.evid .ei b{font-size:14px}.evid .phs .ph{width:84px;height:84px;flex-basis:84px;cursor:zoom-in}
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;gap:10px}
.lightbox img{max-width:100%;max-height:82vh;border-radius:10px}.lightbox p{color:#ddd;font:600 14px var(--f);margin:0;text-align:center}
.it .note{margin-top:7px;padding:8px 10px}.it.isng .note{border-color:#6b2420;background:#1d100f}
.sugg{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}
.sugg button{border:1px dashed #8a3a35;background:transparent;color:#ffaaa4;border-radius:999px;padding:5px 10px;font-size:13px;font-weight:600}
.parts{display:grid;gap:10px;margin-bottom:10px}
.part{border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--soft)}
.part .pr1{display:grid;grid-template-columns:1fr 160px 40px;gap:8px;align-items:end}
.part .pr2{display:grid;grid-template-columns:70px 1fr 1fr 1fr;gap:8px;align-items:end;margin-top:8px}
@media(max-width:560px){.part .pr1{grid-template-columns:1fr 40px}.part .pr1 .bhg{grid-column:1/-1;grid-row:2}.part .pr2{grid-template-columns:64px 1fr 1fr}.part .pr2 .tot{grid-column:1/-1}}
.part .field{background:var(--card)}
.part .del{width:40px;height:44px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ng);font-weight:800}
.part .tot{text-align:right;font-weight:700;padding-bottom:10px}
.secb .btn.alt{margin-bottom:10px}
.akhir{display:grid;gap:10px}
.ak{display:grid;grid-template-columns:130px 1fr;gap:10px;align-items:center}
@media(max-width:560px){.ak{grid-template-columns:1fr}}
.ak .k{font-weight:700}
.opts{display:flex;gap:6px;flex-wrap:wrap}
.opts button{border:1px solid var(--line);background:var(--soft);border-radius:9px;padding:8px 12px;font-weight:600}
.opts button.on{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}
.gsel{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.gsel button{border:2px solid transparent;border-radius:10px;padding:9px 5px;color:#fff;opacity:.35;display:flex;flex-direction:column;align-items:center;gap:2px}
.gsel b{font-size:24px;line-height:1}.gsel small{font-size:11px;text-align:center}
.gsel button.on{opacity:1;border-color:#fff}.gsel .gB{color:#141000}
.savebar{position:sticky;bottom:0;z-index:6;display:flex;gap:8px;align-items:center;background:rgba(21,20,18,.97);border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-top:6px}
@media(max-width:700px){.savebar{bottom:calc(70px + env(safe-area-inset-bottom,0px))}}
.savebar .prog{flex:1;font-size:13px;color:var(--mute);min-width:0}
.savebar .tr{height:6px;background:var(--soft);border-radius:4px;overflow:hidden;margin-top:4px;max-width:260px}
.savebar .tr i{display:block;height:100%;background:var(--pri)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
.toast{font:700 14px/1.4 var(--f);position:fixed;left:50%;bottom:110px;transform:translateX(-50%);background:var(--pri);color:var(--pri-fg);padding:10px 16px;border-radius:12px;font-weight:700;z-index:50;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw;text-align:center}
.toast.show{opacity:1}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:40;padding:16px}
.modal .box{background:var(--card);border:1px solid var(--line);color:var(--fg);border-radius:16px;padding:18px;max-width:440px;width:100%;display:flex;flex-direction:column;gap:10px;font:15px/1.45 var(--f)}
`;
/* ---------- PDF ---------- */
let _pdfLib=null;
function loadPdf(){
  if(window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(!_pdfLib) _pdfLib=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";s.onload=()=>window.jspdf?.jsPDF?res(window.jspdf.jsPDF):rej(new Error("lib"));s.onerror=()=>{_pdfLib=null;rej(new Error("load"));};document.head.appendChild(s);});
  return _pdfLib;
}
const A = s => String(s??"").replace(/[–—]/g,"-").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[•·]/g,"|").replace(/[^\x00-\xFF]/g,"");
const hex = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const SECHEX={s1:"#d12b2b",s2:"#1d55b8",s3:"#1f8a4c",s4:"#ef7d00",s5:"#6d32b3",s6:"#0e7d6e",s7:"#c2185b",s8:"#a86a12"};
const GHEX={A:"#1f8a4c",B:"#f0b400",C:"#ef7d00",D:"#d12b2b"};
const PW=210, PH=297, PM=12;
function pFill(d,h){d.setFillColor(...hex(h));}
function pText(d,h){d.setTextColor(...hex(h));}
function pFont(d,size,style){d.setFont("helvetica",style||"normal");d.setFontSize(size);}
function pHeader(d,title,sub){
  pFill(d,"#141414"); d.rect(0,0,PW,26,"F"); pFill(d,"#f5c400"); d.rect(0,26,PW,1.2,"F");
  pFont(d,20,"bolditalic"); pText(d,"#f5c400"); d.text("ABE DIN AUTO",PM,13);
  pFont(d,6.5,"bold"); pText(d,"#cfcfcf"); d.text("TRUSTED CARS FOR A BETTER JOURNEY",PM,19);
  pFont(d,13,"bold"); pText(d,"#ffffff"); d.text(A(title),PW-PM,12,{align:"right"});
  pFont(d,8,"normal"); pText(d,"#f5c400"); d.text(A(sub),PW-PM,18.5,{align:"right"});
}
function pFooter(d){
  const n=d.getNumberOfPages(); const gen="Dijana "+new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  for(let i=1;i<=n;i++){ d.setPage(i); d.setDrawColor(228,225,218); d.setLineWidth(.3); d.line(PM,PH-10,PW-PM,PH-10);
    pFont(d,7,"normal"); pText(d,"#6b6b6b"); d.text("Abe Din Auto  |  Kualiti  |  Jujur  |  Amanah",PM,PH-6); d.text(gen,PW/2,PH-6,{align:"center"}); d.text("Muka "+i+" / "+n,PW-PM,PH-6,{align:"right"}); }
}
function pMini(d,y){ pFill(d,"#141414"); d.rect(0,0,PW,9,"F"); pFill(d,"#f5c400"); d.rect(0,9,PW,.8,"F"); pFont(d,9,"bolditalic"); pText(d,"#f5c400"); d.text("ABE DIN AUTO",PM,6); return 16; }
function pLabel(d,x,y,k,v,w){ pFont(d,6.3,"bold"); pText(d,"#7a7a7a"); d.text(A(k).toUpperCase(),x,y); pFont(d,9.5,"normal"); pText(d,"#141414"); d.text(d.splitTextToSize(A(v||"-"),w||58)[0],x,y+4.3); }
async function savePdf(d,name){ try{ d.save(name); toast("PDF dimuat turun ✓"); }catch(e){ toast("Gagal muat turun PDF"); } }
async function withBusy(btn,fn){ const t=btn.textContent; btn.disabled=true; btn.textContent="Menjana PDF…"; try{ await fn(); }catch(e){ toast(e?.message==="load"||e?.message==="lib"?"Gagal memuatkan penjana PDF. Semak internet.":"Gagal menjana PDF"); } btn.disabled=false; btn.textContent=t; }

async function pdfPhotos(d,r){
  const ev=[]; SECTIONS.forEach(sec=>sec.items.forEach((nm,i)=>{ const v=r.items?.[sec.k+"_"+i]; photosOf(v).forEach(p=>ev.push({p,cap:sec.t+" - "+nm+(v.s?" ("+(v.s==="na"?"N/A":v.s.toUpperCase())+")":""),ng:v.s==="ng"})); }));
  if(!ev.length) return;
  await signPaths(ev.map(e=>e.p));
  const load=async url=>{ const b=await (await fetch(url)).blob(); const du=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});
    const dim=await new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth,im.naturalHeight]);im.onerror=()=>res([4,3]);im.src=du;}); return {du,w:dim[0],h:dim[1]}; };
  d.addPage(); let y=pMini(d);
  pFont(d,11,"bold"); pText(d,"#141414"); d.text("Gambar bukti ("+ev.length+")",PM,y+4); y+=9;
  const cols=3, gap=4, cw=(PW-2*PM-gap*(cols-1))/cols, ih=cw*0.75, rh=ih+11; let c=0;
  for(const e of ev){
    if(c===0&&y+rh>PH-14){ d.addPage(); y=pMini(d); }
    const x=PM+c*(cw+gap);
    d.setDrawColor(228,225,218); d.setLineWidth(.3); pFill(d,"#f4f2ee"); d.rect(x,y,cw,ih,"FD");
    try{ const im=await load(URLS[e.p]); const sc=Math.min(cw/im.w,ih/im.h), w=im.w*sc, h=im.h*sc; d.addImage(im.du,"JPEG",x+(cw-w)/2,y+(ih-h)/2,w,h); }
    catch(err){ pFont(d,7,"italic"); pText(d,"#999999"); d.text("Gambar tidak dapat dimuatkan",x+cw/2,y+ih/2,{align:"center"}); }
    pFont(d,7,e.ng?"bold":"normal"); pText(d,e.ng?"#a01f1f":"#333333"); d.splitTextToSize(A(e.cap),cw).slice(0,2).forEach((l,j)=>d.text(l,x,y+ih+3.6+j*3.2));
    c++; if(c===cols){ c=0; y+=rh; }
  }
}
async function pdfInspection(r){
  const J=await loadPdf(); const d=new J({unit:"mm",format:"a4"});
  pHeader(d,"LAPORAN PEMERIKSAAN KERETA","Checklist sebelum dijual  |  "+(STATUS[r.status]||STATUS.draf)[0]);
  let y=32;
  d.setDrawColor(228,225,218); d.setLineWidth(.3); pFill(d,"#faf9f6"); d.roundedRect(PM,y,PW-2*PM,21,2,2,"FD");
  [["Jenis kereta",r.jenis],["Tahun",r.tahun],["No. plat",r.plat],["Mileage",r.mileage?r.mileage+" km":"-"],["Tarikh pemeriksaan",fmtD(r.tarikh)],["Pemeriksa",who(r)]]
    .forEach((kv,i)=>pLabel(d,PM+4+(i%3)*62,y+5.5+Math.floor(i/3)*9,kv[0],kv[1]));
  y+=26;
  // grade
  const g=r.grade; pFill(d,GHEX[g]||"#c9c6c0"); d.roundedRect(PM,y,30,30,2,2,"F");
  pText(d,g==="B"?"#141414":"#ffffff"); pFont(d,34,"bold"); d.text(g||"-",PM+15,y+19,{align:"center"}); pFont(d,6.5,"bold"); d.text("OVERALL GRADE",PM+15,y+26,{align:"center"});
  const x0=PM+35, rw=PW-PM-x0;
  pFont(d,11.5,"bold"); pText(d,"#141414"); d.text(A(g?GRADES[g]:"Gred belum ditetapkan"),x0,y+5);
  const bw=(rw-6)/4;
  AKHIR.forEach((a,i)=>{ const bx=x0+i*(bw+2), v=r.akhir?.[a.k]||"-"; const bad=["Repair","Accident","Major","Suspected","Confirmed"].includes(v);
    d.setDrawColor(228,225,218); pFill(d,bad?"#fbe7e7":"#ffffff"); d.roundedRect(bx,y+8,bw,13,1.5,1.5,"FD");
    pFont(d,6.3,"bold"); pText(d,"#7a7a7a"); d.text(A(a.t).toUpperCase(),bx+2.5,y+12.5);
    pFont(d,10,"bold"); pText(d,bad?"#d12b2b":"#141414"); d.text(A(v),bx+2.5,y+18); });
  const c=counts(r);
  pFont(d,9,"normal"); pText(d,"#141414");
  let cx=x0; const seg=(t,col)=>{pText(d,col);pFont(d,9,"bold");d.text(t,cx,y+28);cx+=d.getTextWidth(t)+5;};
  seg("OK: "+c.ok,"#1f8a4c"); seg("NG: "+c.ng,"#d12b2b"); seg("N/A: "+c.na,"#6b6b6b"); seg("Belum ditanda: "+(TOTAL_ITEMS-c.done),"#6b6b6b"); seg("Kos: "+A(RM(partsTotal(r))),"#141414");
  y+=36;
  // sections in two columns
  const colW=(PW-2*PM-6)/2, rowH=4.7;
  const noteLines=(v)=>v?.n? d.splitTextToSize(A(v.n),colW-6):[];
  const secH=s=>{ pFont(d,6.8,"italic"); let h=8; s.items.forEach((_,i)=>{ h+=rowH+noteLines(r.items?.[s.k+"_"+i]).length*3.1; }); return h+1; };
  const drawSec=(s,si,x,y0)=>{
    const sc=secCounts(r,s); pFill(d,SECHEX[s.k]); d.roundedRect(x,y0,colW,7,1.5,1.5,"F");
    pFont(d,8.5,"bold"); pText(d,"#ffffff"); d.text((si+1)+". "+A(s.t).toUpperCase(),x+2.5,y0+4.8);
    pFont(d,7,"bold"); d.text(sc.done+"/"+sc.total+(sc.ng?"  |  "+sc.ng+" NG":""),x+colW-2.5,y0+4.8,{align:"right"});
    let yy=y0+8;
    s.items.forEach((nm,i)=>{ const v=r.items?.[s.k+"_"+i]||{}; const nl=noteLines(v); const h=rowH+nl.length*3.1;
      if(v.s==="ng"){ pFill(d,"#fdf0f0"); d.rect(x,yy,colW,h,"F"); } else if(i%2){ pFill(d,"#f7f6f3"); d.rect(x,yy,colW,h,"F"); }
      pFont(d,7.5,"normal"); pText(d,"#222222"); d.text(d.splitTextToSize(A(nm),colW-20)[0],x+2,yy+3.3);
      const lab=v.s==="ok"?"OK":v.s==="ng"?"NG":v.s==="na"?"N/A":"-"; const col=v.s==="ok"?"#1f8a4c":v.s==="ng"?"#d12b2b":v.s==="na"?"#8a8a8a":null;
      if(col){ pFill(d,col); d.roundedRect(x+colW-13,yy+.7,11,3.3,1,1,"F"); pFont(d,6.5,"bold"); pText(d,"#ffffff"); d.text(lab,x+colW-7.5,yy+3.05,{align:"center"}); }
      else { pFont(d,7,"normal"); pText(d,"#b0b0b0"); d.text("-",x+colW-7.5,yy+3.2,{align:"center"}); }
      if(nl.length){ pFont(d,6.8,"italic"); pText(d,v.s==="ng"?"#a01f1f":"#6b6b6b"); nl.forEach((ln,j)=>d.text(ln,x+4,yy+rowH+j*3.1+1.3)); }
      yy+=h; });
  };
  for(let p=0;p<4;p++){
    const a=SECTIONS[2*p], b=SECTIONS[2*p+1]; const h=Math.max(secH(a),secH(b));
    if(y+h>PH-14){ d.addPage(); y=pMini(d); }
    drawSec(a,2*p,PM,y); drawSec(b,2*p+1,PM+colW+6,y); y+=h+4;
  }
  // parts table
  if((r.parts||[]).length){
    const pc=[["Barang / kerja",62],["Bahagian",36],["Qty",12],["Harga seunit",24],["Upah",22],["Jumlah",30]];
    const pth=()=>{ pFill(d,"#141414"); d.rect(PM,y,PW-2*PM,6,"F"); pFont(d,7,"bold"); pText(d,"#ffffff"); let x=PM; pc.forEach(([t,w],j)=>{ j>=2? d.text(t.toUpperCase(),x+w-2,y+4,{align:"right"}) : d.text(t.toUpperCase(),x+2,y+4); x+=w; }); y+=6; };
    if(y+30>PH-14){ d.addPage(); y=pMini(d); }
    pFont(d,10,"bold"); pText(d,"#141414"); d.text("Barang perlu tukar & anggaran kos",PM,y+4); y+=7; pth();
    r.parts.forEach((p,i)=>{ if(y+6>PH-22){ d.addPage(); y=pMini(d); pth(); }
      if(i%2){ pFill(d,"#f7f6f3"); d.rect(PM,y,PW-2*PM,5.8,"F"); }
      const vals=[(p.siap?"[Siap] ":"")+(p.nama||"-"),bhgName(p.bhg),String(p.qty),RM(p.harga),RM(p.upah),RM(partTotal(p))];
      let x=PM; vals.forEach((v,j)=>{ const w=pc[j][1]; pFont(d,7.8,j===5?"bold":"normal"); pText(d,p.siap&&j===0?"#1f8a4c":"#222222");
        const tx=d.splitTextToSize(A(v),w-3)[0]||""; j>=2? d.text(tx,x+w-2,y+4,{align:"right"}) : d.text(tx,x+2,y+4); x+=w; });
      y+=5.8; });
    pFill(d,"#141414"); d.rect(PM,y+1,PW-2*PM,8,"F"); pFont(d,9,"bold"); pText(d,"#ffffff"); d.text("JUMLAH ANGGARAN KOS",PM+3,y+6.4);
    pText(d,"#f5c400"); pFont(d,11,"bold"); d.text(A(RM(partsTotal(r))),PW-PM-2,y+6.6,{align:"right"}); y+=14;
  }
  // summary of issues + notes + sign
  const ngs=[]; SECTIONS.forEach(s=>s.items.forEach((nm,i)=>{const v=r.items?.[s.k+"_"+i]; if(v?.s==="ng") ngs.push(s.t+" - "+nm+(v.n?": "+v.n:""));}));
  pFont(d,8.5,"normal");
  const ngLines=ngs.length? ngs.flatMap(t=>d.splitTextToSize("- "+A(t),PW-2*PM-6)) : ["Tiada item NG."];
  const catLines=d.splitTextToSize(A(r.catatan||"-"),PW-2*PM-6);
  const revLines=r.reviewNote? d.splitTextToSize(A(r.reviewNote),PW-2*PM-6):[];
  const need=14+ngLines.length*4+12+catLines.length*4+(revLines.length?12+revLines.length*4:0)+30;
  if(y+Math.min(need,120)>PH-14){ d.addPage(); y=pMini(d); }
  const block=(title,lines,col)=>{ if(y+12>PH-14){d.addPage();y=pMini(d);} pFont(d,10,"bold"); pText(d,"#141414"); d.text(title,PM,y+4); y+=7;
    pFont(d,8.5,"normal"); pText(d,col||"#222222"); lines.forEach(l=>{ if(y+5>PH-14){d.addPage();y=pMini(d);} d.text(l,PM+2,y+3); y+=4; }); y+=4; };
  block("Ringkasan isu dikesan ("+ngs.length+" NG)",ngLines,ngs.length?"#a01f1f":"#1f8a4c");
  block("Catatan umum",catLines);
  if(revLines.length) block("Semakan pengurus"+(r.status==="lulus"?" (disahkan)":""),revLines);
  if(y+26>PH-14){ d.addPage(); y=pMini(d); }
  y+=6; d.setDrawColor(120,120,120); d.setLineWidth(.3);
  [["Tandatangan pemeriksa",who(r)],["Disahkan oleh",r.status==="lulus"?(S.names[r.reviewedBy]||""):""]].forEach((s,i)=>{ const x=PM+i*96; d.line(x,y+12,x+80,y+12);
    pFont(d,7.5,"bold"); pText(d,"#6b6b6b"); d.text(s[0].toUpperCase(),x,y+16); pFont(d,8.5,"normal"); pText(d,"#141414"); d.text(A(s[1]),x,y+20.5); });
  await pdfPhotos(d,r);
  pFooter(d);
  await savePdf(d,"Pemeriksaan_"+A(r.plat||"tanpa-plat").replace(/[^A-Za-z0-9]+/g,"")+"_"+(r.tarikh||today())+".pdf");
}

async function pdfSummary(from,to){
  const rs=S.rows.filter(r=>{const t=(r.tarikh||r.createdAt||"").slice(0,10); return (!from||t>=from)&&(!to||t<=to);}).sort((a,b)=>(a.tarikh||"").localeCompare(b.tarikh||""));
  const J=await loadPdf(); const d=new J({unit:"mm",format:"a4"});
  const per=(from?fmtD(from):"Awal")+" - "+(to?fmtD(to):"Kini");
  pHeader(d,"LAPORAN RINGKASAN PEMERIKSAAN","Tempoh: "+per);
  let y=33;
  const n=rs.length, by=k=>rs.filter(r=>r.status===k).length;
  const kp=[["Jumlah kereta",n,"#141414"],["Disahkan",by("lulus"),"#1f8a4c"],["Menunggu semakan",by("hantar"),"#b58800"],["Draf",by("draf"),"#6b6b6b"],["Perlu dibetulkan",by("ulang"),"#d12b2b"]];
  const kw=(PW-2*PM-8)/5;
  kp.forEach((k,i)=>{ const x=PM+i*(kw+2); d.setDrawColor(228,225,218); d.setLineWidth(.3); pFill(d,"#ffffff"); d.roundedRect(x,y,kw,18,2,2,"FD");
    pFont(d,6.3,"bold"); pText(d,"#7a7a7a"); d.text(k[0].toUpperCase(),x+3,y+5); pFont(d,18,"bold"); pText(d,k[2]); d.text(String(k[1]),x+3,y+14.5); });
  y+=23;
  pFont(d,10,"bold"); pText(d,"#141414"); d.text("Taburan gred",PM,y+4); y+=7;
  const gw=(PW-2*PM-6)/4;
  ["A","B","C","D"].forEach((g,i)=>{ const v=rs.filter(r=>r.grade===g).length; const x=PM+i*(gw+2); pFill(d,GHEX[g]); d.roundedRect(x,y,gw,17,2,2,"F");
    pText(d,g==="B"?"#141414":"#ffffff"); pFont(d,16,"bold"); d.text(g+"   "+v,x+3,y+8); pFont(d,7,"normal"); d.text(A(GRADES[g]).slice(0,40),x+3,y+13.5);
    pFont(d,8,"bold"); d.text(n?Math.round(v/n*100)+"%":"0%",x+gw-3,y+8,{align:"right"}); });
  y+=21;
  const flood=rs.filter(r=>["Suspected","Confirmed"].includes(r.akhir?.banjir)).length, acc=rs.filter(r=>["Accident","Major"].includes(r.akhir?.body)).length, tng=rs.reduce((a,r)=>a+counts(r).ng,0);
  pFont(d,8.5,"normal"); pText(d,"#222222");
  d.text(`Banjir disyaki/sah: ${flood}    |    Accident / Major: ${acc}    |    Jumlah item NG: ${tng}    |    Purata NG sebuah: ${n?(tng/n).toFixed(1):"0"}`,PM,y+3); y+=6;
  const tk=rs.reduce((a,r)=>a+partsTotal(r),0), tb=rs.reduce((a,r)=>a+(r.parts||[]).length,0), tl=rs.reduce((a,r)=>a+partsLeft(r),0);
  pFill(d,"#141414"); d.roundedRect(PM,y,PW-2*PM,10,2,2,"F"); pFont(d,8.5,"bold"); pText(d,"#ffffff");
  d.text(`ANGGARAN KOS REPAIR:  ${tb} barang  |  ${tl} belum siap  |  purata ${A(RM(n?tk/n:0))} sebuah`,PM+3,y+6.3);
  pText(d,"#f5c400"); pFont(d,11,"bold"); d.text(A(RM(tk)),PW-PM-3,y+6.6,{align:"right"}); y+=14;
  // staff + top NG side by side
  const colW=(PW-2*PM-6)/2, y0=y;
  pFont(d,10,"bold"); pText(d,"#141414"); d.text("Prestasi staff",PM,y+4); d.text("Item NG paling kerap",PM+colW+6,y+4);
  let ys=y+7; pFill(d,"#141414"); d.rect(PM,ys,colW,5.5,"F"); pFont(d,7,"bold"); pText(d,"#ffffff");
  d.text("PEMERIKSA",PM+2,ys+3.8); d.text("JUMLAH",PM+colW-38,ys+3.8,{align:"right"}); d.text("DIHANTAR",PM+colW-20,ys+3.8,{align:"right"}); d.text("PURATA NG",PM+colW-2,ys+3.8,{align:"right"}); ys+=5.5;
  const st={}; rs.forEach(r=>{const k=who(r); st[k]=st[k]||{n:0,s:0,ng:0}; st[k].n++; if(r.status!=="draf")st[k].s++; st[k].ng+=counts(r).ng;});
  const sts=Object.entries(st).sort((a,b)=>b[1].n-a[1].n).slice(0,12);
  if(!sts.length){ pFont(d,8,"italic"); pText(d,"#6b6b6b"); d.text("Tiada data.",PM+2,ys+4); ys+=6; }
  sts.forEach(([k,v],i)=>{ if(i%2){pFill(d,"#f7f6f3"); d.rect(PM,ys,colW,5.2,"F");} pFont(d,8,"normal"); pText(d,"#222222");
    d.text(d.splitTextToSize(A(k),colW-44)[0],PM+2,ys+3.6); d.text(String(v.n),PM+colW-38,ys+3.6,{align:"right"}); d.text(String(v.s),PM+colW-20,ys+3.6,{align:"right"}); d.text((v.ng/v.n).toFixed(1),PM+colW-2,ys+3.6,{align:"right"}); ys+=5.2; });
  const fq={}; rs.forEach(r=>SECTIONS.forEach(s=>s.items.forEach((nm,i)=>{ if(r.items?.[s.k+"_"+i]?.s==="ng"){const k=nm+" ("+s.t.split(" ")[0]+")"; fq[k]=(fq[k]||0)+1;} })));
  const top=Object.entries(fq).sort((a,b)=>b[1]-a[1]).slice(0,10); const mx=top[0]?.[1]||1; let yt=y+7; const xr=PM+colW+6;
  if(!top.length){ pFont(d,8,"italic"); pText(d,"#6b6b6b"); d.text("Tiada item NG.",xr+2,yt+4); yt+=6; }
  top.forEach(([k,v])=>{ pFont(d,7.5,"normal"); pText(d,"#222222"); d.text(d.splitTextToSize(A(k),46)[0],xr,yt+3.5);
    pFill(d,"#efede8"); d.rect(xr+48,yt+1,colW-58,3,"F"); pFill(d,"#d12b2b"); d.rect(xr+48,yt+1,(colW-58)*v/mx,3,"F");
    pFont(d,7.5,"bold"); d.text(String(v),xr+colW,yt+3.5,{align:"right"}); yt+=5.2; });
  y=Math.max(ys,yt)+7;
  // table
  const cols=[["Tarikh",21],["No. plat",22],["Kereta",40],["Pemeriksa",28],["NG",9],["Gred",11],["Kos",25],["Status",30]];
  const th=()=>{ pFill(d,"#141414"); d.rect(PM,y,PW-2*PM,6,"F"); pFont(d,7,"bold"); pText(d,"#ffffff"); let x=PM; cols.forEach(([t,w])=>{ d.text(t.toUpperCase(),x+2,y+4); x+=w; }); y+=6; };
  if(y+20>PH-14){ d.addPage(); y=pMini(d); }
  pFont(d,10,"bold"); pText(d,"#141414"); d.text("Senarai pemeriksaan ("+n+")",PM,y+4); y+=7; th();
  if(!n){ pFont(d,8,"italic"); pText(d,"#6b6b6b"); d.text("Tiada pemeriksaan dalam tempoh ini.",PM+2,y+4.5); }
  rs.forEach((r,i)=>{ if(y+5.6>PH-14){ d.addPage(); y=pMini(d); th(); }
    if(i%2){ pFill(d,"#f7f6f3"); d.rect(PM,y,PW-2*PM,5.6,"F"); }
    const c=counts(r); const vals=[fmtD(r.tarikh),r.plat||"-",((r.jenis||"-")+" "+(r.tahun||"")).trim(),who(r),String(c.ng),r.grade||"-",RM(partsTotal(r)),(STATUS[r.status]||STATUS.draf)[0]];
    let x=PM; vals.forEach((v,j)=>{ const w=cols[j][1];
      if(j===5&&r.grade){ pFill(d,GHEX[r.grade]); d.roundedRect(x+1.5,y+1,6,3.6,.8,.8,"F"); pFont(d,7,"bold"); pText(d,r.grade==="B"?"#141414":"#ffffff"); d.text(r.grade,x+4.5,y+3.8,{align:"center"}); }
      else { pFont(d,7.6,j===1?"bold":"normal"); pText(d,j===4&&c.ng?"#d12b2b":"#222222"); d.text(d.splitTextToSize(A(v),w-3)[0]||"",x+2,y+3.9); }
      x+=w; });
    y+=5.6; });
  pFooter(d);
  await savePdf(d,"Laporan_Pemeriksaan_"+(from||"awal")+"_"+(to||today())+".pdf");
}
/* ---------- helpers ---------- */
const BHG = [...SECTIONS.map(s=>[s.k,s.t]),["lain","Lain-lain"]];
const bhgName = k => (BHG.find(b=>b[0]===k)||[,"Lain-lain"])[1];
const num = v => { const n=parseFloat(String(v??"").replace(/,/g,"")); return isFinite(n)?n:0; };
const partTotal = p => num(p.qty||1)*num(p.harga)+num(p.upah);
const partsTotal = r => (r.parts||[]).reduce((a,p)=>a+partTotal(p),0);
const partsLeft = r => (r.parts||[]).filter(p=>!p.siap).length;
const RM = n => "RM "+Number(n||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const fmtD = s => { if(!s) return "-"; const d=new Date(s); if(isNaN(d)) return s; return d.toLocaleDateString("ms-MY",{day:"numeric",month:"short",year:"numeric"}); };
const fmtDT = s => { if(!s) return "-"; const d=new Date(s); if(isNaN(d)) return s; return d.toLocaleString("ms-MY",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}); };
const newId = () => "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const gradeCls = g => g?("g"+g):"";
function counts(r){let ok=0,ng=0,na=0;const it=r.items||{};for(const s of SECTIONS)s.items.forEach((_,i)=>{const v=it[s.k+"_"+i]?.s;if(v==="ok")ok++;else if(v==="ng")ng++;else if(v==="na")na++;});return{ok,ng,na,done:ok+ng+na};}
function secCounts(r,s){let ok=0,ng=0,na=0;s.items.forEach((_,i)=>{const v=r.items?.[s.k+"_"+i]?.s;if(v==="ok")ok++;else if(v==="ng")ng++;else if(v==="na")na++;});return{ok,ng,na,done:ok+ng+na,total:s.items.length};}
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
function lsSet(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const normPlat = p => String(p||"").toUpperCase().replace(/[^A-Z0-9]/g,"");

/* ---------- state ---------- */
const S = { client:null, profile:null, vehicles:[], rows:[], loaded:false, err:null, view:"pantau", id:null, form:null, dirty:false, saving:false,
  filt:{q:"",st:"",g:""}, inv:{q:"",f:""}, names:{}, myId:null };
let root=null, app=null;
const isOwner = () => S.profile?.role==="owner";
const $ = s => root.querySelector(s);
const $$ = s => root.querySelectorAll(s);
const who = r => r.pemeriksa || S.names[r.createdBy] || "Staff";
const carName = v => [v.make,v.model].filter(Boolean).join(" ");
const vehById = id => S.vehicles.find(v=>String(v.id)===String(id));

function toast(m){const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2400);}

/* row (DB) <-> record (UI) */
function fromRow(x){ const d=x.data||{}; return {...d, id:x.id, vehicle_id:x.vehicle_id, status:x.status||"draf", grade:x.grade||d.grade||"",
  reviewNote:x.review_note||"", reviewedBy:x.reviewed_by||null, reviewedAt:x.reviewed_at||null, createdBy:x.created_by||null, createdAt:x.created_at, updatedAt:x.updated_at,
  items:d.items||{}, akhir:d.akhir||{}, parts:d.parts||[] }; }
function inspFor(v){ const np=normPlat(v.plate); return S.rows.filter(r=>String(r.vehicle_id)===String(v.id) || (!r.vehicle_id && np && normPlat(r.plat)===np)); }

/* ---------- data ---------- */
async function load(){
  try{
    const {data,error}=await S.client.from("checklist_inspections").select("*").order("created_at",{ascending:false}).limit(2000);
    if(error) throw error;
    S.rows=(data||[]).map(fromRow); S.err=null;
  }catch(e){ S.err = /checklist_inspections/.test(e?.message||"") || e?.code==="42P01" || e?.code==="PGRST205"
      ? "Jadual checklist belum dicipta. Jalankan V54_CHECKLIST_MIGRATION.sql dalam Supabase SQL Editor."
      : "Gagal memuatkan checklist: "+(e?.message||e); }
  S.loaded=true;
  const ids=[...new Set(S.rows.flatMap(r=>[r.createdBy,r.reviewedBy]).filter(Boolean))].filter(i=>!(i in S.names));
  if(ids.length){ try{ const {data}=await S.client.from("profiles").select("id,full_name").in("id",ids); (data||[]).forEach(p=>S.names[p.id]=p.full_name||""); }catch(e){} }
  render();
}
function bodyOf(f){
  return { jenis:(f.jenis||"").trim(), tahun:String(f.tahun||"").trim(), plat:(f.plat||"").trim().toUpperCase(), mileage:String(f.mileage||"").trim(),
    tarikh:f.tarikh, pemeriksa:(f.pemeriksa||"").trim(), pid:f.pid||undefined, items:f.items, akhir:f.akhir, grade:f.grade, catatan:f.catatan||"",
    parts:(f.parts||[]).filter(p=>(p.nama||"").trim()||num(p.harga)||num(p.upah)).map(p=>({id:p.id||newId(),nama:(p.nama||"").trim(),bhg:p.bhg||"lain",qty:num(p.qty||1)||1,harga:num(p.harga),upah:num(p.upah),siap:!!p.siap})) };
}

/* ---------- render ---------- */
function go(view,id){ if(S.view==="form"&&S.dirty&&S.form?.id&&view!=="form"){ /* edits to saved record are discarded */ }
  S.view=view; S.id=id||null; if(view!=="form"){S.form=null;S.dirty=false;} render(); try{ (root.host||app).scrollIntoView({block:"start"}); }catch(e){} }
function tabs(){
  const t=[["pantau","Ringkasan"],["kereta","Kereta"],["senarai","Rekod"],["jejak","Jejak"]];
  const on=S.view==="detail"?"senarai":S.view==="form"?"":S.view;
  return `<div class="tabs">${t.map(([k,l])=>`<button data-go="${k}" class="${on===k?"on":""}">${l}</button>`).join("")}<button class="refresh" data-act="refresh" title="Muat semula">⟳</button></div>`;
}
function render(){
  if(!app) return;
  if(S.view==="form") return renderForm();
  let h=`<div class="head"><div><span class="kick">PEMERIKSAAN</span><h2>Sistem Pemeriksaan</h2></div></div>`+tabs();
  if(S.err) h+=`<div class="notice err">${esc(S.err)}</div>`;
  if(!S.loaded) h+=`<div class="empty">Memuatkan…</div>`;
  else if(S.view==="kereta") h+=viewKereta();
  else if(S.view==="senarai") h+=viewSenarai();
  else if(S.view==="detail") h+=viewDetail();
  else if(S.view==="jejak") h+=viewJejak();
  else h+=viewPantau();
  app.innerHTML=h; bindCommon();
  if(S.view==="kereta") bindKereta();
  if(S.view==="senarai") bindSenarai();
  if(S.view==="detail") bindDetail();
  if(S.view==="jejak") bindJejak();
  if(S.view==="pantau") bindPantau();
}
function bindCommon(){
  $$("[data-go]").forEach(b=>b.onclick=()=>{ const [v,a,c]=b.dataset.go.split(":"); if(v==="senarai"&&(a!==undefined)) S.filt={q:"",st:a||"",g:c||""}; if(v==="kereta"&&a!==undefined) S.inv={q:"",f:a}; go(v); });
  $$("[data-rec]").forEach(b=>b.onclick=()=>go("detail",b.dataset.rec));
  const rf=$('[data-act="refresh"]'); if(rf) rf.onclick=()=>{ S.loaded=false; render(); load(); };
}
function recRow(r){
  const c=counts(r), s=STATUS[r.status]||STATUS.draf, flood=["Suspected","Confirmed"].includes(r.akhir?.banjir);
  return `<button class="rec" data-rec="${esc(r.id)}"><span class="gchip ${gradeCls(r.grade)}">${esc(r.grade||"–")}</span>
    <span class="rb"><b>${esc(r.plat||"(tiada plat)")} · ${esc(r.jenis||"-")} ${esc(r.tahun||"")}</b>
    <small>${esc(who(r))} · ${fmtD(r.tarikh)} · ${c.done}/${TOTAL_ITEMS}${c.ng?` · <em class="ng">${c.ng} NG</em>`:""}${(r.parts||[]).length?` · ${RM(partsTotal(r)).replace(".00","")}`:""}${photoCount(r)?` · 📷 ${photoCount(r)}`:""}${flood?` · <em class="ng">Banjir</em>`:""}</small></span>
    <span class="pill ${s[1]}">${s[0]}</span></button>`;
}

/* --- Ringkasan --- */
function viewPantau(){
  const R=S.rows, by=k=>R.filter(r=>r.status===k).length, t=today();
  const belum=S.vehicles.filter(v=>String(v.status).toLowerCase()!=="sold" && !inspFor(v).length).length;
  const gc={A:0,B:0,C:0,D:0}; R.forEach(r=>{if(gc[r.grade]!=null)gc[r.grade]++;});
  const freq={}; R.forEach(r=>SECTIONS.forEach(s=>s.items.forEach((nm,i)=>{ if(r.items?.[s.k+"_"+i]?.s==="ng"){const k=s.t+" › "+nm;freq[k]=(freq[k]||0)+1;} })));
  const top=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8), mx=top[0]?.[1]||1;
  const st={}; R.forEach(r=>{const n=who(r);st[n]=st[n]||0;st[n]++;}); const staff=Object.entries(st).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const flood=R.filter(r=>["Suspected","Confirmed"].includes(r.akhir?.banjir)).length;
  const kos=R.reduce((a,r)=>a+partsTotal(r),0), left=R.reduce((a,r)=>a+partsLeft(r),0);
  const today_n=R.filter(r=>(r.tarikh||"").slice(0,10)===t).length;
  return `<div class="row end"><button class="sm" data-act="pdfsum">Laporan PDF</button><button class="sm go" data-go="kereta:belum">+ Mula pemeriksaan</button></div>
  <div class="kpis">
    <button class="kpi ${belum?"alert":""}" data-go="kereta:belum"><span class="l">Belum diperiksa</span><b>${belum}</b><small>daripada ${S.vehicles.filter(v=>String(v.status).toLowerCase()!=="sold").length} kereta stok</small></button>
    <button class="kpi ${by("hantar")?"alert":""}" data-go="senarai:hantar:"><span class="l">Menunggu semakan</span><b>${by("hantar")}</b><small>${isOwner()?"Tekan untuk semak":"Dihantar kepada Owner"}</small></button>
    <button class="kpi" data-go="senarai:draf:"><span class="l">Draf belum siap</span><b>${by("draf")}</b><small>Belum dihantar</small></button>
    <button class="kpi ${by("ulang")?"alert":""}" data-go="senarai:ulang:"><span class="l">Perlu dibetulkan</span><b>${by("ulang")}</b><small>Dipulangkan oleh Owner</small></button>
    <button class="kpi" data-go="senarai::"><span class="l">Jumlah pemeriksaan</span><b>${R.length}</b><small>${today_n} hari ini</small></button>
    <button class="kpi" data-go="senarai::"><span class="l">Anggaran kos repair</span><b class="sm2">${RM(kos).replace(".00","")}</b><small>${left} barang belum ditukar</small></button>
    <button class="kpi ${flood?"alert":""}" data-go="senarai::banjir"><span class="l">Banjir disyaki/sah</span><b>${flood}</b><small>Wajib disclose</small></button>
  </div>
  <div class="grid2">
    <div class="card"><h3>Gred keseluruhan</h3><div class="grades">${["A","B","C","D"].map(g=>`<button class="gbox g${g}" data-go="senarai::${g}"><b>${gc[g]}</b><small>${g} · ${esc(GRADES[g].split(" /")[0])}</small></button>`).join("")}</div></div>
    <div class="card"><h3>Prestasi staff</h3>${staff.length?staff.map(([n,v])=>`<div class="bar"><span class="nm">${esc(n)}</span><span class="tr"><i style="width:${v/staff[0][1]*100}%;background:var(--pri)"></i></span><span class="n">${v}</span></div>`).join(""):`<p class="mute">Belum ada data.</p>`}</div>
    <div class="card"><h3>Item NG paling kerap</h3>${top.length?top.map(([k,v])=>`<div class="bar"><span class="nm" title="${esc(k)}">${esc(k)}</span><span class="tr"><i style="width:${v/mx*100}%"></i></span><span class="n">${v}</span></div>`).join(""):`<p class="mute">Tiada item NG lagi.</p>`}</div>
    <div class="card"><h3>Terkini</h3>${R.slice(0,6).map(recRow).join("")||`<p class="mute">Belum ada pemeriksaan.</p>`}</div>
  </div>`;
}
function bindPantau(){ const b=$('[data-act="pdfsum"]'); if(b) b.onclick=summaryDialog; }

/* --- Kereta --- */
function carState(v){ const l=inspFor(v)[0]; if(!l) return {k:"belum",t:"Belum diperiksa",r:null}; return {k:l.status||"draf",t:(STATUS[l.status]||STATUS.draf)[0],r:l}; }
function viewKereta(){
  const list=S.vehicles.filter(v=>String(v.status).toLowerCase()!=="sold").map(v=>({v,s:carState(v)}));
  const cnt=k=>list.filter(x=>k==="proses"?["draf","hantar","ulang"].includes(x.s.k):x.s.k===k).length;
  const F=[["","Semua",list.length],["belum","Belum diperiksa",cnt("belum")],["proses","Dalam proses",cnt("proses")],["lulus","Disahkan",cnt("lulus")]];
  return `<div class="filters"><input class="field" id="iq" placeholder="Cari model, plat atau ID…" value="${esc(S.inv.q)}"></div>
  <div class="chips">${F.map(([k,t,n])=>`<button data-if="${k}" class="${S.inv.f===k?"on":""}">${t}<b>${n}</b></button>`).join("")}</div><div id="cgrid"></div>`;
}
function carCard({v,s}){
  const r=s.r, cn=r?counts(r):null; let act;
  if(!r) act=`<button class="btn" data-start="${esc(v.id)}">Mula periksa</button>`;
  else if(s.k==="draf"||s.k==="ulang"||s.k==="hantar") act=`<button class="btn" data-edit="${esc(r.id)}">${s.k==="ulang"?"Betulkan":s.k==="hantar"?"Edit":"Sambung"}</button>`;
  else act=`<button class="btn alt" data-rec="${esc(r.id)}">Lihat laporan</button>${s.k==="lulus"?`<button class="btn alt narrow" data-start="${esc(v.id)}" title="Pemeriksaan baru">+</button>`:""}`;
  return `<div class="car"><div class="ctop"><span class="stat">${esc(v.status||"-")}</span><span class="ib ${s.k}">${esc(s.t)}</span></div>
    <div class="cb"><h4>${esc(carName(v)||"-")}</h4><div class="yp">${esc(v.model_year||"-")} · <span class="plate">${esc(v.plate||"-")}</span>${v.mileage_km?` · ${Number(v.mileage_km).toLocaleString("en-MY")} km`:""}</div>
    ${r?`<div class="ins"><span class="gchip sm ${gradeCls(r.grade)}">${esc(r.grade||"–")}</span><span>${cn.done}/${TOTAL_ITEMS} item${cn.ng?` · <em class="ng">${cn.ng} NG</em>`:""}${(r.parts||[]).length?` · kos ${RM(partsTotal(r)).replace(".00","")}`:""}<br><small class="mute">${esc(who(r))} · ${fmtD(r.tarikh)}</small></span></div>`:""}
    <div class="idr">ID <b>${esc(v.vehicle_id||"-")}</b></div></div><div class="cf">${act}</div></div>`;
}
function bindKereta(){
  const draw=()=>{
    const q=S.inv.q.toLowerCase();
    const rs=S.vehicles.filter(v=>String(v.status).toLowerCase()!=="sold").map(v=>({v,s:carState(v)}))
      .filter(({v,s})=>(!S.inv.f||(S.inv.f==="proses"?["draf","hantar","ulang"].includes(s.k):s.k===S.inv.f))&&(!q||[v.vehicle_id,carName(v),v.plate,v.model_year].join(" ").toLowerCase().includes(q)));
    $("#cgrid").innerHTML = rs.length? `<div class="cgrid">${rs.map(carCard).join("")}</div>` : `<div class="empty">${S.vehicles.length?"Tiada kereta yang sepadan.":"Tiada kenderaan dalam inventori."}</div>`;
    $$("#cgrid [data-start]").forEach(b=>b.onclick=()=>openForCar(b.dataset.start));
    $$("#cgrid [data-edit]").forEach(b=>b.onclick=()=>openForm(b.dataset.edit));
    $$("#cgrid [data-rec]").forEach(b=>b.onclick=()=>go("detail",b.dataset.rec));
  };
  $("#iq").oninput=e=>{S.inv.q=e.target.value;draw();};
  $$("[data-if]").forEach(b=>b.onclick=()=>{S.inv.f=b.dataset.if;render();});
  draw();
}

/* --- Rekod --- */
function viewSenarai(){
  return `<div class="filters"><input class="field" id="fq" placeholder="Cari plat, model, staff…" value="${esc(S.filt.q)}">
    <select class="field" id="fs"><option value="">Semua status</option>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${S.filt.st===k?"selected":""}>${v[0]}</option>`).join("")}</select>
    <select class="field" id="fg"><option value="">Semua gred</option>${["A","B","C","D"].map(g=>`<option ${S.filt.g===g?"selected":""}>${g}</option>`).join("")}<option value="banjir" ${S.filt.g==="banjir"?"selected":""}>Banjir disyaki/sah</option></select></div><div id="lst"></div>`;
}
function bindSenarai(){
  const draw=()=>{
    const q=S.filt.q.toLowerCase(), f=S.filt;
    const rs=S.rows.filter(r=>(!f.st||r.status===f.st)&&(!f.g||(f.g==="banjir"?["Suspected","Confirmed"].includes(r.akhir?.banjir):r.grade===f.g))&&(!q||[r.plat,r.jenis,r.tahun,who(r)].join(" ").toLowerCase().includes(q)));
    $("#lst").innerHTML = rs.length? `<p class="mute">${rs.length} rekod</p>`+rs.map(recRow).join("") : `<div class="empty">Tiada rekod yang sepadan.</div>`;
    $$("#lst [data-rec]").forEach(b=>b.onclick=()=>go("detail",b.dataset.rec));
  };
  $("#fq").oninput=e=>{S.filt.q=e.target.value;draw();};
  $("#fs").onchange=e=>{S.filt.st=e.target.value;draw();};
  $("#fg").onchange=e=>{S.filt.g=e.target.value;draw();};
  draw();
}

/* --- Detail --- */
/* --- Jejak transaksi (V68) --- */
const TRAIL={byId:{},all:null,err:"",q:"",act:""};
const ACT={cipta:["Dicipta","t-draf"],cipta_hantar:["Dicipta & dihantar","t-hantar"],edit:["Dikemas kini","t-edit"],hantar:["Dihantar untuk semakan","t-hantar"],
  sahkan:["Disahkan Owner","t-lulus"],pulangkan:["Dipulangkan untuk dibetulkan","t-ng"],barang_siap:["Barang ditanda siap","t-lulus"],tukar_status:["Status ditukar","t-edit"],padam:["Rekod dipadam","t-ng"]};
const TRAIL_COLS="id,inspection_id,plate,action,from_status,to_status,changes,actor_id,actor_name,created_at";
function trailItem(t, showPlate){
  const a=ACT[t.action]||[t.action,"t-edit"];
  const st=t.from_status&&t.to_status&&t.from_status!==t.to_status?` <small class="mute">(${esc((STATUS[t.from_status]||[t.from_status])[0])} → ${esc((STATUS[t.to_status]||[t.to_status])[0])})</small>`:"";
  const ch=Array.isArray(t.changes)?t.changes:[];
  const plate=showPlate?`<button class="tplate" data-trec="${esc(t.inspection_id)}" ${t.action==="padam"?"disabled":""}>${esc(t.plate||"(tiada plat)")}</button> `:"";
  return `<li class="${a[1]}"><i></i><div><div class="th">${plate}<b>${esc(a[0])}</b>${st}</div>
    <small class="mute">${esc(t.actor_name||"Sistem")} · ${fmtDT(t.created_at)}</small>
    ${ch.length?`<ul>${ch.map(c=>`<li>${esc(c)}</li>`).join("")}</ul>`:""}</div></li>`;
}
function trailHtml(list, showPlate){
  if(TRAIL.err) return `<div class="notice err">${esc(TRAIL.err)}</div>`;
  if(!list) return `<p class="mute">Memuatkan jejak…</p>`;
  if(!list.length) return `<p class="mute">Belum ada jejak. Rekod lama (sebelum ciri ini dipasang) hanya mula dijejak selepas perubahan seterusnya.</p>`;
  return `<ol class="trail">${list.map(t=>trailItem(t,showPlate)).join("")}</ol>`;
}
async function loadTrail(id){
  try{
    const {data,error}=await S.client.from("checklist_trail").select(TRAIL_COLS).eq("inspection_id",id).order("created_at",{ascending:false}).limit(300);
    if(error) throw error; TRAIL.err=""; TRAIL.byId[id]=data||[];
  }catch(e){ TRAIL.err="Jejak tidak dapat dimuatkan: "+(e.message||e); }
  const el=$("#trail"); if(el&&S.id===id) el.innerHTML=trailHtml(TRAIL.byId[id],false);
}
async function loadTrailAll(){
  try{
    const {data,error}=await S.client.from("checklist_trail").select(TRAIL_COLS).order("created_at",{ascending:false}).limit(500);
    if(error) throw error; TRAIL.err=""; TRAIL.all=data||[];
  }catch(e){ TRAIL.err="Jejak tidak dapat dimuatkan: "+(e.message||e); TRAIL.all=[]; }
  if(S.view==="jejak") fillJejak();
}
function jejakFiltered(){
  const q=TRAIL.q.trim().toLowerCase(), act=TRAIL.act;
  return (TRAIL.all||[]).filter(t=>(!act||t.action===act||(act==="cipta"&&t.action==="cipta_hantar"))&&(!q||[t.plate,t.actor_name,...(t.changes||[])].join(" ").toLowerCase().includes(q)));
}
function viewJejak(){
  const opts=[["","Semua tindakan"],["cipta","Dicipta"],["edit","Dikemas kini"],["hantar","Dihantar"],["sahkan","Disahkan"],["pulangkan","Dipulangkan"],["barang_siap","Barang siap"],["padam","Dipadam"]];
  return `<div class="card"><div class="row"><h3>Jejak transaksi pemeriksaan</h3><span class="grow"></span><small class="mute" id="jcount"></small></div>
    <p class="mute">Setiap cipta, edit, hantar, sahkan, pulangkan, tanda barang siap dan padam direkod automatik oleh pangkalan data. Jejak tidak boleh diubah atau dipadam.</p>
    <div class="jbar"><input class="field" id="jq" placeholder="Cari plat, nama staf atau perubahan…" value="${esc(TRAIL.q)}">
      <select class="field" id="jact">${opts.map(([k,l])=>`<option value="${k}" ${TRAIL.act===k?"selected":""}>${l}</option>`).join("")}</select></div>
    <div id="jlist">${trailHtml(TRAIL.all?jejakFiltered():null,true)}</div></div>`;
}
function fillJejak(){
  const el=$("#jlist"); if(!el) return; const l=TRAIL.all?jejakFiltered():null;
  el.innerHTML=trailHtml(l,true); const c=$("#jcount"); if(c) c.textContent=l?`${l.length} rekod`:"";
  $$("[data-trec]").forEach(b=>b.onclick=()=>{ if(S.rows.some(x=>x.id===b.dataset.trec)) go("detail",b.dataset.trec); else toast("Rekod ini sudah dipadam"); });
}
function bindJejak(){
  const q=$("#jq"), a=$("#jact");
  if(q) q.oninput=()=>{ TRAIL.q=q.value; fillJejak(); };
  if(a) a.onchange=()=>{ TRAIL.act=a.value; fillJejak(); };
  fillJejak(); loadTrailAll();
}
function viewDetail(){
  const r=S.rows.find(x=>x.id===S.id);
  if(!r) return `<div class="empty">Rekod tidak dijumpai.</div>`;
  const c=counts(r), s=STATUS[r.status]||STATUS.draf;
  // Semua staf yang diberi akses Pemeriksaan boleh edit rekod bersama, termasuk yang dihantar oleh staf lain.
  // Rekod disahkan Owner kekal terkunci untuk staf biasa (selaras dengan checklist_guard pada database).
  const canEdit = isOwner() || r.status!=="lulus";
  return `<button class="back" data-go="senarai">← Rekod</button>
  <div class="card">
    <div class="dhead"><span class="gchip big ${gradeCls(r.grade)}">${esc(r.grade||"–")}</span>
      <div class="grow"><h2>${esc(r.plat||"(tiada plat)")} — ${esc(r.jenis||"-")} ${esc(r.tahun||"")}</h2><p class="mute">${r.grade?esc(GRADES[r.grade]):"Gred belum ditetapkan"}</p></div>
      <span class="pill ${s[1]}">${s[0]}</span></div>
    <div class="kv">
      <div><span>Pemeriksa</span>${esc(who(r))}</div><div><span>Tarikh</span>${fmtD(r.tarikh)}</div><div><span>Mileage</span>${esc(r.mileage||"-")}</div>
      <div><span>Keputusan</span><em class="ok">${c.ok} OK</em> · <em class="ng">${c.ng} NG</em> · ${c.na} N/A</div>
      ${AKHIR.map(a=>`<div><span>${a.t}</span>${esc(r.akhir?.[a.k]||"-")}</div>`).join("")}
      <div><span>Anggaran kos</span><b>${RM(partsTotal(r))}</b></div>
    </div>
    ${r.catatan?`<div><b>Catatan umum:</b><div class="pre">${esc(r.catatan)}</div></div>`:""}
    ${r.reviewNote||r.reviewedAt?`<div class="notice"><b>Semakan Owner${r.status==="lulus"?" (disahkan)":""}:</b> ${esc(r.reviewNote||"—")}<br><small class="mute">${esc(S.names[r.reviewedBy]||"")} ${fmtDT(r.reviewedAt)}</small></div>`:""}
    <div class="row">
      ${canEdit?`<button class="sm" data-edit="${esc(r.id)}">Edit</button>`:""}
      <button class="sm go" data-act="pdf">Muat turun PDF</button><button class="sm" data-act="copy">Salin ringkasan (WhatsApp)</button>
      <span class="grow"></span>
      ${isOwner()&&r.status!=="draf"?`<button class="sm bad" data-rv="ulang">Pulangkan</button><button class="sm okb" data-rv="lulus">Sahkan</button>`:""}
    </div>
  </div>
  <div class="card"><div class="row"><h3>Barang perlu tukar &amp; kos</h3><span class="grow"></span>${(r.parts||[]).length?`<span class="pill ${partsLeft(r)?"p-hantar":"p-lulus"}">${partsLeft(r)?partsLeft(r)+" belum siap":"Semua siap"}</span>`:""}</div>
    ${(r.parts||[]).length?`<table class="ptab"><thead><tr><th>Siap</th><th>Barang</th><th class="num hx">Qty</th><th class="num hx">Harga</th><th class="num hx">Upah</th><th class="num">Jumlah</th></tr></thead><tbody>
      ${r.parts.map((p,i)=>`<tr class="${p.siap?"siap":""}"><td><input type="checkbox" data-siap="${i}" ${p.siap?"checked":""}></td><td><div class="pn">${esc(p.nama||"-")}</div><small class="mute">${esc(bhgName(p.bhg))}</small><div class="mx">${esc(p.qty)} × ${RM(p.harga)}${num(p.upah)?` + upah ${RM(p.upah)}`:""}</div></td><td class="num hx">${esc(p.qty)}</td><td class="num hx">${RM(p.harga)}</td><td class="num hx">${RM(p.upah)}</td><td class="num"><b>${RM(partTotal(p))}</b></td></tr>`).join("")}
      </tbody></table><div class="gtot"><span>Jumlah anggaran kos</span><b>${RM(partsTotal(r))}</b></div>`:`<p class="mute">Tiada barang direkodkan.</p>`}</div>
  ${photoCount(r)?`<div class="card"><div class="row"><h3>Gambar bukti</h3><span class="grow"></span><small class="mute">${photoCount(r)} gambar</small></div><div class="evid">
    ${SECTIONS.map(sec=>sec.items.map((nm,i)=>{const v=r.items?.[sec.k+"_"+i]; const ps=photosOf(v); if(!ps.length) return "";
      return `<div class="ei"><b class="${v.s==="ng"?"ng":""}">${esc(sec.t)} › ${esc(nm)}</b>${v.s?` <span class="pill ${v.s==="ng"?"p-ng":v.s==="ok"?"p-lulus":"p-draf"}">${v.s==="na"?"N/A":v.s.toUpperCase()}</span>`:""}${v.n?`<div class="mute">${esc(v.n)}</div>`:""}
        <div class="phs">${ps.map(p=>thumbHtml(p,false).replace('data-open=','data-cap="'+esc(sec.t+" › "+nm)+'" data-open=')).join("")}</div></div>`;}).join("")).join("")}
  </div></div>`:""}
  <div class="card"><h3>Butiran mengikut bahagian</h3>
    ${SECTIONS.map((sec,si)=>{const sc=secCounts(r,sec);const rows=sec.items.map((nm,i)=>({nm,v:r.items?.[sec.k+"_"+i]}));const ngs=rows.filter(x=>x.v?.s==="ng"),notes=rows.filter(x=>x.v?.s!=="ng"&&x.v?.n);
      return `<div class="secsum"><i style="background:${SECHEX[sec.k]}"></i><b class="grow">${si+1}. ${esc(sec.t)}</b><small class="mute">${sc.done}/${sc.total}</small>${sc.ng?`<span class="pill p-ng">${sc.ng} NG</span>`:sc.done===sc.total?`<span class="pill p-lulus">Semua OK</span>`:""}</div>
      ${ngs.length?`<ul class="nglist">${ngs.map(x=>`<li><b class="ng">${esc(x.nm)}</b>${x.v.n?` <span class="mute">— ${esc(x.v.n)}</span>`:""}</li>`).join("")}</ul>`:""}
      ${notes.length?`<ul class="nglist">${notes.map(x=>`<li>${esc(x.nm)} <span class="mute">— ${esc(x.v.n)}</span></li>`).join("")}</ul>`:""}`;}).join("")}
    <small class="mute">Dicipta ${fmtDT(r.createdAt)} · Dikemas kini ${fmtDT(r.updatedAt)}</small></div>
  <div class="card"><div class="row"><h3>Jejak transaksi</h3><span class="grow"></span><small class="mute">Direkod automatik</small></div>
    <div id="trail">${trailHtml(TRAIL.byId[r.id], false)}</div></div>
  ${isOwner()?`<div class="row end"><button class="lnk bad" data-act="del">Padam rekod ini</button></div>`:""}`;
}
function bindDetail(){
  const r=S.rows.find(x=>x.id===S.id); if(!r) return;
  loadTrail(r.id);
  hydrate(Object.values(r.items||{}).flatMap(photosOf));
  $$(".evid [data-open]").forEach(t=>t.onclick=()=>lightbox(t.dataset.open,t.dataset.cap));
  $$("[data-edit]").forEach(b=>b.onclick=()=>openForm(b.dataset.edit));
  $('[data-act="pdf"]').onclick=e=>withBusy(e.target,()=>pdfInspection(r));
  $('[data-act="copy"]').onclick=()=>{ const t=summaryText(r); (navigator.clipboard?.writeText(t)||Promise.reject()).then(()=>toast("Ringkasan disalin"),()=>showCopy(t)); };
  $$("[data-rv]").forEach(b=>b.onclick=()=>review(r,b.dataset.rv));
  $$("[data-siap]").forEach(cb=>cb.onchange=async()=>{
    const parts=(r.parts||[]).map((p,i)=>i===+cb.dataset.siap?{...p,siap:cb.checked}:{...p}); cb.disabled=true;
    const {error}=await S.client.from("checklist_inspections").update({data:{...bodyOf(r),parts},kos:partsTotal({parts})}).eq("id",r.id);
    if(error){ cb.checked=!cb.checked; cb.disabled=false; toast("Gagal simpan: "+error.message); return; }
    r.parts=parts; toast(cb.checked?"Ditanda siap ✓":"Ditanda belum siap"); render();
  });
  const del=$('[data-act="del"]'); if(del) del.onclick=async()=>{ if(del.dataset.sure!=="1"){del.dataset.sure="1";del.textContent="Tekan sekali lagi untuk padam";return;}
    const {error}=await S.client.from("checklist_inspections").delete().eq("id",r.id); if(error){toast("Gagal padam: "+error.message);return;}
    S.rows=S.rows.filter(x=>x.id!==r.id); toast("Rekod dipadam"); go("senarai"); };
}
function summaryText(r){
  const c=counts(r); let t=`*ABE DIN AUTO – Laporan Pemeriksaan*\n${r.plat||"-"} | ${r.jenis||"-"} ${r.tahun||""}\nMileage: ${r.mileage||"-"}\nTarikh: ${fmtD(r.tarikh)} | Pemeriksa: ${who(r)}\n\n*Gred: ${r.grade||"-"}* ${r.grade?"("+GRADES[r.grade]+")":""}\n`;
  AKHIR.forEach(a=>t+=`${a.t}: ${r.akhir?.[a.k]||"-"}\n`);
  t+=`\nOK ${c.ok} · NG ${c.ng} · N/A ${c.na}\n`;
  SECTIONS.forEach(s=>{const ngs=s.items.map((nm,i)=>({nm,v:r.items?.[s.k+"_"+i]})).filter(x=>x.v?.s==="ng");if(ngs.length){t+=`\n_${s.t}_\n`;ngs.forEach(x=>t+=`❌ ${x.nm}${x.v.n?" – "+x.v.n:""}\n`);}});
  if((r.parts||[]).length){ t+=`\n*Barang perlu tukar*\n`; r.parts.forEach(p=>t+=`${p.siap?"✅":"▫️"} ${p.nama} (x${p.qty}) – ${RM(partTotal(p))}\n`); t+=`*Jumlah: ${RM(partsTotal(r))}*\n`; }
  if(r.catatan) t+=`\nCatatan: ${r.catatan}\n`;
  return t;
}
function modal(html){ const m=document.createElement("div"); m.className="modal"; m.innerHTML=`<div class="box">${html}</div>`; root.appendChild(m); return m; }
function showCopy(txt){ const m=modal(`<h3>Salin ringkasan</h3><textarea class="field" readonly style="min-height:220px">${esc(txt)}</textarea><div class="row end"><button class="sm">Tutup</button></div>`); m.querySelector("textarea").select(); m.querySelector("button").onclick=()=>m.remove(); }
function review(r,to){
  const m=modal(`<h3>${to==="lulus"?"Sahkan pemeriksaan":"Pulangkan kepada staff"}</h3><p class="mute">${to==="lulus"?"Komen (pilihan):":"Nyatakan apa yang perlu dibetulkan:"}</p>
    <textarea class="field" id="rv" style="min-height:90px">${esc(r.reviewNote||"")}</textarea>
    <div class="row end"><button class="sm" id="c">Batal</button><button class="sm ${to==="lulus"?"okb":"bad"}" id="y">${to==="lulus"?"Sahkan":"Pulangkan"}</button></div>`);
  m.querySelector("#c").onclick=()=>m.remove();
  m.querySelector("#y").onclick=async e=>{
    const note=m.querySelector("#rv").value.trim(); if(to==="ulang"&&!note){toast("Sila tulis apa yang perlu dibetulkan");return;}
    e.target.disabled=true;
    const {error}=await S.client.from("checklist_inspections").update({status:to,review_note:note,reviewed_by:S.myId,reviewed_at:new Date().toISOString()}).eq("id",r.id);
    if(error){ e.target.disabled=false; toast("Gagal simpan: "+error.message); return; }
    m.remove(); toast(to==="lulus"?"Disahkan ✓":"Dipulangkan kepada staff"); await load();
  };
}

/* ---------- form ---------- */
/* ---------- gambar bukti (bucket peribadi checklist-photos) ---------- */
const BUCKET="checklist-photos", URLS={};
const photosOf = v => Array.isArray(v?.p)?v.p:[];
function photoCount(r){ return Object.values(r.items||{}).reduce((a,v)=>a+photosOf(v).length,0); }
async function signPaths(paths){
  const need=[...new Set(paths)].filter(p=>p&&!URLS[p]); if(!need.length) return;
  try{ const {data,error}=await S.client.storage.from(BUCKET).createSignedUrls(need,3600); if(error) throw error;
    (data||[]).forEach(d=>{ if(d.signedUrl&&d.path) URLS[d.path]=d.signedUrl; }); }catch(e){ console.warn("signed url",e); }
}
function fillImgs(){ root.querySelectorAll("img[data-ph]").forEach(i=>{ const u=URLS[i.dataset.ph]; if(u&&i.src!==u) i.src=u; }); }
async function hydrate(paths){ await signPaths(paths); fillImgs(); }
async function compress(file){
  try{
    const bmp=await createImageBitmap(file,{imageOrientation:"from-image"}); const max=1600, sc=Math.min(1,max/Math.max(bmp.width,bmp.height));
    const c=document.createElement("canvas"); c.width=Math.round(bmp.width*sc); c.height=Math.round(bmp.height*sc);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height); bmp.close?.();
    const b=await new Promise(res=>c.toBlob(res,"image/jpeg",0.78)); if(b) return b;
  }catch(e){}
  return file;
}
function thumbHtml(path,removable){ return `<span class="ph" data-open="${esc(path)}"><img data-ph="${esc(path)}" alt="" loading="lazy" src="${esc(URLS[path]||"")}">${removable?`<button class="x" data-rm="${esc(path)}" title="Buang gambar">✕</button>`:""}</span>`; }
function lightbox(path,cap){ const m=document.createElement("div"); m.className="lightbox"; m.innerHTML=`<img src="${esc(URLS[path]||"")}" alt=""><p>${esc(cap||"")}</p><p class="mute">Tekan di mana-mana untuk tutup</p>`; m.onclick=()=>m.remove(); root.appendChild(m); }
async function uploadPhotos(key,files,row){
  const f=S.form; if(!f) return; f.pid=f.pid||crypto.randomUUID?.()||newId();
  const box=row.querySelector(".phs"), cam=row.querySelector(".cam");
  for(const file of files){
    if(!/^image\//.test(file.type)){ toast("Hanya fail gambar"); continue; }
    const tmp=document.createElement("span"); tmp.className="ph up"; tmp.textContent="Muat naik…"; box.appendChild(tmp);
    try{
      const blob=await compress(file), path=`${f.pid}/${key}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.jpg`;
      const {error}=await S.client.storage.from(BUCKET).upload(path,blob,{contentType:"image/jpeg",upsert:false});
      if(error) throw error;
      if(S.form!==f) return;
      const cur=f.items[key]||{}; f.items[key]={...cur,p:[...photosOf(cur),path]};
      await signPaths([path]); markDirty();
    }catch(e){ toast("Gagal muat naik: "+(e?.message||e)); }
    tmp.remove();
  }
  renderItemPhotos(row,key);
}
function renderItemPhotos(row,key){
  const v=S.form?.items[key], ps=photosOf(v), box=row.querySelector(".phs"), cam=row.querySelector(".cam");
  box.innerHTML=ps.map(p=>thumbHtml(p,true)).join(""); cam.classList.toggle("has",ps.length>0); cam.querySelector("small").textContent=ps.length?ps.length:"";
  fillImgs(); bindThumbs(box,key);
}
function bindThumbs(box,key){
  box.querySelectorAll("[data-open]").forEach(t=>t.onclick=e=>{ if(e.target.closest("[data-rm]")) return; lightbox(t.dataset.open); });
  box.querySelectorAll("[data-rm]").forEach(b=>b.onclick=async e=>{ e.stopPropagation(); const path=b.dataset.rm, cur=S.form.items[key]||{};
    const rest=photosOf(cur).filter(x=>x!==path); S.form.items[key]={...cur,p:rest}; if(!rest.length) delete S.form.items[key].p;
    if(!S.form.items[key].s&&!S.form.items[key].n&&!S.form.items[key].p) delete S.form.items[key];
    markDirty(); renderItemPhotos(box.closest(".it"),key);
    S.client.storage.from(BUCKET).remove([path]).catch(()=>{}); });
}
function blankForm(){ return {id:null,vehicle_id:null,jenis:"",tahun:"",plat:"",mileage:"",tarikh:today(),pemeriksa:S.profile?.full_name||lsGet("abedin_nama")||"",items:{},akhir:{},grade:"",catatan:"",status:"draf",parts:[]}; }
function openForCar(vid){
  const v=vehById(vid); if(!v) return toast("Kenderaan tidak dijumpai");
  const open=inspFor(v).find(r=>r.status==="draf"||r.status==="ulang"); if(open) return openForm(open.id);
  const d=lsGet("abedin_ck_draft_"+v.id);
  S.form = d && !d.id ? d : Object.assign(blankForm(),{vehicle_id:v.id,jenis:carName(v),tahun:String(v.model_year||""),plat:v.plate||"",mileage:v.mileage_km?String(v.mileage_km):""});
  S.form.parts=S.form.parts||[]; S.dirty=false; S.view="form"; render();
}
function openForm(id){
  const r=S.rows.find(x=>x.id===id); if(!r) return toast("Rekod tidak dijumpai");
  S.form=JSON.parse(JSON.stringify(r)); S.form.items=S.form.items||{}; S.form.akhir=S.form.akhir||{}; S.form.parts=S.form.parts||[];
  S.dirty=false; S.view="form"; render();
}
function renderForm(){
  const f=S.form;
  app.innerHTML=`<button class="back" data-back>← Batal</button>
  <div class="head"><div><span class="kick">${f.id?"EDIT PEMERIKSAAN":"PEMERIKSAAN BARU"}</span><h2>${esc(f.jenis||"Kereta")} <span class="plate">${esc(f.plat||"")}</span></h2></div></div>
  ${f.status==="ulang"&&f.reviewNote?`<div class="notice err"><b>Perlu dibetulkan:</b> ${esc(f.reviewNote)}</div>`:""}
  <div class="card"><div class="info">
    <div class="fld full"><label>Jenis kereta</label><input class="field" data-f="jenis" value="${esc(f.jenis)}"></div>
    <div class="fld"><label>No. plat</label><input class="field" data-f="plat" value="${esc(f.plat)}" style="text-transform:uppercase"></div>
    <div class="fld"><label>Tahun</label><input class="field" data-f="tahun" inputmode="numeric" value="${esc(f.tahun)}"></div>
    <div class="fld"><label>Mileage (km)</label><input class="field" data-f="mileage" inputmode="numeric" value="${esc(f.mileage)}"></div>
    <div class="fld"><label>Tarikh</label><input class="field" type="date" data-f="tarikh" value="${esc(f.tarikh)}"></div>
    <div class="fld full"><label>Pemeriksa</label><input class="field" data-f="pemeriksa" value="${esc(f.pemeriksa)}" placeholder="Nama staff"></div>
  </div></div>
  <div class="jump">${SECTIONS.map((s,si)=>`<button data-j="${s.k}"><i style="background:${SECHEX[s.k]}">${si+1}</i>${["Enjin","Gearbox","Brek","Suspension","Tayar","Body","Elektrik","Interior"][si]} <small data-jc="${s.k}"></small></button>`).join("")}<button data-j="secK"><i style="background:#555">9</i>Kos <small id="jk"></small></button><button data-j="sec9"><i style="background:${"#1d55b8"}">10</i>Keputusan</button></div>
  <p class="mute">Tekan <b>OK</b>, <b>NG</b> atau <b>N/A</b> untuk setiap item. Ruang catatan muncul bila pilih NG.</p>
  ${SECTIONS.map((s,si)=>secHtml(s,si)).join("")}
  <div class="sec" id="secK"><div class="sech" style="background:#2a2721"><span class="no">9</span><span class="tt">Barang Perlu Tukar &amp; Kos</span><span class="pg" id="kpg"></span></div><div class="secb"><div id="partsBox"></div></div></div>
  <div class="sec" id="sec9"><div class="sech" style="background:#1d55b8"><span class="no">10</span><span class="tt">Keputusan Akhir</span></div><div class="secb"><div class="akhir">
    ${AKHIR.map(a=>`<div class="ak"><span class="k">${a.t}</span><div class="opts" data-ak="${a.k}">${a.o.map(o=>`<button data-v="${o}" class="${f.akhir[a.k]===o?"on":""}">${o}</button>`).join("")}</div></div>`).join("")}
    <div class="ak"><span class="k">Overall Grade</span><div class="gsel">${["A","B","C","D"].map(g=>`<button class="g${g} ${f.grade===g?"on":""}" data-g="${g}"><b>${g}</b><small>${esc(GRADES[g])}</small></button>`).join("")}</div></div>
    <div class="fld"><label>Catatan umum</label><textarea class="field" data-f="catatan" rows="3" placeholder="Ringkasan keadaan kereta, kerja repair yang perlu…">${esc(f.catatan)}</textarea></div>
    <p class="mute" id="suggest"></p>
  </div></div></div>
  <div class="savebar"><div class="prog"><span id="pgt"></span><div class="tr"><i id="pgb"></i></div></div><button class="sm" id="sv">Simpan draf</button><button class="sm go" id="sb">Hantar</button></div>`;
  bindForm(); renderParts(); updateProg();
}
function secHtml(s,si){
  const sc=secCounts(S.form,s), closed=si>0&&sc.done===sc.total;
  return `<div class="sec ${closed?"closed":""}" data-sec="${s.k}"><div class="sech" style="background:${SECHEX[s.k]}"><span class="no">${si+1}</span><span class="tt">${esc(s.t)}</span><span class="pg" data-pg="${s.k}"></span><span class="chev">▾</span></div>
  <div class="secb"><div class="tools"><button class="sm" data-allok="${s.k}">Tandakan baki OK</button></div>
  ${s.items.map((nm,i)=>{const key=s.k+"_"+i,v=S.form.items[key]||{};return `<div class="it ${v.s==="ng"?"isng":""}" data-it="${key}"><div class="top"><span class="lbl">${esc(nm)}</span>
    <label class="cam ${photosOf(v).length?"has":""}" title="Tambah gambar bukti">📷<small>${photosOf(v).length||""}</small><input type="file" accept="image/*" multiple data-cam></label>
    <div class="seg"><button class="ok ${v.s==="ok"?"on":""}" data-s="ok">OK</button><button class="ng ${v.s==="ng"?"on":""}" data-s="ng">NG</button><button class="na ${v.s==="na"?"on":""}" data-s="na">N/A</button></div></div>
    <input class="note field" placeholder="Catatan${v.s==="ng"?" (apa masalahnya?)":""}" value="${esc(v.n||"")}" style="${v.s==="ng"||v.n?"":"display:none"}">
    <div class="phs">${photosOf(v).map(p=>thumbHtml(p,true)).join("")}</div></div>`;}).join("")}</div></div>`;
}
function markDirty(){ if(!S.form) return; S.dirty=true; if(!S.form.id&&S.form.vehicle_id) lsSet("abedin_ck_draft_"+S.form.vehicle_id,S.form); updateProg(); }
function bindForm(){
  $("[data-back]").onclick=()=>{ const f=S.form; go(f?.id?"detail":"kereta",f?.id); };
  $$("[data-f]").forEach(el=>el.oninput=()=>{ let v=el.value; if(el.dataset.f==="plat") v=v.toUpperCase(); S.form[el.dataset.f]=v; markDirty(); });
  $$(".sech").forEach(h=>h.onclick=()=>h.parentElement.dataset.sec&&h.parentElement.classList.toggle("closed"));
  $$(".it").forEach(row=>{ const key=row.dataset.it, note=row.querySelector(".note");
    row.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{ const cur=S.form.items[key]||{}, ns=cur.s===b.dataset.s?null:b.dataset.s;
      S.form.items[key]={...cur,s:ns}; if(!ns&&!cur.n&&!photosOf(cur).length) delete S.form.items[key];
      row.querySelectorAll(".seg button").forEach(x=>x.classList.toggle("on",x.dataset.s===ns)); row.classList.toggle("isng",ns==="ng");
      note.style.display=(ns==="ng"||note.value)?"":"none"; note.placeholder=ns==="ng"?"Catatan (apa masalahnya?)":"Catatan"; if(ns==="ng") note.focus();
      markDirty(); renderParts(); });
    note.oninput=()=>{ S.form.items[key]={...(S.form.items[key]||{}),n:note.value}; markDirty(); };
    const ci=row.querySelector("[data-cam]"); ci.onchange=()=>{ const fs=[...ci.files]; ci.value=""; if(fs.length) uploadPhotos(key,fs,row); };
    bindThumbs(row.querySelector(".phs"),key); });
  hydrate(Object.values(S.form.items).flatMap(photosOf));
  $$("[data-allok]").forEach(b=>b.onclick=()=>{ const s=SECTIONS.find(x=>x.k===b.dataset.allok);
    s.items.forEach((_,i)=>{const key=s.k+"_"+i; if(!S.form.items[key]?.s){ S.form.items[key]={...(S.form.items[key]||{}),s:"ok"}; root.querySelector(`[data-it="${key}"] .seg .ok`).classList.add("on"); }});
    markDirty(); renderParts(); toast("Item yang belum ditanda → OK"); });
  $$("[data-ak]").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>{ const k=g.dataset.ak; S.form.akhir[k]=S.form.akhir[k]===b.dataset.v?"":b.dataset.v; g.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x.dataset.v===S.form.akhir[k])); markDirty(); }));
  $$("[data-g]").forEach(b=>b.onclick=()=>{ S.form.grade=S.form.grade===b.dataset.g?"":b.dataset.g; $$("[data-g]").forEach(x=>x.classList.toggle("on",x.dataset.g===S.form.grade)); markDirty(); });
  $$("[data-j]").forEach(b=>b.onclick=()=>{ const el=b.dataset.j==="sec9"?$("#sec9"):b.dataset.j==="secK"?$("#secK"):root.querySelector(`[data-sec="${b.dataset.j}"]`); el.classList.remove("closed"); el.scrollIntoView({behavior:"smooth",block:"start"}); });
  $("#sv").onclick=()=>save(false); $("#sb").onclick=()=>save(true);
}
function renderParts(){
  const box=$("#partsBox"); if(!box||!S.form) return; const f=S.form;
  const have=new Set(f.parts.map(p=>(p.nama||"").toLowerCase())), sug=[];
  SECTIONS.forEach(s=>s.items.forEach((nm,i)=>{ if(f.items[s.k+"_"+i]?.s==="ng"&&!have.has(nm.toLowerCase())) sug.push([s.k,nm]); }));
  box.innerHTML=`${sug.length?`<p class="mute">Item NG — tekan untuk tambah sebagai barang:</p><div class="sugg">${sug.map(([k,nm])=>`<button data-sk="${k}" data-sn="${esc(nm)}">+ ${esc(nm)}</button>`).join("")}</div>`:""}
  <div class="parts">${f.parts.map((p,i)=>`<div class="part" data-pi="${i}"><div class="pr1">
    <div class="fld"><label>Barang / kerja</label><input class="field" data-pk="nama" value="${esc(p.nama)}" placeholder="cth: Brake pad depan"></div>
    <div class="fld bhg"><label>Bahagian</label><select class="field" data-pk="bhg">${BHG.map(([k,t])=>`<option value="${k}" ${p.bhg===k?"selected":""}>${esc(t)}</option>`).join("")}</select></div>
    <button class="del" title="Buang">✕</button></div>
    <div class="pr2"><div class="fld"><label>Kuantiti</label><input class="field" data-pk="qty" inputmode="decimal" value="${esc(p.qty??1)}"></div>
    <div class="fld"><label>Harga seunit (RM)</label><input class="field" data-pk="harga" inputmode="decimal" value="${esc(p.harga??"")}" placeholder="0.00"></div>
    <div class="fld"><label>Upah (RM)</label><input class="field" data-pk="upah" inputmode="decimal" value="${esc(p.upah??"")}" placeholder="0.00"></div>
    <div class="tot" data-pt>${RM(partTotal(p))}</div></div></div>`).join("")}</div>
  ${f.parts.length?"":`<p class="mute">Belum ada barang. Tambah barang yang perlu ditukar atau dibaiki.</p>`}
  <button class="btn alt" id="addPart">+ Tambah barang</button>
  <div class="gtot"><span>Anggaran kos keseluruhan<br><small class="mute">${f.parts.length} barang</small></span><b id="ptotal">${RM(partsTotal(f))}</b></div>`;
  const add=(bhg,nama)=>{ f.parts.push({id:newId(),nama:nama||"",bhg:bhg||"lain",qty:1,harga:"",upah:"",siap:false}); markDirty(); renderParts(); const els=box.querySelectorAll(".part"); els[els.length-1]?.querySelector(`[data-pk='${nama?"harga":"nama"}']`)?.focus(); };
  box.querySelector("#addPart").onclick=()=>add();
  box.querySelectorAll("[data-sk]").forEach(b=>b.onclick=()=>add(b.dataset.sk,b.dataset.sn));
  box.querySelectorAll(".part").forEach(el=>{ const i=+el.dataset.pi;
    el.querySelector(".del").onclick=()=>{ f.parts.splice(i,1); markDirty(); renderParts(); };
    el.querySelectorAll("[data-pk]").forEach(inp=>{ const h=()=>{ if(!S.form||!f.parts[i]) return; f.parts[i][inp.dataset.pk]=inp.value; el.querySelector("[data-pt]").textContent=RM(partTotal(f.parts[i])); $("#ptotal").textContent=RM(partsTotal(f)); markDirty(); }; inp.oninput=h; inp.onchange=h; }); });
}
function updateProg(){
  const f=S.form; if(!f) return; const c=counts(f);
  SECTIONS.forEach(s=>{ const sc=secCounts(f,s), el=root.querySelector(`[data-pg="${s.k}"]`); if(el) el.textContent=`${sc.done}/${sc.total}${sc.ng?" · "+sc.ng+" NG":""}`;
    const jc=root.querySelector(`[data-jc="${s.k}"]`); if(jc){ jc.textContent=`${sc.done}/${sc.total}`; const jb=jc.parentElement; jb.classList.toggle("hasng",sc.ng>0); jb.classList.toggle("done",!sc.ng&&sc.done===sc.total); } });
  const kp=$("#kpg"); if(kp) kp.textContent=f.parts.length+" barang · "+RM(partsTotal(f));
  const jk=$("#jk"); if(jk) jk.textContent=RM(partsTotal(f)).replace(".00","");
  const t=$("#pgt"), b=$("#pgb"); if(t){ t.textContent=`${c.done}/${TOTAL_ITEMS} item · ${c.ng} NG`; b.style.width=(c.done/TOTAL_ITEMS*100)+"%"; }
  const sg=$("#suggest"); if(sg){ let g="A"; const a=f.akhir;
    if(a.banjir==="Confirmed"||a.body==="Major") g="D"; else if(a.enjin==="Repair"||a.gearbox==="Repair"||a.body==="Accident"||a.banjir==="Suspected"||c.ng>=6) g="C"; else if(c.ng>0) g="B";
    sg.innerHTML=c.done?`Cadangan gred berdasarkan jawapan: <b>${g}</b> (${esc(GRADES[g])}). Pemeriksa boleh pilih lain.`:""; }
}
async function save(submit){
  if(S.saving) return; const f=S.form;
  if(!String(f.plat||"").trim()){ toast("Sila isi No. plat dahulu"); return; }
  if(submit){ const c=counts(f), miss=[];
    if(c.done<TOTAL_ITEMS) miss.push(`${TOTAL_ITEMS-c.done} item belum ditanda`);
    AKHIR.forEach(a=>{ if(!f.akhir[a.k]) miss.push(a.t+" belum dipilih"); });
    if(!f.grade) miss.push("Gred belum dipilih");
    const ngNo=Object.values(f.items).filter(v=>v.s==="ng"&&!(v.n||"").trim()).length; if(ngNo) miss.push(`${ngNo} item NG tiada catatan`);
    if(!String(f.pemeriksa||"").trim()) miss.push("Nama pemeriksa kosong");
    if(miss.length){ const m=modal(`<h3>Belum lengkap</h3><p>${miss.map(x=>"• "+esc(x)).join("<br>")}</p><p>Hantar juga?</p><div class="row end"><button class="sm" id="n">Semak semula</button><button class="sm go" id="y">Hantar juga</button></div>`);
      m.querySelector("#n").onclick=()=>m.remove(); m.querySelector("#y").onclick=()=>{m.remove();doSave(true);}; return; } }
  doSave(submit);
}
async function doSave(submit){
  const f=S.form; S.saving=true; $$(".savebar button").forEach(b=>b.disabled=true);
  const body=bodyOf(f), status=submit?"hantar":(f.status==="ulang"?"ulang":(f.status==="lulus"?"lulus":"draf"));
  const row={vehicle_id:f.vehicle_id?String(f.vehicle_id):null, plate:body.plat, car:body.jenis, status:submit?"hantar":status, grade:body.grade||null, kos:partsTotal(body), data:body};
  let res;
  if(f.id) res=await S.client.from("checklist_inspections").update(row).eq("id",f.id).select().single();
  else res=await S.client.from("checklist_inspections").insert(row).select().single();
  S.saving=false;
  if(res.error){ $$(".savebar button").forEach(b=>b.disabled=false); toast("Gagal simpan: "+res.error.message); return; }
  if(!f.id&&f.vehicle_id) lsSet("abedin_ck_draft_"+f.vehicle_id,null);
  if(body.pemeriksa) lsSet("abedin_nama",body.pemeriksa);
  const rec=fromRow(res.data); S.rows=[rec,...S.rows.filter(x=>x.id!==rec.id)];
  S.dirty=false; toast(submit?"Dihantar untuk semakan ✓":"Draf disimpan ✓"); go("detail",rec.id);
}

/* ---------- PDF summary dialog ---------- */
function summaryDialog(){
  const t=today(), f=t.slice(0,8)+"01";
  const m=modal(`<h3>Laporan PDF ringkasan</h3><p class="mute">Pilih tempoh tarikh pemeriksaan.</p>
  <div class="opts"><button data-p="m">Bulan ini</button><button data-p="lm">Bulan lepas</button><button data-p="7">7 hari</button><button data-p="all">Semua</button></div>
  <div class="two"><div><label>Dari</label><input class="field" type="date" id="pf" value="${f}"></div><div><label>Hingga</label><input class="field" type="date" id="pt" value="${t}"></div></div>
  <div class="row end"><button class="sm" id="c">Batal</button><button class="sm go" id="y">Muat turun PDF</button></div>`);
  const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  m.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ const now=new Date(); let a="",z=t;
    if(b.dataset.p==="m") a=f; else if(b.dataset.p==="lm"){ a=iso(new Date(now.getFullYear(),now.getMonth()-1,1)); z=iso(new Date(now.getFullYear(),now.getMonth(),0)); }
    else if(b.dataset.p==="7") a=iso(new Date(now.getTime()-6*864e5)); else { a=""; z=""; }
    m.querySelector("#pf").value=a; m.querySelector("#pt").value=z; m.querySelectorAll("[data-p]").forEach(x=>x.classList.toggle("on",x===b)); });
  m.querySelector("#c").onclick=()=>m.remove();
  m.querySelector("#y").onclick=e=>withBusy(e.target,async()=>{ await pdfSummary(m.querySelector("#pf").value,m.querySelector("#pt").value); m.remove(); });
}

/* ---------- mount ---------- */
export function mountChecklist(host,ctx){
  S.client=ctx.client; S.profile=ctx.profile||null; S.vehicles=Array.isArray(ctx.vehicles)?ctx.vehicles:[];
  root=host.shadowRoot||host.attachShadow({mode:"open"});
  root.innerHTML=`<style>${CSS}</style><div class="shell"><div class="wrap" id="app"></div></div><div class="toast" id="toast"></div>`;
  app=root.getElementById("app");
  S.client.auth.getUser().then(({data})=>{ S.myId=data?.user?.id||null; if(S.view==="detail") render(); }).catch(()=>{});
  if(ctx.vehicleId){ S.view="kereta"; }
  if(!S.loaded||ctx.reload!==false){ S.loaded=false; render(); load().then(()=>{ if(ctx.vehicleId) openForCar(ctx.vehicleId); }); }
  else { render(); if(ctx.vehicleId) openForCar(ctx.vehicleId); }
}
