// Abe Din Auto – modul Kehadiran: punch masuk/rehat/balik dengan selfie + lokasi GPS, syif & jadual, cuti umum,
// kelulusan OT/lewat/tuntutan punch, papan langsung, kalendar, laporan PDF dan gaji.
// Dimuat oleh app.html melalui import('./js/kehadiran.js'). Jadual & fungsi: V71_KEHADIRAN.sql + V79_KEHADIRAN_PRO.sql.
// Masa punch diambil dari server; jarak ke lokasi tag disemak semula di server.
const CSS = `
.settings-panel[hidden],[hidden].settings-panel{display:none!important}
.kset{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:start}
.kset-side{display:flex;flex-wrap:wrap;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:8px}
.kset-si{display:flex;align-items:center;gap:8px;width:auto;flex:0 0 auto;text-align:left;background:transparent;border:0;border-radius:11px;padding:9px 13px;color:var(--fg);cursor:pointer;font:inherit}
.kset-si:hover{background:var(--soft)}
.kset-si b{font-size:13.5px;font-weight:650;display:block;white-space:nowrap}.kset-si small{display:none}
.kset-si .kset-sic{width:24px;height:24px;flex:none;display:grid;place-items:center;color:var(--mute)}
.kset-si svg{width:21px;height:21px}
.kset-si.on{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;box-shadow:0 8px 22px rgba(124,58,237,.35)}
.kset-si.on .kset-sic{color:#fff}
.kset-main{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;min-width:0}
.kset-main>.ap{margin-top:4px}
.kset-main .card{background:transparent;border-color:var(--line)}
.kset-h{display:flex;align-items:center;gap:14px;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--line)}
.kset-h h2{margin:0;font-size:22px;letter-spacing:-.02em}.kset-h p{margin:2px 0 0;color:var(--mute);font-size:13.5px}
.kset-hic{width:44px;height:44px;flex:none;display:grid;place-items:center;border-radius:12px;color:var(--fg)}
.kset-hic[style]{background:var(--c);color:#fff}
.kset-hic svg{width:30px;height:30px}.kset-hic[style] svg{width:24px;height:24px}
.kset-back{margin-left:auto;background:transparent;border:1px solid var(--line);color:var(--fg);border-radius:12px;padding:9px 14px;font:inherit;font-weight:650;cursor:pointer;white-space:nowrap}
.kset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.kset-card{display:flex;align-items:center;gap:14px;text-align:left;background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:16px;color:var(--fg);cursor:pointer;font:inherit;min-width:0;transition:border-color .15s,transform .15s}
.kset-card:hover{border-color:color-mix(in srgb,var(--fg) 30%,transparent);transform:translateY(-1px)}
.kset-cic{width:52px;height:52px;flex:none;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,color-mix(in srgb,var(--c) 92%,#fff),var(--c));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.kset-cic svg{width:26px;height:26px}
.kset-ct{flex:1;min-width:0}.kset-ct b{display:block;font-size:16px;font-weight:750}.kset-ct small{display:block;color:var(--mute);font-size:12.5px;margin-top:3px;line-height:1.35}
.kset-chev{font-size:24px;color:var(--mute);flex:none}
@container (max-width:860px){.kset-side{flex-wrap:nowrap;overflow-x:auto;padding:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.kset-side::-webkit-scrollbar{display:none}.kset-si{padding:9px 12px}.kset-si b{font-size:13px}}
@container (max-width:620px){.kset-grid{grid-template-columns:1fr}.kset-main{padding:14px}.kset-h h2{font-size:19px}.kset-back{padding:7px 10px;font-size:13px}.kset-card{padding:13px}.kset-cic{width:46px;height:46px}}
.settings-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.settings-tile{display:flex;align-items:center;gap:12px;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;cursor:pointer;min-width:0}.settings-tile:hover{border-color:var(--pri)}.settings-tile .grow{min-width:0}.settings-tile .mute{display:block}.settings-icon{color:var(--pri);font-size:22px}.settings-panel{display:flex;flex-direction:column;gap:12px;min-width:0}.settings-panel [hidden]{display:none!important}.settings-panel .loc{flex-wrap:wrap}.settings-panel .loc .grow{min-width:130px}@media(max-width:600px){.settings-nav{grid-template-columns:1fr}}

:host{display:block;container-type:inline-size;--bg:#0a0a09;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;
  --pri:#e8b10b;--pri-fg:#141000;--ok:#4ac27a;--bad:#e5534b;--warn:#f0a020;--blue:#6ea8fe;
  --f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{background:var(--bg);color:var(--fg);font:15px/1.45 var(--f);padding:14px max(14px,env(safe-area-inset-left,0px)) 56px}
.wrap{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:24px;font-weight:800;letter-spacing:-.015em}h2{margin:0;font-size:18px;font-weight:700}h3{margin:0;font-size:16px;font-weight:700}
button,input,select{font:inherit;color:inherit}
.mute{color:var(--mute);font-size:13.5px}
.tabs{display:flex;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px;overflow-x:auto}
.tabs button{flex:1;border:0;background:none;color:var(--mute);font-weight:600;padding:10px 12px;border-radius:999px;cursor:pointer;white-space:nowrap}
.tabs button[aria-pressed=true]{background:var(--pri);color:var(--pri-fg)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0}
.r{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.r>*{min-width:0}
.grow{flex:1}
.btn{border:0;border-radius:14px;padding:14px;font-weight:800;font-size:16px;cursor:pointer;background:var(--pri);color:var(--pri-fg);width:100%}
.btn.out{background:#2b2a26;color:var(--fg);border:2px solid var(--pri)}
.btn.alt{background:var(--soft);color:var(--fg)}.btn.bad{background:var(--bad);color:#fff}
.btn:disabled{opacity:.55;cursor:default}
.sm{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:7px 12px;cursor:pointer;font-size:13.5px;font-weight:600}
.sm.go{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}.sm.bad{color:var(--bad);border-color:#e5534b66;background:transparent}
label{display:block;font-size:12.5px;color:var(--mute);margin-bottom:4px}
.field{width:100%;border:1px solid var(--line);background:var(--soft);border-radius:11px;padding:10px 12px;min-width:0}
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.g2>*,.g3>*{min-width:0}
input[type=time].field,input[type=date].field,input[type=month].field,input[type=datetime-local].field{-webkit-appearance:none;appearance:none;min-height:42px;text-align:left}
@media (max-width:520px){.g3{grid-template-columns:repeat(2,minmax(0,1fr))}}
.chip{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--soft);white-space:nowrap}
.chip.ok{background:#1d3a28;color:#8be0aa}.chip.bad{background:#3e1b19;color:#ff9a93}.chip.warn{background:#3d2d0c;color:#ffcc66}.chip.blue{background:#16253d;color:#a9c8ff}.chip.pri{background:var(--pri);color:var(--pri-fg)}
.clock{font-size:44px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
@media (max-width:640px){
.shell{font-size:13.5px;padding:6px 0 76px}.wrap{gap:10px}
h1{font-size:19px}h2{font-size:16px}h3{font-size:14.5px}
.tabs{padding:3px}.tabs button{font-size:12.5px;padding:7px 10px}
.card{padding:12px;border-radius:14px;gap:9px}
.clock{font-size:34px}.status{font-size:13px}
.btn{font-size:14.5px;padding:11px;border-radius:12px}
.sm{font-size:12.5px;padding:6px 10px}
.tiles{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px}.tile{padding:8px 10px}.tile b{font-size:19px}.tile small{font-size:11px}
.chip{font-size:11px;padding:2px 8px}.mute{font-size:12.5px}
.field{padding:9px 11px}label{font-size:11.5px}
table{font-size:12.5px}th,td{padding:6px 5px}
}
.status{font-size:15px}
.pl{display:flex;flex-direction:column;gap:8px}
.p{display:flex;gap:12px;align-items:center;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:8px;cursor:pointer;text-align:left;width:100%}
.p img,.p .noimg{width:52px;height:52px;border-radius:10px;object-fit:cover;background:#222;flex:none}
.p .noimg{display:grid;place-items:center;color:var(--mute);font-size:20px}
.p b{font-variant-numeric:tabular-nums}
.p .meta{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.p .meta .r{justify-content:flex-start;gap:6px}
.staff{display:flex;flex-direction:column;gap:10px}
.card.hday{display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 18px;text-align:left}.hday-l{flex:1 1 180px}.hday-l h3{margin:0}
.hday-m{display:flex;gap:10px;flex-wrap:wrap}.hday-m>div{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:8px 14px;min-width:140px}.hday-m small{display:block;color:var(--mute);font-size:11.5px}.hday-m b{font-size:18px}.hday-m b.neg,.neg{color:#f87171}
.hday-r{display:flex;align-items:center;gap:6px}.hday-r .field{max-width:170px;margin:0}
.hcard{gap:12px}.hhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.hname h3{margin:0 0 2px}.hhead .chip{flex:0 0 auto}
.hstats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}.hs{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:6px 3px;text-align:center;min-width:0}.hs small{display:block;font-size:11px;color:var(--mute);white-space:nowrap}.hs b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.hs b i{font-style:normal;font-size:10px;margin-left:2px;opacity:.75}.hs.bad{border-color:rgba(248,113,113,.45);background:rgba(248,113,113,.09)}.hs.bad b{color:#f87171}.hs.blue b{color:#60a5fa}
.hpay{border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:2px;border:1px solid var(--line)}.hpay small{font-size:11.5px;color:var(--mute)}.hpay b{font-size:22px;letter-spacing:-.02em}.hpay span{font-size:12.5px}.hpay em{font-style:normal;color:#f87171;font-weight:700}.hpay .hn{color:var(--mute);font-size:11.5px}
.hpay.none{background:var(--soft)}.hpay.none b{color:var(--mute)}.hpay.ok{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.35)}.hpay.ok b{color:#4ade80}.hpay.cut{background:rgba(248,113,113,.07);border-color:rgba(248,113,113,.35)}.hpay.cut b{color:#fbbf24}.hpay.wait{background:rgba(96,165,250,.08);border-color:rgba(96,165,250,.35)}.hpay.wait b{color:#93c5fd}
.hpunch summary{cursor:pointer;font-weight:700;font-size:13px;color:var(--mute);padding:2px 0}.hpunch[open] summary{margin-bottom:8px}
.hact{display:flex;gap:8px;flex-wrap:wrap}

.num{font-variant-numeric:tabular-nums;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
th{color:var(--mute);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.tw{overflow-x:auto;margin:0 -4px}
.kv{display:grid;grid-template-columns:1fr auto;gap:4px 12px;font-size:14px}.kv span:nth-child(even){text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.kv .tot{font-weight:800;font-size:17px;color:var(--pri);border-top:1px solid var(--line);padding-top:6px}
.big{font-size:26px;font-weight:800;color:var(--pri);font-variant-numeric:tabular-nums}
.ov{color:var(--fg);font:15px/1.45 var(--f);position:fixed;inset:0;background:#000c;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:0}
@media (min-width:640px){.ov{align-items:center;padding:20px}}
.sheet{background:var(--card);border:1px solid var(--line);border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:94vh;max-height:94dvh;overflow:auto;-webkit-overflow-scrolling:touch;padding:16px 16px max(16px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px}
@media (min-width:640px){.sheet{border-radius:20px}}
.cam{position:relative;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:3/4;height:46vh;height:min(46dvh,560px);width:auto;max-width:100%;align-self:center;margin:0 auto;flex:0 0 auto}
#acts,.sheet .g2:last-child{position:sticky;bottom:0;background:var(--card);padding-top:6px;z-index:2}
.cam video,.cam img{width:100%;height:100%;object-fit:cover;display:block}
.cam video{transform:scaleX(-1)}
.gps{font-size:13.5px;padding:10px 12px;border-radius:12px;background:var(--soft);border:1px solid var(--line)}
.gps.ok{border-color:#3fbf7366}.gps.bad{border-color:#e5534b88}
.map{width:100%;height:220px;border:0;border-radius:12px;background:#222}
.ph-big{width:100%;border-radius:14px;display:block;background:#222}
.toast{font:700 15px/1.4 var(--f);position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#f4efe2;color:#141000;padding:10px 16px;border-radius:12px;font-weight:700;z-index:60;max-width:90vw;box-shadow:0 10px 30px #0008}
.days{display:flex;gap:6px;flex-wrap:wrap}.days label{display:flex;align-items:center;gap:5px;margin:0;font-size:14px;color:var(--fg);background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:6px 10px;cursor:pointer}
.sw{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--fg);margin:0;cursor:pointer}
.sw input{width:20px;height:20px;accent-color:var(--pri)}
.notice{padding:10px 12px;border-radius:12px;font-size:13.5px;background:#3d2d0c;color:#ffd890}
.notice.err{background:#3e1b19;color:#ffb3ad}
.loc{display:flex;gap:10px;align-items:center;justify-content:space-between;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
details summary{cursor:pointer;color:var(--pri);font-weight:700;font-size:14px}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #ffd24a;outline-offset:2px}
.badge{display:inline-block;background:#e5534b;color:#fff;border-radius:999px;font-size:11px;font-weight:800;padding:1px 7px;margin-left:4px;vertical-align:1px}
.chip.pur{background:#2a1a3a;color:#d6a8ff}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.tile{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--soft)}.tile small{color:var(--mute);font-size:12px;display:block}.tile b{font-size:24px;font-variant-numeric:tabular-nums}
.t-g{background:#10261a;border-color:#1f4a31}.t-y{background:#2a2410;border-color:#4a3f14}.t-b{background:#101f2e;border-color:#1d3a57}.t-p{background:#1f1529;border-color:#3d2a52}.t-r{background:#2a1212;border-color:#5a2420}
.brow{display:flex;gap:10px;align-items:center;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px 12px;cursor:pointer;text-align:left;width:100%;color:var(--fg)}
.dot{width:10px;height:10px;border-radius:50%;background:#555;flex:none}.dot.ok{background:var(--ok)}.dot.bad{background:var(--bad)}.dot.blue{background:var(--blue)}.dot.pur{background:#b07cf0}
.wkrow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.wk{border:1px solid var(--line);border-radius:10px;padding:6px 4px;text-align:center;font-size:12px;display:flex;flex-direction:column;gap:2px;background:var(--soft)}
.wk b{font-size:12px}.wk.rest{opacity:.55}.wk.ph{background:#1f1529;border-color:#3d2a52}
@media (max-width:520px){.wkrow{grid-template-columns:repeat(4,1fr)}}
td.wrap{white-space:normal;min-width:160px}
.legend{display:flex;flex-wrap:wrap;gap:6px;font-size:12px}.legend span{padding:3px 8px;border-radius:8px;border:1px solid var(--line)}
table.mx{font-size:12px;border-collapse:separate;border-spacing:2px}
table.mx th,table.mx td{padding:0;border:0;text-align:center;min-width:26px;height:28px}
table.mx thead th{font-size:11px;color:var(--mute);line-height:1.1}table.mx thead th span{font-size:10px}
table.mx th.nm{text-align:left;min-width:120px;max-width:150px;white-space:normal;padding:2px 6px 2px 0;font-size:12.5px;color:var(--fg);text-transform:none;letter-spacing:0;font-weight:700;position:sticky;left:0;background:var(--card);z-index:1}
table.mx th.nm .mute{font-size:10.5px;font-weight:500}
table.mx td{border-radius:6px;font-weight:800;font-size:11px;cursor:pointer;background:#1b1a16}
table.mx th.ph{color:#d6a8ff}table.mx .td{outline:2px solid var(--pri);outline-offset:-2px}
.c-ok{background:#183d27!important;color:#8be0aa}.c-late{background:#4a3410!important;color:#ffcc66}.c-abs{background:#4a1a18!important;color:#ff9a93}
.c-cuti{background:#16304f!important;color:#a9c8ff}.c-tg{background:#4a3a10!important;color:#ffd890}.c-umum{background:#2f1d47!important;color:#d6a8ff}
.c-rest{background:#14130f!important;color:#6e685b}.c-rest.h{color:#e6d9b0}.c-warn{background:#4a3410!important;color:#ffcc66}
table.ros{font-size:12.5px}table.ros th.nm{white-space:normal;min-width:110px;text-transform:none;letter-spacing:0;color:var(--fg);font-size:13px}
table.ros td{padding:4px 3px}table.ros td.rest select{opacity:.65}table.ros td.ph select{border-color:#3d2a52}table.ros th.ph{color:#d6a8ff}
.rs{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:6px 4px;font-size:12px;max-width:110px}
.er{display:grid;grid-template-columns:1.2fr 1fr 40px auto;gap:8px;align-items:center}
.er .th{width:40px;height:40px;border-radius:8px;object-fit:cover;background:#222;display:grid;place-items:center;color:var(--mute)}
.sw-dot{width:14px;height:14px;border-radius:4px;flex:none}
.shrow{display:flex;align-items:center;gap:10px;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.shrow.on{border-color:var(--pri);box-shadow:0 0 0 2px #e8b10b33}.shrow .grow{min-width:0}.shrow .acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.shlist{display:flex;flex-direction:column;gap:8px}
td.who{white-space:normal;min-width:120px;font-weight:600}td.act{white-space:nowrap;text-align:right}td.act .sm{margin-left:4px}
.ap{display:grid;grid-template-columns:1fr;gap:14px;align-items:start}
@media (min-width:980px){.ap{grid-template-columns:1fr 1fr}.ap>.full{grid-column:1/-1}.pl.cols2{display:grid;grid-template-columns:1fr 1fr;gap:8px}}
.otin{width:76px;padding:6px 8px}
.pd{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px 12px;align-self:start}
.col{display:flex;flex-direction:column;gap:14px;min-width:0}
.ps-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.ps-warn{color:#f0a35e}
.ps-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.ps-tools .field{flex:1 1 200px;margin:0}
.ps-list{display:grid;gap:8px}@media (min-width:980px){.ps-list{grid-template-columns:1fr 1fr}}
.ps-item{padding:0!important;overflow:hidden}.ps-item[hidden]{display:none}
.ps-item>summary{list-style:none;display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer}.ps-item>summary::-webkit-details-marker{display:none}
.ps-item>form{padding:0 12px 12px}
.ps-item.unset{border-color:#8a5a2b}
.ps-av{flex:0 0 42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;background:var(--line);color:var(--fg)}
.ps-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}.ps-name{font-size:15px;line-height:1.25}
.ps-chips{display:flex;flex-wrap:wrap;gap:5px}
.ps-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:3px 9px;border-radius:999px;border:1px solid var(--line);color:var(--mute,#9aa)}
.ps-chip i{width:8px;height:8px;border-radius:50%;display:inline-block}
.ps-chip.gold{color:#d7b468;border-color:#6b5a32;font-weight:700}.ps-chip.red{color:#f08a72;border-color:#7a3328;font-weight:700}
.ps-chev{font-size:22px;color:var(--mute,#888);transition:transform .2s}.ps-item[open] .ps-chev{transform:rotate(90deg)}
.ps-sec{font-weight:700;font-size:13px;margin-top:6px;padding-top:10px;border-top:1px solid var(--line)}.ps-sec:first-child{border-top:0;padding-top:0;margin-top:0}
.ap>*{min-width:0}
`;

const DAYS = ["Ahad","Isnin","Selasa","Rabu","Khamis","Jumaat","Sabtu"];
const PAY_LABEL = { daily:"Harian", hourly:"Sejam", monthly:"Bulanan" };
const KL = 8 * 3600000;
const BUCKET = "attendance-selfies";

let root, app;
const S = { settingsMenu:"", locEdit:null, client:null, profile:null, me:null, owner:false, tab:"punch", tabSet:false, settings:null, locs:[], pay:{}, staff:[], punches:[],
  shifts:[], astaff:{}, roster:{}, holidays:{}, flags:{}, requests:[], adv:[], leaves:[], claims:[],
  day:"", month:"", week:"", urls:{}, loaded:false, err:"", clockT:null, payOpen:{} };

/* ---------- utiliti ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const rm = n => "RM" + (Math.round((+n || 0) * 100) / 100).toLocaleString("en-MY", { minimumFractionDigits:2, maximumFractionDigits:2 });
const klDate = t => new Date(new Date(t).getTime() + KL);                          // guna getUTC* selepas ini
const dayKey = t => klDate(t).toISOString().slice(0, 10);
const nowKey = () => dayKey(Date.now());
const monthKey = t => dayKey(t).slice(0, 7);
const minOfDay = t => { const d = klDate(t); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
const hm = t => { const d = klDate(t); let h = d.getUTCHours(), m = d.getUTCMinutes(); const ap = h < 12 ? "AM" : "PM"; h = h % 12 || 12; return `${h}:${String(m).padStart(2,"0")} ${ap}`; };
const fmtMin = m => { m = Math.round(m || 0); const h = Math.floor(m / 60), r = m % 60; return h ? `${h}j ${r}m` : `${r}m`; };
const tMin = s => { const [h, m] = String(s || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
const dayLabel = k => { const d = new Date(k + "T00:00:00Z"); return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}`; };
const dow = k => new Date(k + "T00:00:00Z").getUTCDay();
const klIso = (dateK, hhmm) => new Date(Date.parse(`${dateK}T${hhmm}:00Z`) - KL).toISOString();   // masa KL -> ISO UTC
const toLocalInput = t => { const d = klDate(t).toISOString(); return d.slice(0, 16); };
const fromLocalInput = v => new Date(Date.parse(v + ":00Z") - KL).toISOString();
const distM = (a, b, c, d) => { const R = 6371000, r = x => x * Math.PI / 180; const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const mapUrl = (lat, lng) => { const d = 0.0025; return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`; };
const gmaps = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
const nameOf = id => (S.staff.find(s => s.id === id) || {}).full_name || (id === S.me ? (S.profile?.full_name || "Saya") : "Staff");
const $ = s => root.querySelector(s);
function toast(m) { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; root.appendChild(t); setTimeout(() => t.remove(), 3200); }
function errMsg(e) { const m = e?.message || String(e); return /attendance_|relation .* does not exist|schema cache/i.test(m) ? "Pangkalan data kehadiran belum dipasang (V71)." : m; }
function sheet(html) { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = `<div class="sheet">${html}</div>`; o.addEventListener("click", e => { if (e.target === o) closeSheet(o); }); root.appendChild(o); document.documentElement.classList.add("ada-sheet-open"); return o; }
function closeSheet(o) { o?.__cleanup?.(); o?.remove(); if (!root.querySelector(".ov")) document.documentElement.classList.remove("ada-sheet-open"); }
const individualLocations = sid => S.astaff?.[sid]?.allowed_location_ids ?? null;
const anywhereAllowed = (sid=S.me) => S.astaff?.[sid]?.allow_punch_anywhere===true;
function allowedLocations(sid=S.me){if(anywhereAllowed(sid))return [];const ids=individualLocations(sid);return S.locs.filter(l=>l.active&&(ids===null||ids.includes(l.id)));}
function nearest(lat,lng){let best=null;for(const l of allowedLocations()){const d=distM(lat,lng,l.lat,l.lng),inside=d<=l.radius_m;if(!best||(inside&&!best.inside)||(inside===best.inside&&d<best.d))best={...l,d,inside};}return best;}

/* ---------- data ---------- */
const optional = async q => { const r = await q; return r.error ? [] : (r.data || []); };   // jadual V73+ mungkin belum dipasang
async function loadBase() {
  const c = S.client;
  const [st, lc, py] = await Promise.all([
    c.from("attendance_settings").select("*").eq("id", 1).maybeSingle(),
    c.from("attendance_locations").select("*").order("created_at"),
    S.owner ? c.from("staff_pay").select("*") : c.from("staff_pay").select("*").eq("staff_id", S.me),
  ]);
  for (const r of [st, lc, py]) if (r.error) throw r.error;
  S.settings = { work_start:"09:00", work_end:"18:00", work_days:[0,1,2,3,4,6], grace_min:10, ot_min_minutes:30, ot_offday_all:true, enforce_geofence:true, require_selfie:true,
    ot_require_approval:false, ot_restday_mult:1.33, ot_ph_mult:2, break_min:0, allow_rest_punch:true, ...(st.data || {}) };
  S.locs = lc.data || [];
  S.pay = {}; (py.data || []).forEach(p => S.pay[p.staff_id] = p);
  const own = q => S.owner ? q : q.eq("staff_id", S.me);
  const [adv, lv, cl, sh, as, hol] = await Promise.all([
    optional(own(c.from("staff_advances").select("*").neq("status", "cancelled"))),
    optional(own(c.from("staff_leaves").select("*").eq("status", "approved"))),
    optional(own(c.from("staff_claims").select("*").in("status", ["approved","paid"]))),
    optional(c.from("attendance_shifts").select("*").order("start_time")),
    optional(own(c.from("attendance_staff").select("*"))),
    optional(c.from("attendance_holidays").select("*").order("day")),
  ]);
  S.adv = adv; S.leaves = lv; S.claims = cl; S.shifts = sh;
  S.astaff = {}; as.forEach(a => S.astaff[a.staff_id] = a);
  S.holidays = {}; hol.forEach(h => S.holidays[h.day] = h);
  if (S.owner) {
    const { data, error } = await c.from("profiles").select("id,full_name,role,enabled").order("full_name");
    if (error) throw error; S.staff = data || [];
  } else S.staff = [{ id:S.me, full_name:S.profile?.full_name || "Saya", role:S.profile?.role, enabled:true }];
}
async function loadPunches(fromKey, toKeyExcl) {
  let q = S.client.from("attendance_punches").select("*").gte("punched_at", klIso(fromKey, "00:00")).lt("punched_at", klIso(toKeyExcl, "00:00")).order("punched_at", { ascending:true }).limit(5000);
  if (!S.owner) q = q.eq("staff_id", S.me);
  const { data, error } = await q; if (error) throw error; return data || [];
}
// Jadual (roster) & keputusan Owner untuk julat tarikh
async function loadAux(fromKey, toKeyExcl) {
  const c = S.client, own = q => S.owner ? q : q.eq("staff_id", S.me);
  const [ro, fl] = await Promise.all([
    optional(own(c.from("attendance_roster").select("*").gte("day", fromKey).lt("day", toKeyExcl))),
    optional(own(c.from("attendance_day_flags").select("*").gte("day", fromKey).lt("day", toKeyExcl))),
  ]);
  S.roster = {}; ro.forEach(r => S.roster[r.staff_id + "|" + r.day] = r);
  S.flags = {}; fl.forEach(f => S.flags[f.staff_id + "|" + f.day] = f);
}
async function loadRequests() {
  let q = S.client.from("attendance_requests").select("*").order("created_at", { ascending:false }).limit(200);
  q = S.owner ? q.or(`status.eq.pending,reviewed_at.gte.${new Date(Date.now() - 30 * 864e5).toISOString()}`) : q.eq("staff_id", S.me);
  S.requests = await optional(q);
}
const nextDay = k => new Date(Date.parse(k + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
const addDays = (k, n) => new Date(Date.parse(k + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const weekStart = k => addDays(k, -((dow(k) + 6) % 7));   // Isnin
const monthRange = m => { const [y, mo] = m.split("-").map(Number); const e = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 10); return [m + "-01", e]; };
async function signPhotos(list) {
  const need = [...new Set(list.map(p => p.photo_path).filter(p => p && !S.urls[p]))]; if (!need.length) return;
  try { const { data } = await S.client.storage.from(BUCKET).createSignedUrls(need, 3600); (data || []).forEach(d => { if (d.signedUrl && d.path) S.urls[d.path] = d.signedUrl; }); } catch (e) { console.warn(e); }
  root.querySelectorAll("img[data-ph]").forEach(i => { const u = S.urls[i.dataset.ph]; if (u && i.src !== u) i.src = u; });
}

/* ---------- jadual kerja: syif, hari rehat, cuti umum ---------- */
const shiftById = id => (S.shifts || []).find(x => x.id === id);
const staffUsing = id => Object.values(S.astaff || {}).filter(a => a.shift_id === id).length;
const shiftObj = sh => ({ start:tMin(sh.start_time), end:tMin(sh.end_time), brk:+sh.break_min || 0, name:sh.name, color:sh.color, shiftId:sh.id });
function schedFor(sid, k) {
  const st = S.settings, a = (S.astaff || {})[sid] || {}, r = (S.roster || {})[sid + "|" + k], ph = (S.holidays || {})[k];
  const def = a.shift_id && shiftById(a.shift_id);
  let s = def ? shiftObj(def) : { start:tMin(st.work_start), end:tMin(st.work_end), brk:+st.break_min || 0, name:"Waktu biasa", color:null, shiftId:null };
  const wd = a.work_days && a.work_days.length ? a.work_days : (st.work_days || []);
  let type = wd.includes(dow(k)) ? "work" : "rest";
  if (r) { const sh = r.shift_id && shiftById(r.shift_id); if (sh) { s = shiftObj(sh); type = "work"; } else type = "rest"; }
  const normallyWork = type === "work";
  if (ph) type = "ph";
  return { ...s, type, normallyWork, ph:ph || null, rostered:!!r };
}
const hhmmOf = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const schedText = sc => sc.type === "ph" ? `Cuti umum · ${sc.ph.name}` : sc.type === "rest" ? "Hari rehat" : `${sc.name} ${hhmmOf(sc.start)}–${hhmmOf(sc.end)}${sc.brk ? ` · rehat ${sc.brk}m` : ""}`;

/* ---------- pengiraan kehadiran & gaji ---------- */
function computeDays(punches, staffId, fromKey, toKeyExcl) {
  const st = S.settings;
  const by = {}; punches.filter(p => p.staff_id === staffId).forEach(p => (by[dayKey(p.punched_at)] ||= []).push(p));
  const out = [], today = nowKey();
  for (let k = fromKey; k < toKeyExcl; k = nextDay(k)) {
    const sc = schedFor(staffId, k), list = (by[k] || []).sort((a, b) => a.punched_at.localeCompare(b.punched_at));
    let gross = 0, open = null, firstIn = null, lastOut = null, rest = 0, restOpen = null, restCount = 0;
    const mins = (a, b) => (new Date(b.punched_at) - new Date(a.punched_at)) / 60000;
    for (const p of list) {
      if (p.kind === "in") { if (!open) open = p; if (!firstIn) firstIn = p; }
      else if (p.kind === "rest_start") { if (open && !restOpen) restOpen = p; }
      else if (p.kind === "rest_end") { if (restOpen) { rest += mins(restOpen, p); restOpen = null; restCount++; } }
      else if (open) { gross += mins(open, p); if (restOpen) { rest += mins(restOpen, p); restOpen = null; restCount++; } open = null; lastOut = p; }
    }
    // rehat: ikut punch rehat; jika tiada punch rehat & syif ada rehat, tolak rehat syif bila kerja >= 6 jam
    const autoBreak = !restCount && sc.brk > 0 && gross - rest >= 360 ? sc.brk : 0;
    const worked = Math.max(0, gross - rest - autoBreak), restOver = restCount && sc.brk > 0 && rest > sc.brk + 5 ? rest - sc.brk : 0;
    const present = !!firstIn;
    let late = 0, ot = 0, early = 0;
    if (present && sc.type === "work") {
      const fi = minOfDay(firstIn.punched_at); if (fi - sc.start > (st.grace_min || 0)) late = fi - sc.start;
      if (lastOut && !open) { const lo = minOfDay(lastOut.punched_at); const o = lo - sc.end; if (o >= (st.ot_min_minutes || 0) && o > 0) ot = o; if (lo < sc.end) early = sc.end - lo; }
    } else if (present && sc.type === "rest" && st.ot_offday_all) ot = worked;
    else if (present && sc.type === "ph") ot = worked;
    ot = Math.round(Math.min(ot, worked));
    const f = (S.flags || {})[staffId + "|" + k] || null;
    const lateExcused = late > 0 && !!f?.late_excused;
    let otStatus = null, otPaid = 0;
    if (ot > 0) {
      if (f?.ot_status === "approved") { otStatus = "approved"; otPaid = f.ot_min != null ? Math.min(+f.ot_min, Math.round(worked)) : ot; }
      else if (f?.ot_status === "rejected") otStatus = "rejected";
      else { otStatus = "pending"; otPaid = st.ot_require_approval ? 0 : ot; }
    } else if (f?.ot_status === "approved" && f.ot_min) { otStatus = "approved"; otPaid = Math.min(+f.ot_min, Math.round(worked)); }
    const otKind = sc.type === "work" ? "normal" : sc.type;
    out.push({ key:k, sched:sc, type:sc.type, workday:sc.type === "work", list, present, worked, gross, rest, restCount, autoBreak, restOver,
      late: lateExcused ? 0 : late, lateRaw:late, lateExcused, ot, otPaid, otStatus, otKind, early, open:!!open, onRest:!!restOpen,
      future:k > today || (k === today && !present && minOfDay(Date.now()) < sc.end), regular:Math.max(0, worked - ot), flag:f, firstIn, lastOut, outside:list.some(p => p.inside === false) });
  }
  return out;
}
const mAdd = (m, n) => { const [y, mo] = m.split("-").map(Number), t = y * 12 + mo - 1 + n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const mIdx = (a, b) => { const [y1, m1] = a.split("-").map(Number), [y2, m2] = b.split("-").map(Number); return (y2 - y1) * 12 + (m2 - m1); };
// Potongan advance untuk bulan m (lalai S.month): pelan aktif dalam tempoh potongan; ansuran akhir laras baki sen.
function advanceFor(sid, m = S.month) {
  const out = [];
  for (const a of (S.adv || [])) {
    if (a.staff_id !== sid || a.status !== "active") continue;
    const i = mIdx(a.start_month, m); if (i < 0 || i >= a.months) continue;
    const amt = i === a.months - 1 ? +(+a.amount - (+a.monthly) * (a.months - 1)).toFixed(2) : +a.monthly;
    if (amt > 0) out.push({ amt, n: i + 1, of: a.months, note: a.note, total: +a.amount });
  }
  return out;
}
const LEAVE_NAME = { annual:"Cuti Tahunan", mc:"Cuti Sakit", hosp:"Hospitalisasi", unpaid:"Cuti Tanpa Gaji", paternity:"Cuti Paterniti", maternity:"Cuti Bersalin", emergency:"Cuti Kecemasan", other:"Cuti" };
const LEAVE_CODE = { annual:"CT", mc:"MC", hosp:"HP", unpaid:"TG", paternity:"PT", maternity:"BS", emergency:"CK", other:"C" };
// Peta tarikh → {kind, w}. Cuti separuh hari (satu tarikh, < 1 hari) diberi pemberat 0.5.
function leaveMap(sid) {
  const m = {};
  for (const l of (S.leaves || [])) {
    if (l.staff_id !== sid) continue;
    const w = l.date_from === l.date_to && +l.days < 1 ? +l.days : 1;
    for (let k = l.date_from; k <= l.date_to; k = nextDay(k)) m[k] = { kind: l.kind, w };
  }
  return m;
}
const schedMin = sc => Math.max(0, sc.end - sc.start - sc.brk);
function computePay(days, pay, sid) {
  const st = S.settings, p = pay || { pay_type:"daily", rate:0, ot_rate:0, late_mode:"none", late_rate:0, monthly_workdays:26, allowance:0 };
  const presentDays = days.filter(d => d.present).length;
  const lm = sid ? leaveMap(sid) : {};
  let paidLeave = 0, unpaidLeave = 0, absent = 0, leaveMin = 0;
  for (const d of days) {
    d.leave = null;
    const L = lm[d.key];
    if (L && d.type !== "work") continue;            // cuti jatuh pada hari rehat / cuti umum: tidak dikira
    if (!d.workday || d.future) { if (L) d.leave = L; continue; }
    if (L && !d.present) { d.leave = L; if (L.kind === "unpaid") unpaidLeave += L.w; else { paidLeave += L.w; leaveMin += schedMin(d.sched) * L.w; } if (L.w < 1) absent += 1 - L.w; }
    else if (L && d.present) d.leave = L;
    else if (!d.present) absent++;
  }
  const phDays = days.filter(d => d.type === "ph" && d.sched.normallyWork && !d.future);
  const workedMin = days.reduce((a, d) => a + d.worked, 0), regMin = days.reduce((a, d) => a + d.regular, 0);
  const otRaw = days.reduce((a, d) => a + d.ot, 0), otMin = days.reduce((a, d) => a + d.otPaid, 0);
  const otBy = { normal:0, rest:0, ph:0 }; days.forEach(d => { otBy[d.otKind] = (otBy[d.otKind] || 0) + d.otPaid; });
  const otPendingMin = days.filter(d => d.otStatus === "pending").reduce((a, d) => a + d.ot, 0);
  const lateMin = days.reduce((a, d) => a + d.late, 0), lateCount = days.filter(d => d.late > 0).length, lateExcusedCount = days.filter(d => d.lateExcused).length;
  const openCount = days.filter(d => d.open && d.key < nowKey()).length, restOverCount = days.filter(d => d.restOver > 0).length;
  const rate = +p.rate || 0; let base = 0, baseNote = "", absentDeduct = 0, unpaidDeduct = 0, leavePay = 0, holidayPay = 0;
  if (p.pay_type === "daily") {
    const n = days.filter(d => d.present && (d.type === "work" || (d.type === "rest" && !st.ot_offday_all))).length;
    base = n * rate; baseNote = `${n} hari × ${rm(rate)}`;
    leavePay = paidLeave * rate; holidayPay = phDays.length * rate;
  } else if (p.pay_type === "hourly") {
    const regCap = p.late_mode === "pay_rate" ? days.reduce((a, d) => a + Math.min(d.regular, 480), 0) : regMin;
    base = regCap / 60 * rate; baseNote = `${(regCap / 60).toFixed(2)} jam × ${rm(rate)}${p.late_mode === "pay_rate" ? " (maks 8 jam sehari)" : ""}`;
    leavePay = leaveMin / 60 * rate; holidayPay = phDays.reduce((a, d) => a + schedMin(d.sched), 0) / 60 * rate;
  } else {
    base = rate; absentDeduct = absent * rate / (+p.monthly_workdays || 26); unpaidDeduct = unpaidLeave * rate / (+p.monthly_workdays || 26); baseNote = "Gaji bulanan";
  }
  const or = +p.ot_rate || 0, rM = +st.ot_restday_mult || 1, pM = +st.ot_ph_mult || 1;
  const otPayBy = { normal: otBy.normal / 60 * or, rest: otBy.rest / 60 * or * rM, ph: otBy.ph / 60 * or * pM };
  const otPay = otPayBy.normal + otPayBy.rest + otPayBy.ph;
  // V110: "pay_rate" — gaji maksimum 8 jam sehari; jam kerja kurang daripada 8 jam dikira kekurangan & dipotong ikut kadar gaji seminit.
  const FULL_MIN = 480;
  const dayRateOf = d => p.pay_type === "daily" ? rate : p.pay_type === "monthly" ? rate / (+p.monthly_workdays || 26) : rate / 60 * FULL_MIN;
  const perMinOf = d => dayRateOf(d) / FULL_MIN;
  let shortMin = 0, shortDays = 0, latePayRate = 0;
  if (p.late_mode === "pay_rate") for (const d of days) {
    if (!d.present || d.type !== "work" || d.future || d.open || d.leave) continue;
    let sm = Math.max(0, FULL_MIN - Math.min(d.worked, FULL_MIN));
    if (d.lateExcused) sm = Math.max(0, sm - d.lateRaw);
    sm = Math.round(sm); if (!sm) continue;
    shortMin += sm; shortDays++; latePayRate += sm * perMinOf(d);
  }
  const latePerMin = (p.pay_type === "hourly" ? rate / 60 : p.pay_type === "monthly" ? rate / (+p.monthly_workdays || 26) / FULL_MIN : rate / FULL_MIN);
  const lateDeduct = p.late_mode === "pay_rate" ? latePayRate : p.late_mode === "per_minute" ? lateMin * (+p.late_rate || 0) : p.late_mode === "per_late" ? lateCount * (+p.late_rate || 0) : 0;
  const allowance = +p.allowance || 0;
  const adv = sid ? advanceFor(sid) : [], advDeduct = adv.reduce((t, a) => t + a.amt, 0);
  const claims = sid ? (S.claims || []).filter(x => x.staff_id === sid && x.pay_month === S.month) : [], claimPay = claims.reduce((t, x) => t + +x.amount, 0);
  const net = claimPay + base + leavePay + holidayPay + otPay + allowance - lateDeduct - absentDeduct - unpaidDeduct - advDeduct;
  return { claims, claimPay, adv, advDeduct, paidLeave, unpaidLeave, leavePay, unpaidDeduct, holidayPay, phDays:phDays.length, presentDays, absent, workedMin, regMin,
    otMin, otRaw, otBy, otPayBy, otPendingMin, lateMin, latePerMin, shortMin, shortDays, lateCount, lateExcusedCount, openCount, restOverCount, base, baseNote, otPay, lateDeduct, absentDeduct, allowance, net, pay:p, hasPay:!!pay };
}
// V123: gaji sebenar satu hari (asas + OT − potongan lewat/kurang jam), selari dengan computePay.
function dayPay(d, sid) {
  const pay = S.pay[sid]; if (!pay) return null;
  const st = S.settings, p = pay, rate = +p.rate || 0, FULL = 480, wd = +p.monthly_workdays || 26;
  const res = { base:0, ot:0, ded:0, net:0, short:0, notes:[], pending:false, leave:!!d.leave };
  if (d.future && !d.present) { res.pending = true; return res; }
  if (d.present && d.open) res.pending = true;
  const dayRate = p.pay_type === "daily" ? rate : p.pay_type === "monthly" ? rate / wd : rate / 60 * FULL;
  if (p.pay_type === "daily") { if (d.present && (d.type === "work" || (d.type === "rest" && !st.ot_offday_all))) { res.base = rate; res.notes.push(`Gaji harian ${rm(rate)}`); } else if (d.type === "ph" && d.sched.normallyWork) { res.base = rate; res.notes.push("Cuti umum berbayar"); } }
  else if (p.pay_type === "hourly") { const m = p.late_mode === "pay_rate" ? Math.min(d.regular, FULL) : d.regular; res.base = m / 60 * rate; res.notes.push(`${(m / 60).toFixed(2)} jam × ${rm(rate)}`); }
  else { if (d.workday && (d.present || (d.leave && d.leave.kind !== "unpaid"))) { res.base = dayRate; res.notes.push(`Gaji bulanan ÷ ${wd} hari`); } else if (d.workday && !d.present) res.notes.push("Tidak hadir — tiada gaji"); }
  if (!d.present && d.leave && p.pay_type !== "monthly" && d.leave.kind !== "unpaid" && d.workday) { res.base = p.pay_type === "daily" ? rate * d.leave.w : schedMin(d.sched) * d.leave.w / 60 * rate; res.notes.push("Cuti berbayar"); }
  const or = +p.ot_rate || 0, mult = d.otKind === "rest" ? +st.ot_restday_mult || 1 : d.otKind === "ph" ? +st.ot_ph_mult || 1 : 1;
  res.ot = d.otPaid / 60 * or * mult; if (res.ot) res.notes.push(`OT ${fmtMin(d.otPaid)}`);
  if (d.otStatus === "pending" && !d.otPaid && d.ot) res.notes.push(`OT ${fmtMin(d.ot)} menunggu kelulusan`);
  if (p.late_mode === "pay_rate") {
    if (d.present && d.type === "work" && !d.future && !d.open && !d.leave) { let sm = Math.max(0, FULL - Math.min(d.worked, FULL)); if (d.lateExcused) sm = Math.max(0, sm - d.lateRaw); sm = Math.round(sm); res.short = sm; res.ded = sm * dayRate / FULL; if (sm) res.notes.push(`Kurang ${fmtMin(sm)} daripada 8 jam`); }
  } else if (p.late_mode === "per_minute") { res.ded = d.late * (+p.late_rate || 0); if (d.late) res.notes.push(`Lewat ${fmtMin(d.late)} × ${rm(p.late_rate)}`); }
  else if (p.late_mode === "per_late") { res.ded = d.late > 0 ? +p.late_rate || 0 : 0; if (d.late) res.notes.push("Potongan lewat"); }
  res.net = res.base + res.ot - res.ded;
  res.absent = !d.present && d.workday && !d.leave && !d.future;
  if (res.absent && !res.notes.length) res.notes.push("Tidak hadir — tiada gaji");
  return res;
}
// Cache kiraan sebulan untuk satu render
let monthCache = {};
function staffMonth(sid) {
  if (monthCache[sid]) return monthCache[sid];
  const [a, b] = monthRange(S.month), days = computeDays(S.punches, sid, a, b), c = computePay(days, S.pay[sid], sid);
  return (monthCache[sid] = { days, c });
}

/* ---------- render ---------- */
const KIND = { in:"MASUK", out:"BALIK", rest_start:"REHAT", rest_end:"HABIS REHAT" };
const KIND_LABEL = { in:"Masuk", out:"Balik", rest_start:"Mula rehat", rest_end:"Habis rehat" };
function tabs() {
  const n = (S.requests || []).filter(r => r.status === "pending").length;
  const t = S.owner ? [["papan","Papan"],["punch","Punch"],["today","Harian"],["lulus",`Kelulusan${n ? ` <span class="badge">${n}</span>` : ""}`],["kalendar","Kalendar"],["gaji","Gaji & Laporan"],["tetapan","Tetapan"]]
    : [["punch","Punch"],["rekod","Rekod Saya"]];
  return `<div class="tabs">${t.map(([k, l]) => `<button data-tab="${k}" aria-pressed="${S.tab === k}">${l}</button>`).join("")}</div>`;
}
function render() {
  monthCache = {};
  let h = `<div class="r"><h1>Kehadiran</h1><button class="sm" data-act="reload" title="Muat semula">↻</button></div>${tabs()}`;
  if (S.err) h += `<div class="notice err">${esc(S.err)}</div>`;
  if (!S.loaded) h += `<div class="card"><p class="mute">Memuatkan…</p></div>`;
  else { const v = ({ papan:viewPapan, today:viewToday, gaji:viewGaji, tetapan:viewTetapan, rekod:viewRekod, lulus:viewLulus, kalendar:viewKalendar }[S.tab] || viewPunch)();
    h += v; }
  app.innerHTML = h;
  signPhotos(S.punches);
  tickClock();
}
function punchRow(p, showName) {
  const loc = p.inside == null ? (p.manual ? `<span class="chip blue">Manual</span>` : p.location_name==="Bebas lokasi"?`<span class="chip blue">Bebas lokasi · GPS direkod</span>`:`<span class="chip">Tiada lokasi tag</span>`)
    : p.inside ? `<span class="chip ok">✓ ${esc(p.location_name || "Lokasi")} · ${p.distance_m}m</span>` : `<span class="chip bad">✗ Luar kawasan · ${p.distance_m}m</span>`;
  const kc = p.kind === "in" ? "pri" : p.kind === "out" ? "" : "pur";
  return `<button class="p" data-punch="${esc(p.id)}">${p.photo_path ? `<img data-ph="${esc(p.photo_path)}" src="${esc(S.urls[p.photo_path] || "")}" alt="">` : `<span class="noimg">${p.manual ? "✎" : p.kind.startsWith("rest") ? "☕" : "?"}</span>`}
    <span class="meta"><span class="r"><b>${hm(p.punched_at)}</b><span class="chip ${kc}">${KIND[p.kind] || p.kind}</span>${p.edited_at && !p.manual ? `<span class="chip warn">Diubah</span>` : ""}${showName ? `<span class="mute">${esc(nameOf(p.staff_id))}</span>` : ""}</span>
    <span class="r">${loc}</span></span></button>`;
}
function viewPunch() {
  const today = nowKey(), mine = S.punches.filter(p => p.staff_id === S.me && dayKey(p.punched_at) === today);
  const last = mine[mine.length - 1], st = S.settings, sc = schedFor(S.me, today);
  const firstIn = mine.find(p => p.kind === "in"), onRest = last?.kind === "rest_start", working = last && last.kind !== "out";
  let status = !last ? `<span class="chip">Belum punch masuk</span>` : onRest ? `<span class="chip pur">☕ Sedang rehat sejak ${hm(last.punched_at)}</span>`
    : working ? `<span class="chip ok">● Sedang bekerja sejak ${hm(firstIn?.punched_at || last.punched_at)}</span>` : `<span class="chip blue">Sudah punch balik ${hm(last.punched_at)}</span>`;
  const lateM = firstIn && sc.type === "work" ? minOfDay(firstIn.punched_at) - sc.start : 0;
  const late = lateM > (st.grace_min || 0) ? `<span class="chip bad">Lewat ${fmtMin(lateM)}</span>` : "";
  const noLoc = !allowedLocations().length;
  const btns = onRest ? `<button class="btn" data-act="rest" data-kind="rest_end">☕ Habis rehat</button>`
    : working ? `<button class="btn out" data-act="punch" data-kind="out">📸 Punch Balik</button>${st.allow_rest_punch ? `<button class="btn alt" data-act="rest" data-kind="rest_start">☕ Mula rehat</button>` : ""}`
    : `<button class="btn" data-act="punch" data-kind="in">📸 Punch Masuk</button>`;
  // Ringkasan hanya menggunakan rekod staff sendiri, tanpa mengubah data kehadiran.
  const lastOut = [...mine].reverse().find(p => p.kind === "out");
  const restStarts = mine.filter(p => p.kind === "rest_start");
  const restEnds = mine.filter(p => p.kind === "rest_end");
  // Sasaran kerja bersih maksimum 8 jam (gaji dikira maksimum 8 jam sehari), walaupun syif tersilap tetap rehat 0.
  const scheduledMin = sc.type === "work" ? Math.min(480, Math.max(0, sc.end - sc.start - (sc.brk || 0))) : 0;
  const worked = netWorkedToday(mine, sc);
  // Waktu wajib pulang: 8 jam bersih + sekurang-kurangnya rehat syif.
  // Jika rehat sebenar melebihi peruntukan, waktu pulang dianjak ke depan.
  const requiredLeave = () => {
    if (!firstIn || !scheduledMin || sc.type !== "work") return null;
    let restMs = 0, restAt = null;
    for (const p of mine) {
      const at = new Date(p.punched_at).getTime();
      if (p.kind === "rest_start" && restAt == null) restAt = at;
      else if (p.kind === "rest_end" && restAt != null) { restMs += Math.max(0, at-restAt); restAt = null; }
    }
    if (restAt != null) restMs += Math.max(0, Date.now()-restAt);
    const breakMs = Math.max((sc.brk || 0)*60000, restMs);
    return new Date(new Date(firstIn.punched_at).getTime()+scheduledMin*60000+breakMs);
  };
  const leaveTime = requiredLeave();

  const sumTile = (label, value) => `<div style="min-width:0;padding:12px 8px;border:1px solid var(--line,#39352d);border-radius:13px;background:rgba(255,255,255,.035)"><small class="mute" style="display:block;font-size:12px">${label}</small><b style="display:block;margin-top:7px;font-size:16px">${value}</b></div>`;
  const requiredBreak = sc.brk || 0;
  const actualRest = (() => {
    let total=0, started=null;
    for(const p of mine) {
      const at=new Date(p.punched_at).getTime();
      if(p.kind==="rest_start" && started==null) started=at;
      else if(p.kind==="rest_end" && started!=null) { total+=Math.max(0,at-started); started=null; }
    }
    if(started!=null) total+=Math.max(0,Date.now()-started);
    return Math.floor(total/60000);
  })();
  const extraRest = Math.max(0,actualRest-requiredBreak);
  const summary = `<div class="card" style="border-color:rgba(217,173,54,.25)">
    <div class="r" style="align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><h3 style="margin:0">Ringkasan Hari Ini</h3><span class="chip pri">${dayLabel(today)}</span></div>
    ${leaveTime ? `<div style="margin-top:14px;padding:17px 12px;border:1.5px solid #d9ad36;border-radius:17px;text-align:center;background:linear-gradient(145deg,rgba(217,173,54,.14),rgba(31,48,34,.18))">
      <div style="font-size:14px;font-weight:700">◷ Waktu Wajib Pulang</div>
      <div id="punch-required-leave" style="font-size:clamp(28px,8vw,40px);line-height:1.3;font-weight:900;color:#f1c64c;margin:6px 0">${hm(leaveTime.toISOString())}</div>
      <small id="punch-leave-note" style="color:#d9d1b4">${extraRest ? 'Tambahan rehat '+fmtMin(extraRest)+' · waktu balik dilanjutkan' : 'Cukup '+fmtMin(scheduledMin)+' kerja bersih · rehat '+fmtMin(requiredBreak)}</small>
    </div>` : ""}
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:13px">
      ${sumTile("Punch Masuk", firstIn ? hm(firstIn.punched_at) : "–")}
      ${sumTile("Jumlah Rehat", restStarts.length ? fmtMin(actualRest) : "0m")}
      ${sumTile("Sasaran Kerja Bersih", scheduledMin ? fmtMin(scheduledMin) : "–")}
      ${sumTile("Waktu Balik Asal", sc.type==="work" ? String(sc.end/60|0).padStart(2,"0")+":"+String(sc.end%60).padStart(2,"0") : "–")}
    </div>
    <div style="margin-top:13px;padding:13px;border:1px solid var(--line,#39352d);border-radius:13px">
      <div class="r" style="justify-content:space-between;gap:8px"><b style="font-size:14px">Kemajuan Kerja Bersih</b><b id="punch-percent">${worked.percent == null ? "—" : worked.percent + "%"}</b></div>
      <div style="height:9px;border-radius:9px;background:rgba(255,255,255,.15);overflow:hidden;margin:9px 0"><div id="punch-progress" style="height:100%;width:${worked.percent || 0}%;background:#e5b93b;border-radius:9px"></div></div>
      <small class="mute"><span id="punch-worked">${fmtMin(worked.mins)}</span> / ${scheduledMin ? fmtMin(scheduledMin) : "Tiada syif"} · <span id="punch-worked-note">${workedNote(worked)}</span></small>
    </div>
    <small class="mute" style="display:block;margin-top:11px">Waktu wajib pulang dikemas kini mengikut tempoh rehat sebenar. Punch balik awal akan direkod sebagai kekurangan jam.</small>
  </div>`;
  return `<div class="ap"><div class="col"><div class="card" style="align-items:center;text-align:center">
      <div class="mute">${dayLabel(today)} · ${esc(schedText(sc))}</div>
      <div class="clock" id="clock">--:--</div>
      <div class="status r" style="justify-content:center">${status}${late}</div>
      <div style="display:flex;flex-direction:column;gap:8px;width:100%">${btns}</div>
      <div class="mute">Punch masuk/balik perlu selfie dan GPS. Punch rehat hanya GPS. Masa ikut jam server.</div>
    </div>
    ${anywhereAllowed()?`<div class="mute" style="font-size:12px">📍 Bebas lokasi · GPS tetap direkod ketika punch.</div>`:noLoc ? `<div class="notice">${individualLocations(S.me)!==null ? "Tiada lokasi individu aktif. Hubungi Owner." : S.owner ? "Belum ada lokasi tag. Tambah di tab Tetapan supaya punch disemak ikut kawasan." : "Owner belum menetapkan lokasi kerja."}</div>` : `<div class="mute" style="font-size:12px">📍 Lokasi punch: ${allowedLocations().map(l=>esc(l.name)+" ("+esc(l.radius_m)+" m)").join(" · ")}${!st.enforce_geofence?" · Sekatan GPS tidak aktif":""}</div>`}
    ${summary}</div>
    <div class="col"><div class="card"><h3>Punch saya hari ini</h3>${mine.length ? `<div class="pl">${[...mine].reverse().map(p => punchRow(p, false)).join("")}</div>` : `<p class="mute">Tiada punch lagi hari ini.</p>`}</div></div></div>`;
}
function dayChips(d) {
  return [d.sched.type === "ph" ? `<span class="chip pur">${esc(d.sched.ph.name)}</span>` : "",
    d.leave ? `<span class="chip ${d.leave.kind === "unpaid" ? "warn" : "blue"}">${LEAVE_NAME[d.leave.kind] || "Cuti"}${d.leave.w < 1 ? " (½)" : ""}</span>` : "",
    !d.present && !d.leave && d.workday && !d.future ? `<span class="chip bad">Tidak hadir</span>` : "",
    d.late ? `<span class="chip bad">Lewat ${fmtMin(d.late)}</span>` : "", d.lateExcused ? `<span class="chip">Lewat ${fmtMin(d.lateRaw)} · dimaafkan</span>` : "",
    d.ot ? `<span class="chip ${d.otStatus === "rejected" ? "" : d.otStatus === "pending" && S.settings.ot_require_approval ? "warn" : "blue"}">OT ${fmtMin(d.otStatus === "approved" ? d.otPaid : d.ot)}${d.otKind !== "normal" ? (d.otKind === "ph" ? " · cuti umum" : " · hari rehat") : ""}${d.otStatus === "pending" && S.settings.ot_require_approval ? " · menunggu" : d.otStatus === "rejected" ? " · ditolak" : d.otStatus === "approved" && d.flag ? " ✓" : ""}</span>` : "",
    d.early ? `<span class="chip warn">Balik awal ${fmtMin(d.early)}</span>` : "", d.restOver ? `<span class="chip warn">Rehat lebih ${fmtMin(d.restOver)}</span>` : "",
    d.open ? (d.key < nowKey() ? `<span class="chip warn">Tiada punch balik</span>` : d.onRest ? `<span class="chip pur">Sedang rehat</span>` : `<span class="chip ok">Sedang bekerja</span>`) : "",
    d.type === "rest" && d.present ? `<span class="chip">Hari rehat</span>` : "", d.outside ? `<span class="chip bad">Luar kawasan</span>` : ""].filter(Boolean).join(" ");
}
function dayTable(days, sid, opts = {}) {
  const rows = days.filter(d => d.present || (d.workday && !d.future) || d.type === "ph" || (opts.all && !d.future));
  if (!rows.length) return `<p class="mute">Tiada rekod.</p>`;
  return `<div class="tw"><table><thead><tr><th>Hari</th><th>Masuk</th><th>Rehat</th><th>Balik</th><th class="n">Jam</th>${S.owner ? `<th class="n">Gaji hari</th>` : ""}<th>Catatan</th>${S.owner || opts.claim ? "<th></th>" : ""}</tr></thead><tbody>${rows.map(d => {
    const fi = d.firstIn, lo = d.lastOut;
    const act = S.owner ? `<td><button class="sm" data-act="day" data-staff="${esc(sid)}" data-day="${d.key}">✎</button></td>`
      : opts.claim ? `<td>${(d.open && d.key < nowKey()) || (!d.present && d.workday && !d.leave && !d.future) ? `<button class="sm" data-act="req" data-day="${d.key}">Tuntut punch</button>` : ""}</td>` : "";
    return `<tr><td>${dayLabel(d.key)}${d.sched.type === "work" && d.sched.shiftId ? `<div class="mute" style="font-size:11.5px">${esc(d.sched.name)}</div>` : ""}</td><td>${fi ? hm(fi.punched_at) : "–"}</td><td>${d.rest ? fmtMin(d.rest) : d.autoBreak ? `<span class="mute">${d.autoBreak}m auto</span>` : "–"}</td><td>${lo ? hm(lo.punched_at) : "–"}</td><td class="n">${d.worked ? fmtMin(d.worked) : "–"}</td>${S.owner ? (() => { const dp = dayPay(d, sid); return `<td class="n">${!dp ? "–" : `<b>${rm(dp.net)}</b>${dp.ded ? `<div class="neg" style="font-size:11.5px">−${rm(dp.ded)}</div>` : ""}${dp.ot ? `<div class="mute" style="font-size:11.5px">OT +${rm(dp.ot)}</div>` : ""}`}</td>`; })() : ""}<td class="wrap">${dayChips(d)}</td>${act}</tr>`;
  }).join("")}</tbody></table></div>`;
}
function payBox(c) {
  if (!c.hasPay) return `<p class="mute">Tetapan gaji belum dibuat${S.owner ? " — tetapkan di tab Tetapan." : "."}</p>`;
  const p = c.pay, st = S.settings;
  return `<div class="kv">
    <span>Gaji asas (${PAY_LABEL[p.pay_type]}) <small class="mute">${esc(c.baseNote)}</small></span><span>${rm(c.base)}</span>
    ${c.holidayPay ? `<span>Bayaran cuti umum <small class="mute">${c.phDays} hari</small></span><span>${rm(c.holidayPay)}</span>` : ""}
    ${c.leavePay ? `<span>Bayaran cuti berbayar <small class="mute">${c.paidLeave} hari</small></span><span>${rm(c.leavePay)}</span>` : ""}
    ${c.unpaidDeduct ? `<span>Potongan cuti tanpa gaji <small class="mute">${c.unpaidLeave} hari</small></span><span>−${rm(c.unpaidDeduct)}</span>` : c.unpaidLeave ? `<span>Cuti tanpa gaji <small class="mute">${c.unpaidLeave} hari · tidak dibayar</small></span><span>${rm(0)}</span>` : ""}
    ${c.paidLeave && !c.leavePay ? `<span>Cuti berbayar <small class="mute">${c.paidLeave} hari · tidak dipotong</small></span><span>${rm(0)}</span>` : ""}
    ${c.absentDeduct ? `<span>Potongan tidak hadir <small class="mute">${c.absent} hari</small></span><span>−${rm(c.absentDeduct)}</span>` : ""}
    <span>OT hari biasa <small class="mute">${(c.otBy.normal / 60).toFixed(2)} jam × ${rm(p.ot_rate)}</small></span><span>${rm(c.otPayBy.normal)}</span>
    ${c.otBy.rest ? `<span>OT hari rehat <small class="mute">${(c.otBy.rest / 60).toFixed(2)} jam × ${rm(p.ot_rate)} × ${+st.ot_restday_mult}</small></span><span>${rm(c.otPayBy.rest)}</span>` : ""}
    ${c.otBy.ph ? `<span>OT cuti umum <small class="mute">${(c.otBy.ph / 60).toFixed(2)} jam × ${rm(p.ot_rate)} × ${+st.ot_ph_mult}</small></span><span>${rm(c.otPayBy.ph)}</span>` : ""}
    ${c.otPendingMin && st.ot_require_approval ? `<span class="mute">OT menunggu kelulusan <small>${fmtMin(c.otPendingMin)} · belum dibayar</small></span><span class="mute">–</span>` : ""}
    ${c.allowance ? `<span>Elaun</span><span>${rm(c.allowance)}</span>` : ""}
    ${p.late_mode !== "none" ? `<span>Potongan lewat <small class="mute">${p.late_mode === "pay_rate" ? `kurang jam ${fmtMin(c.shortMin)} (${c.shortDays} hari) × ${rm(c.latePerMin)}/min` : p.late_mode === "per_minute" ? `${Math.round(c.lateMin)} min × ${rm(p.late_rate)}` : `${c.lateCount} kali × ${rm(p.late_rate)}`}${c.lateExcusedCount ? ` · ${c.lateExcusedCount} dimaafkan` : ""}</small></span><span>−${rm(c.lateDeduct)}</span>` : ""}
    ${c.claimPay ? `<span>Tuntutan (claim) <small class="mute">${c.claims.length} resit</small></span><span>${rm(c.claimPay)}</span>` : ""}
    ${c.adv.map(a => `<span>Potongan advance <small class="mute">ansuran ${a.n}/${a.of} · ${rm(a.total)}${a.note ? " · " + esc(a.note) : ""}</small></span><span>−${rm(a.amt)}</span>`).join("")}
    <span class="tot">Jumlah bersih</span><span class="tot">${rm(c.net)}</span></div>`;
}
function statsRow(c) {
  return `<div class="g3"><div><div class="mute">Hadir</div><div class="num">${c.presentDays} hari</div></div><div><div class="mute">Jam kerja</div><div class="num">${fmtMin(c.workedMin)}</div></div><div><div class="mute">Tidak hadir</div><div class="num">${c.absent} hari</div></div>${c.paidLeave || c.unpaidLeave ? `<div><div class="mute">Cuti</div><div class="num">${c.paidLeave} berbayar${c.unpaidLeave ? ` · ${c.unpaidLeave} tanpa gaji` : ""}</div></div>` : ""}
    <div><div class="mute">Lewat</div><div class="num">${c.lateCount} kali · ${fmtMin(c.lateMin)}</div></div><div><div class="mute">OT dibayar</div><div class="num">${fmtMin(c.otMin)}${c.otPendingMin && S.settings.ot_require_approval ? ` <small class="mute">(+${fmtMin(c.otPendingMin)} menunggu)</small>` : ""}</div></div><div><div class="mute">Lupa punch balik</div><div class="num">${c.openCount}</div></div>${c.phDays ? `<div><div class="mute">Cuti umum</div><div class="num">${c.phDays} hari</div></div>` : ""}</div>`;
}
function monthInput() { return `<input type="month" class="field" id="month" value="${esc(S.month)}" style="max-width:200px">`; }
function viewRekod() {
  const { days, c } = staffMonth(S.me);
  const reqs = (S.requests || []).slice(0, 20), RS = { pending:["Menunggu","warn"], approved:["Lulus","ok"], rejected:["Ditolak","bad"] };
  return `<div class="ap"><div class="card"><div class="r"><h3>Rekod bulan</h3>${monthInput()}</div>${statsRow(c)}</div>
    <div class="card"><h3>Anggaran gaji</h3>${payBox(c)}<small class="mute">Anggaran sahaja. Jumlah muktamad disahkan oleh Owner.</small></div>
    <div class="card full"><div class="r"><h3>Harian</h3><button class="sm" data-act="req" data-day="${nowKey()}">+ Tuntut punch tertinggal</button></div>${dayTable(days, S.me, { claim:true })}</div>
    <div class="card full"><h3>Tuntutan punch saya</h3>${reqs.length ? `<div class="pl">${reqs.map(r => `<div class="loc"><div class="grow"><b>${KIND_LABEL[r.kind]} · ${dayLabel(dayKey(r.punched_at))} ${hm(r.punched_at)}</b><div class="mute">${esc(r.reason)}${r.review_note ? ` · Nota Owner: ${esc(r.review_note)}` : ""}</div></div>
      <span class="chip ${RS[r.status][1]}">${RS[r.status][0]}</span>${r.status === "pending" ? `<button class="sm bad" data-act="reqdel" data-id="${esc(r.id)}">Batal</button>` : ""}</div>`).join("")}</div>` : `<p class="mute">Lupa punch? Tekan "Tuntut punch" pada hari berkenaan. Owner akan semak dan luluskan.</p>`}</div></div>`;
}
function activeStaff() { return S.staff.filter(s => s.enabled !== false && (s.role !== "owner" || S.punches.some(p => p.staff_id === s.id) || S.pay[s.id])); }

/* --- Papan langsung (Owner) --- */
function boardStatus(s, k) {
  const ps = S.punches.filter(p => p.staff_id === s.id && dayKey(p.punched_at) === k), last = ps[ps.length - 1];
  const sc = schedFor(s.id, k), L = leaveMap(s.id)[k], d = computeDays(ps, s.id, k, nextDay(k))[0];
  const nowM = minOfDay(Date.now()), isToday = k === nowKey();
  let st;
  if (last) st = last.kind === "rest_start" ? "rehat" : last.kind === "out" ? "balik" : "kerja";
  else if (L && sc.type === "work") st = "cuti";
  else if (sc.type === "ph") st = "umum";
  else if (sc.type === "rest") st = "off";
  else if (isToday && nowM < sc.start + (S.settings.grace_min || 0)) st = "belum";
  else st = "tiada";
  return { s, ps, last, sc, L, d, st };
}
const BOARD = { kerja:["Bekerja","ok"], rehat:["Rehat","pur"], balik:["Sudah balik","blue"], belum:["Belum masuk","" ], tiada:["Belum punch / tidak hadir","bad"], cuti:["Cuti","blue"], umum:["Cuti umum","pur"], off:["Hari rehat",""] };
function viewPapan() {
  const k = nowKey(), list = activeStaff().map(s => boardStatus(s, k));
  const cnt = st => list.filter(x => x.st === st).length, late = list.filter(x => x.d.late > 0).length;
  const order = ["tiada","kerja","rehat","belum","balik","cuti","umum","off"];
  const rows = order.flatMap(o => list.filter(x => x.st === o)).map(x => {
    const fi = x.d.firstIn, lo = x.d.lastOut, [lab, cls] = BOARD[x.st];
    return `<button class="brow" data-act="day" data-staff="${esc(x.s.id)}" data-day="${k}"><span class="dot ${cls}"></span><span class="grow"><b>${esc(x.s.full_name || "Staff")}</b><span class="mute"> · ${esc(x.sc.type === "work" ? `${hhmmOf(x.sc.start)}–${hhmmOf(x.sc.end)}` : schedText(x.sc))}</span>
      <span class="r" style="justify-content:flex-start;gap:6px;margin-top:3px"><span class="chip ${cls}">${lab}${x.L && x.st === "cuti" ? ` · ${LEAVE_NAME[x.L.kind]}` : ""}</span>${fi ? `<span class="chip">Masuk ${hm(fi.punched_at)}</span>` : ""}${lo && x.st === "balik" ? `<span class="chip">Balik ${hm(lo.punched_at)}</span>` : ""}${x.d.late ? `<span class="chip bad">Lewat ${fmtMin(x.d.late)}</span>` : ""}${x.d.outside ? `<span class="chip bad">Luar kawasan</span>` : ""}${x.d.worked ? `<span class="chip">${fmtMin(x.d.worked)}</span>` : ""}</span></span><span class="mute">›</span></button>`;
  }).join("");
  const pend = (S.requests || []).filter(r => r.status === "pending").length;
  const ph = S.holidays[k];
  return `<div class="card"><div class="r"><div><h3>${dayLabel(k)}${ph ? ` · <span style="color:#d6a8ff">${esc(ph.name)}</span>` : ""}</h3><span class="mute">Dikemas kini ${hm(Date.now())} · auto setiap minit</span></div></div>
      <div class="tiles"><div class="tile t-g"><small>Sedang bekerja</small><b>${cnt("kerja")}</b></div><div class="tile t-p"><small>Rehat</small><b>${cnt("rehat")}</b></div><div class="tile t-b"><small>Sudah balik</small><b>${cnt("balik")}</b></div>
        <div class="tile t-r"><small>Belum punch</small><b>${cnt("tiada")}</b></div><div class="tile t-y"><small>Lewat hari ini</small><b>${late}</b></div><div class="tile"><small>Cuti / rehat</small><b>${cnt("cuti") + cnt("umum") + cnt("off")}</b></div></div>
      ${pend ? `<button class="notice" data-tab="lulus" style="border:0;text-align:left;cursor:pointer">${pend} tuntutan punch menunggu kelulusan → Kelulusan</button>` : ""}</div>
    <div class="card"><h3>Staff</h3><div class="pl cols2">${rows || `<p class="mute">Belum ada staff.</p>`}</div></div>`;
}

/* --- Harian (Owner) --- */
function viewToday() {
  const k = S.day, list = activeStaff();
  const cards = list.map(s => {
    const x = boardStatus(s, k), [lab, cls] = BOARD[x.st];
    const d = x.d, dp = dayPay(d, s.id), fi = d.firstIn, lo = d.lastOut;
    const tHm = x => esc(hm(x)).replace(/\s?(AM|PM|PG|PTG|ptg|pg)$/i, '<i>$1</i>');
    const stat = (l, v, c = "") => `<div class="hs ${c}"><small>${l}</small><b>${v}</b></div>`;
    const payTile = !dp ? `<div class="hpay none"><small>Gaji hari ini</small><b>–</b><span>Tetapan gaji belum dibuat</span></div>`
      : `<div class="hpay ${dp.absent || (!d.present && !dp.net) ? "none" : dp.pending ? "wait" : dp.ded > 0 ? "cut" : "ok"}"><small>${dp.pending ? "Gaji setakat ini" : "Gaji sebenar hari ini"}</small><b>${rm(dp.net)}</b>
        <span>${dp.base ? `Asas ${rm(dp.base)}` : "Asas RM0.00"}${dp.ot ? ` · OT +${rm(dp.ot)}` : ""}${dp.ded ? ` · <em>Potongan −${rm(dp.ded)}</em>` : ""}</span>
        ${dp.notes.length ? `<span class="hn">${dp.notes.map(esc).join(" · ")}${dp.pending && d.present ? " · dikira muktamad selepas punch balik" : ""}</span>` : ""}</div>`;
    return `<div class="card staff hcard"><div class="hhead"><div class="hname"><h3>${esc(s.full_name || "Staff")}</h3><span class="mute">${esc(schedText(x.sc))}</span></div><span class="chip ${cls}">${lab}</span></div>
      <div class="hstats">${stat("Masuk", fi ? tHm(fi.punched_at) : "–", d.late ? "bad" : "")}${stat("Balik", lo && !d.open ? tHm(lo.punched_at) : "–")}${stat("Jam kerja", d.worked ? fmtMin(d.worked) : "–")}${stat("Lewat", d.late ? fmtMin(d.late) : d.lateExcused ? "Dimaafkan" : "–", d.late ? "bad" : "")}${stat("OT", d.ot ? fmtMin(d.ot) : "–", d.ot ? "blue" : "")}</div>
      ${S.owner ? payTile : ""}
      ${x.ps.length ? `<details class="hpunch"><summary>Rekod punch (${x.ps.length})${d.outside ? ` <span class="chip bad">Ada luar kawasan</span>` : ""}</summary><div class="pl cols2">${x.ps.map(p => punchRow(p, false)).join("")}</div></details>` : ""}
      <div class="hact"><button class="sm go" data-act="day" data-staff="${esc(s.id)}" data-day="${k}">✎ Edit hari</button><button class="sm" data-act="manual" data-staff="${esc(s.id)}">+ Punch manual</button></div></div>`;
  }).join("");
  const present = list.filter(s => S.punches.some(p => p.staff_id === s.id && dayKey(p.punched_at) === k)).length;
  const totPay = S.owner ? list.reduce((t, s) => { const dp = dayPay(boardStatus(s, k).d, s.id); return t + (dp ? dp.net : 0); }, 0) : 0;
  const totDed = S.owner ? list.reduce((t, s) => { const dp = dayPay(boardStatus(s, k).d, s.id); return t + (dp ? dp.ded : 0); }, 0) : 0;
  return `<div class="card hday"><div class="hday-l"><h3>${dayLabel(k)}</h3><span class="mute">${present}/${list.length} staff hadir${S.holidays[k] ? ` · ${esc(S.holidays[k].name)}` : ""}</span></div>
      ${S.owner ? `<div class="hday-m"><div><small>Jumlah gaji hari ini</small><b>${rm(totPay)}</b></div><div><small>Jumlah potongan</small><b class="${totDed ? "neg" : ""}">${totDed ? "−" + rm(totDed) : rm(0)}</b></div></div>` : ""}
      <div class="hday-r"><button class="sm" data-act="dayshift" data-n="-1">‹</button><input type="date" class="field" id="day" value="${esc(k)}"><button class="sm" data-act="dayshift" data-n="1">›</button></div></div>
    <div class="ap">${cards || `<div class="card full"><p class="mute">Belum ada staff. Tambah staff di menu Staff.</p></div>`}</div>`;
}

/* --- Kelulusan & isu (Owner) --- */
function issuesFor(sid) {
  const { days } = staffMonth(sid), out = [], today = nowKey();
  for (const d of days) {
    if (d.future) continue;
    if (d.open && d.key < today) out.push({ d, t:"open", txt:"Tiada punch balik" });
    if (!d.present && d.workday && !d.leave && d.key < today) out.push({ d, t:"absent", txt:"Tidak hadir tanpa cuti" });
    if (d.restOver) out.push({ d, t:"rest", txt:`Rehat lebih ${fmtMin(d.restOver)}` });
    if (d.outside) out.push({ d, t:"out", txt:"Punch di luar kawasan" });
    if (d.early && d.key < today) out.push({ d, t:"early", txt:`Balik awal ${fmtMin(d.early)}` });
  }
  return out;
}
function viewLulus() {
  const st = S.settings, list = activeStaff(), RS = { approved:["Lulus","ok"], rejected:["Ditolak","bad"] };
  const reqP = (S.requests || []).filter(r => r.status === "pending"), reqD = (S.requests || []).filter(r => r.status !== "pending").slice(0, 10);
  const ots = [], lates = [], issues = [];
  list.forEach(s => { const { days } = staffMonth(s.id);
    days.forEach(d => { if (d.ot > 0 && d.otStatus === "pending" && !d.open) ots.push({ s, d }); if (d.late > 0) lates.push({ s, d }); });
    issuesFor(s.id).forEach(i => issues.push({ s, ...i })); });
  const dayBtn = (s, d) => `<button class="sm" data-act="day" data-staff="${esc(s.id)}" data-day="${d.key}">✎</button>`;
  return `<div class="ap"><div class="card full"><div class="r"><h3>Kelulusan & isu</h3>${monthInput()}</div><p class="mute">${st.ot_require_approval ? "OT hanya dibayar selepas diluluskan." : "OT dibayar automatik. Hidupkan \"OT perlu kelulusan\" di Tetapan jika mahu semak dahulu."}</p></div>
    <div class="card full"><h3>Tuntutan punch tertinggal ${reqP.length ? `<span class="badge">${reqP.length}</span>` : ""}</h3>
      ${reqP.length ? `<div class="pl">${reqP.map(r => `<div class="loc"><div class="grow"><b>${esc(nameOf(r.staff_id))}</b> · ${KIND_LABEL[r.kind]} <b>${dayLabel(dayKey(r.punched_at))} ${hm(r.punched_at)}</b><div class="mute">${esc(r.reason)}</div></div>
        <button class="sm go" data-act="reqok" data-id="${esc(r.id)}">Lulus</button><button class="sm bad" data-act="reqno" data-id="${esc(r.id)}">Tolak</button></div>`).join("")}</div>` : `<p class="mute">Tiada tuntutan menunggu.</p>`}
      ${reqD.length ? `<details><summary>Keputusan terkini (${reqD.length})</summary><div class="pl" style="margin-top:8px">${reqD.map(r => `<div class="loc"><div class="grow">${esc(nameOf(r.staff_id))} · ${KIND_LABEL[r.kind]} ${dayLabel(dayKey(r.punched_at))} ${hm(r.punched_at)}</div><span class="chip ${RS[r.status][1]}">${RS[r.status][0]}</span></div>`).join("")}</div></details>` : ""}</div>
    <div class="card full"><div class="r"><h3>OT ${st.ot_require_approval ? "menunggu kelulusan" : "untuk disemak"} ${ots.length ? `<span class="badge">${ots.length}</span>` : ""}</h3>${ots.length ? `<button class="sm go" data-act="otall">Lulus semua</button>` : ""}</div>
      ${ots.length ? `<div class="tw"><table><thead><tr><th>Staff</th><th>Hari</th><th>Masa</th><th class="n">OT</th><th>Minit lulus</th><th></th></tr></thead><tbody>${ots.map(({ s, d }) => `<tr><td class="who">${esc(s.full_name)}</td><td>${dayLabel(d.key)}${d.otKind !== "normal" ? ` <span class="chip pur">${d.otKind === "ph" ? "Cuti umum" : "Hari rehat"}</span>` : ""}</td><td>${d.firstIn ? hm(d.firstIn.punched_at) : "–"} – ${d.lastOut ? hm(d.lastOut.punched_at) : "–"}</td><td class="n">${fmtMin(d.ot)}</td>
        <td><input class="field otin" type="number" min="0" max="1440" value="${d.ot}" data-otmin="${esc(s.id)}|${d.key}"></td><td class="act"><button class="sm go" data-act="otok" data-staff="${esc(s.id)}" data-day="${d.key}">Lulus</button> <button class="sm bad" data-act="otno" data-staff="${esc(s.id)}" data-day="${d.key}">Tolak</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="mute">Tiada OT menunggu bulan ini.</p>`}</div>
    <div class="card"><h3>Lewat ${lates.length ? `<span class="badge">${lates.length}</span>` : ""}</h3>
      ${lates.length ? `<div class="tw"><table><thead><tr><th>Staff</th><th>Hari</th><th>Masuk</th><th class="n">Lewat</th><th></th></tr></thead><tbody>${lates.map(({ s, d }) => `<tr><td class="who">${esc(s.full_name)}</td><td>${dayLabel(d.key)}</td><td>${hm(d.firstIn.punched_at)} <span class="mute">(syif ${hhmmOf(d.sched.start)})</span></td><td class="n">${fmtMin(d.late)}</td><td class="act"><button class="sm" data-act="excuse" data-staff="${esc(s.id)}" data-day="${d.key}">Maafkan</button> ${dayBtn(s, d)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="mute">Tiada lewat bulan ini 🎉</p>`}</div>
    <div class="card"><h3>Isu rekod ${issues.length ? `<span class="badge">${issues.length}</span>` : ""}</h3>
      ${issues.length ? `<div class="tw"><table><thead><tr><th>Staff</th><th>Hari</th><th>Isu</th><th></th></tr></thead><tbody>${issues.map(i => `<tr><td class="who">${esc(i.s.full_name)}</td><td>${dayLabel(i.d.key)}</td><td><span class="chip ${i.t === "absent" || i.t === "out" ? "bad" : "warn"}">${esc(i.txt)}</span></td><td class="act">${dayBtn(i.s, i.d)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="mute">Tiada isu bulan ini.</p>`}</div></div>`;
}

/* --- Kalendar (Owner) --- */
function cellOf(d) {
  if (d.leave && !d.present) return [LEAVE_CODE[d.leave.kind] || "C", d.leave.kind === "unpaid" ? "c-tg" : "c-cuti", LEAVE_NAME[d.leave.kind]];
  if (d.present) { const ot = d.ot > 0 ? "+" : ""; if (d.open && d.key < nowKey()) return ["?" + ot, "c-warn", "Tiada punch balik"]; if (d.type === "ph") return ["H" + ot, "c-umum", "Kerja cuti umum"]; if (d.type === "rest") return ["H" + ot, "c-rest h", "Kerja hari rehat"];
    return [(d.late ? "L" : "H") + ot, d.late ? "c-late" : "c-ok", d.late ? `Lewat ${fmtMin(d.late)}` : "Hadir"]; }
  if (d.type === "ph") return ["CU", "c-umum", d.sched.ph.name];
  if (d.type === "rest") return ["·", "c-rest", "Hari rehat"];
  if (d.future) return ["", "", ""];
  return ["X", "c-abs", "Tidak hadir"];
}
function viewKalendar() {
  const [a, b] = monthRange(S.month), keys = []; for (let k = a; k < b; k = nextDay(k)) keys.push(k);
  const list = activeStaff(), today = nowKey();
  const head = keys.map(k => `<th class="${S.holidays[k] ? "ph" : ""} ${k === today ? "td" : ""}" title="${esc(S.holidays[k]?.name || "")}">${+k.slice(8)}<br><span>${DAYS[dow(k)][0]}</span></th>`).join("");
  const rows = list.map(s => { const { days, c } = staffMonth(s.id);
    return `<tr><th class="nm">${esc(s.full_name || "Staff")}<div class="mute">${c.presentDays}H · ${c.lateCount}L · ${c.absent}X</div></th>${days.map(d => { const [t, cls, tip] = cellOf(d);
      return `<td class="${cls} ${d.key === today ? "td" : ""}" data-act="day" data-staff="${esc(s.id)}" data-day="${d.key}" title="${esc(dayLabel(d.key) + " · " + tip)}">${t}</td>`; }).join("")}</tr>`; }).join("");
  const hol = keys.filter(k => S.holidays[k]).map(k => `<span class="chip pur">${+k.slice(8)} · ${esc(S.holidays[k].name)}</span>`).join(" ");
  const leaves = (S.leaves || []).filter(l => l.date_to >= a && l.date_from < b).sort((x, y) => x.date_from.localeCompare(y.date_from));
  const advM = [0, 1, 2, 3, 4, 5].map(i => mAdd(S.month, i));
  const advRows = list.map(s => { const v = advM.map(m => advanceFor(s.id, m).reduce((t, x) => t + x.amt, 0)); return v.some(Boolean) ? `<tr><td>${esc(s.full_name)}</td>${v.map(x => `<td class="n">${x ? rm(x) : "–"}</td>`).join("")}</tr>` : ""; }).join("");
  return `<div class="card"><div class="r"><h3>Kalendar kehadiran</h3>${monthInput()}</div>
      <div class="legend"><span class="c-ok">H Hadir</span><span class="c-late">L Lewat</span><span class="c-abs">X Tidak hadir</span><span class="c-warn">? Tiada punch balik</span><span class="c-cuti">CT/MC/HP Cuti</span><span class="c-tg">TG Tanpa gaji</span><span class="c-umum">CU Cuti umum</span><span class="c-rest">· Rehat</span><span>+ OT</span></div>
      <div class="tw"><table class="mx"><thead><tr><th class="nm">Staff</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      <p class="mute">Tekan mana-mana petak untuk lihat atau betulkan rekod hari itu.</p>${hol ? `<div>${hol}</div>` : ""}</div>
    <div class="card"><h3>Kalendar cuti</h3>${leaves.length ? `<div class="tw"><table><thead><tr><th>Staff</th><th>Jenis</th><th>Tarikh</th><th class="n">Hari</th></tr></thead><tbody>${(globalThis.adaPg?globalThis.adaPg.rows("kh-leave",leaves,render):leaves).map(l => `<tr><td>${esc(nameOf(l.staff_id))}</td><td><span class="chip ${l.kind === "unpaid" ? "warn" : "blue"}">${LEAVE_NAME[l.kind]}</span></td><td>${dayLabel(l.date_from)}${l.date_to !== l.date_from ? " – " + dayLabel(l.date_to) : ""}</td><td class="n">${+l.days}</td></tr>`).join("")}</tbody></table></div>${(globalThis.adaPg?globalThis.adaPg.nav("kh-leave",leaves.length):"")}` : `<p class="mute">Tiada cuti diluluskan bulan ini.</p>`}</div>
    <div class="card"><h3>Kalendar advance (potongan gaji)</h3>${advRows ? `<div class="tw"><table><thead><tr><th>Staff</th>${advM.map(m => `<th class="n">${m.slice(5)}/${m.slice(2, 4)}</th>`).join("")}</tr></thead><tbody>${advRows}</tbody></table></div>` : `<p class="mute">Tiada potongan advance dalam 6 bulan ini.</p>`}</div>`;
}

/* --- Gaji & laporan (Owner) --- */
function viewGaji() {
  const list = activeStaff();
  let total = 0;
  const cards = list.map(s => {
    const { days, c } = staffMonth(s.id); if (c.hasPay) total += c.net;
    const open = S.payOpen[s.id];
    return `<div class="card"><div class="r"><div><h3>${esc(s.full_name || "Staff")}</h3><span class="mute">${c.hasPay ? `${PAY_LABEL[c.pay.pay_type]} · ${rm(c.pay.rate)}` : "Tetapan gaji belum dibuat"}</span></div><div class="big">${c.hasPay ? rm(c.net) : "–"}</div></div>
      ${statsRow(c)}${payBox(c)}
      <div class="r" style="justify-content:flex-start"><button class="sm" data-act="togglepay" data-staff="${esc(s.id)}">${open ? "Tutup butiran harian" : "Lihat butiran harian"}</button><button class="sm" data-act="report" data-staff="${esc(s.id)}">⎙ Laporan PDF</button></div>${open ? dayTable(days, s.id) : ""}</div>`;
  }).join("");
  return `<div class="card"><div class="r"><h3>Gaji bulan</h3>${monthInput()}</div><div class="r"><span class="mute">Jumlah gaji bersih semua staff</span><span class="big">${rm(total)}</span></div>
    <div class="r" style="justify-content:flex-start"><button class="sm" data-act="csv">⬇ CSV gaji</button><button class="sm go" data-act="report">⎙ Laporan kehadiran PDF (semua staff)</button></div></div><div class="ap">${cards || `<div class="card full"><p class="mute">Belum ada staff.</p></div>`}</div>`;
}
function printReport(ids) {
  const st = S.settings, [a] = monthRange(S.month);
  const legend = `<div class="lg"><b>Petunjuk:</b> <i class="ok">Hadir</i><i class="late">Lewat</i><i class="abs">Tidak hadir</i><i class="lv">Cuti</i><i class="tg">Tanpa gaji</i><i class="ph">Cuti umum</i><i class="off">Hari rehat</i></div>`;
  const pages = ids.map(id => {
    const s = S.staff.find(x => x.id === id) || { full_name:"Staff" }, { days, c } = staffMonth(id);
    const tr = days.map(d => { const [t, cls, tip] = cellOf(d);
      const status = d.leave && !d.present ? LEAVE_NAME[d.leave.kind] : tip;
      const rc = { "c-ok":"ok", "c-late":"late", "c-abs":"abs", "c-cuti":"lv", "c-tg":"tg", "c-umum":"ph", "c-rest":"off", "c-rest h":"off", "c-warn":"late" }[cls] || "";
      return `<tr class="${rc}"><td>${dayLabel(d.key)}</td><td>${d.type === "work" ? `${esc(d.sched.name)} ${hhmmOf(d.sched.start)}–${hhmmOf(d.sched.end)}` : d.type === "ph" ? esc(d.sched.ph.name) : "Rehat"}</td><td>${d.firstIn ? hm(d.firstIn.punched_at) : "–"}</td><td>${d.rest ? fmtMin(d.rest) : d.autoBreak ? d.autoBreak + "m" : "–"}</td><td>${d.lastOut ? hm(d.lastOut.punched_at) : "–"}</td><td class="n">${d.worked ? fmtMin(d.worked) : "–"}</td><td class="n">${d.late ? fmtMin(d.late) : d.lateExcused ? "dimaafkan" : "–"}</td><td class="n">${d.otPaid ? fmtMin(d.otPaid) : d.ot ? fmtMin(d.ot) + "*" : "–"}</td><td>${esc(d.future && !d.present ? "" : status)}${d.open && d.key < nowKey() ? " · tiada punch balik" : ""}</td></tr>`; }).join("");
    return `<section><div class="top"><div><b>ABE DIN AUTO</b><br><small>Laporan Kehadiran · ${esc(monthNameMs(S.month))}</small></div><div style="text-align:right"><b>${esc(s.full_name)}</b><br><small>Dijana ${hm(Date.now())}, ${dayLabel(nowKey())}</small></div></div>
      <div class="sum"><span>Hadir <b>${c.presentDays}</b></span><span>Tidak hadir <b>${c.absent}</b></span><span>Lewat <b>${c.lateCount} (${fmtMin(c.lateMin)})</b></span><span>Cuti <b>${c.paidLeave + c.unpaidLeave}</b></span><span>Cuti umum <b>${c.phDays}</b></span><span>Jam kerja <b>${fmtMin(c.workedMin)}</b></span><span>OT dibayar <b>${fmtMin(c.otMin)}</b></span><span>Lupa punch balik <b>${c.openCount}</b></span></div>
      ${legend}<table><thead><tr><th>Hari</th><th>Syif</th><th>Masuk</th><th>Rehat</th><th>Balik</th><th class="n">Jam</th><th class="n">Lewat</th><th class="n">OT</th><th>Status</th></tr></thead><tbody>${tr}</tbody></table>
      ${st.ot_require_approval ? "<p><small>* OT belum diluluskan.</small></p>" : ""}<div class="sig"><span>Disediakan oleh</span><span>Disahkan oleh staff</span></div></section>`;
  }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Laporan Kehadiran ${esc(S.month)}</title><style>
    body{font:11px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#111;margin:18px}section{page-break-after:always}section:last-child{page-break-after:auto}
    .top{display:flex;justify-content:space-between;border-bottom:3px solid #111;padding-bottom:6px;margin-bottom:8px;font-size:13px}.sum{display:flex;flex-wrap:wrap;gap:6px 14px;margin:6px 0 8px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 5px;text-align:left}th{background:#f3efe2}.n{text-align:right}
    tr.ok td:last-child{color:#15803d}tr.late td{background:#fff4e0}tr.abs td{background:#fde2e1}tr.lv td{background:#e3efff}tr.tg td{background:#fff1c9}tr.ph td{background:#f1e6ff}tr.off td{color:#888}
    .lg{margin:4px 0 8px}.lg i{font-style:normal;padding:2px 7px;border-radius:9px;margin-right:5px;border:1px solid #ccc}.lg .late{background:#fff4e0}.lg .abs{background:#fde2e1}.lg .lv{background:#e3efff}.lg .tg{background:#fff1c9}.lg .ph{background:#f1e6ff}.lg .off{color:#888}
    .sig{display:flex;justify-content:space-between;margin-top:36px}.sig span{border-top:1px solid #111;padding-top:4px;width:40%;text-align:center}@media print{body{margin:8mm}}</style></head><body>${pages}
    <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
  const w = window.open("", "_blank"); if (!w) return toast("Benarkan pop-up untuk cetak laporan."); w.document.open(); w.document.write(html); w.document.close();
}
const monthNameMs = m => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("ms-MY", { month:"long", year:"numeric", timeZone:"UTC" }); };

/* --- Tetapan (Owner) --- */
function viewTetapan() {
  const st = S.settings;
  const days = [1,2,3,4,5,6,0].map(d => `<label><input type="checkbox" name="wd" value="${d}" ${(st.work_days || []).includes(d) ? "checked" : ""}> ${DAYS[d]}</label>`).join("");
  const locEdit = S.locs.find(l => l.id === S.locEdit);
  const locs = S.locs.map(l => `<div class="loc"><div class="grow"><b>${esc(l.name)}</b> ${l.active ? "" : `<span class="chip">Tidak aktif</span>`}<div class="mute">Radius ${l.radius_m} m · <a href="${gmaps(l.lat, l.lng)}" target="_blank" rel="noopener" style="color:var(--pri)">Lihat peta</a></div></div>
    <button class="sm" style="color:var(--blue)" data-act="locedit" data-id="${esc(l.id)}">Edit</button><button class="sm" data-act="loctoggle" data-id="${esc(l.id)}">${l.active ? "Matikan" : "Aktifkan"}</button><button class="sm bad" data-act="locdel" data-id="${esc(l.id)}">Padam</button></div>`).join("");
  const staff = S.staff.filter(s => s.enabled !== false && s.role !== "owner");
  const used = id => staffUsing(id);
  const shifts = (S.shifts || []).map(sh => `<div class="shrow ${S.shEdit === sh.id ? "on" : ""}"><span class="sw-dot" style="background:${esc(sh.color)}"></span><div class="grow"><b>${esc(sh.name)}</b> ${sh.active ? "" : `<span class="chip">Tidak aktif</span>`}<div class="mute">${String(sh.start_time).slice(0, 5)}–${String(sh.end_time).slice(0, 5)} · rehat ${sh.break_min} min${used(sh.id) ? ` · ${used(sh.id)} staff` : ""}</div></div>
    <span class="acts"><button class="sm" data-act="shedit" data-id="${esc(sh.id)}">✎ Edit</button><button class="sm" data-act="shtoggle" data-id="${esc(sh.id)}">${sh.active ? "Matikan" : "Aktifkan"}</button><button class="sm bad" data-act="shdel" data-id="${esc(sh.id)}">Padam</button></span></div>`).join("");
  const se = S.shEdit && shiftById(S.shEdit), sv = se ? { name:se.name, color:se.color, start:String(se.start_time).slice(0, 5), end:String(se.end_time).slice(0, 5), brk:se.break_min } : { name:"", color:"#e8b10b", start:"08:30", end:"17:30", brk:60 };
  const wk = [...Array(7)].map((_, i) => addDays(S.week, i)), act = (S.shifts || []).filter(x => x.active);
  const roster = staff.map(s => `<tr><th class="nm">${esc(s.full_name)}</th>${wk.map(k => { const r = S.roster[s.id + "|" + k], sc = schedFor(s.id, k), v = r ? (r.shift_id || "rest") : "";
    return `<td class="${sc.type}"><select data-roster="${esc(s.id)}|${k}" class="rs"><option value="" ${v === "" ? "selected" : ""}>Lalai${r ? "" : ` (${sc.type === "work" ? hhmmOf(sc.start) : sc.type === "ph" ? "CU" : "rehat"})`}</option><option value="rest" ${v === "rest" ? "selected" : ""}>Rehat</option>${act.map(x => `<option value="${esc(x.id)}" ${v === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></td>`; }).join("")}</tr>`).join("");
  const yr = nowKey().slice(0, 4), hols = Object.values(S.holidays || {}).filter(h => h.day >= yr + "-01-01").sort((x, y) => x.day.localeCompare(y.day));
  const IC = { clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', cup:'<path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2M6 3v2M10 3v2"/>', shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>', coins:'<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7M3 11v4c0 1.7 2.7 3 6 3 1.2 0 2.4-.2 3.3-.5"/><ellipse cx="17" cy="15" rx="4" ry="2"/><path d="M13 15v3c0 1.1 1.8 2 4 2s4-.9 4-2v-3"/>', users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>', sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>', gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' };
  const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
  const menus = [["work","clock","Waktu Kerja","Tetapkan waktu masuk, balik dan hari bekerja.","#2f6fd6"],["shift","cal","Syif & Jadual","Syif staff dan jadual mingguan.","#0e8a9a"],["gps","pin","Lokasi Tag (GPS)","Urus lokasi, radius dan zon punch.","#c2364d"],["staffgps","users","Lokasi Punch Individu","Tetapkan lokasi dibenarkan untuk setiap staf.","#2469a0"],["rest","cup","Rehat","Tetapkan tempoh rehat dan punch rehat.","#1f9d55"],["rules","shield","Peraturan Kehadiran","Tempoh bertenang lewat, GPS dan selfie.","#c47a1c"],["ot","coins","Kiraan Gaji / OT","Peraturan kerja lebih masa dan kadarnya.","#7c3aed"],["staff","users","Gaji Individu Staff","Syif, hari kerja, gaji, OT dan potongan setiap staff.","#3b5bdb"],["holiday","sliders","Lain-lain","Cuti umum dan cuti syarikat.","#6b7280"]];
  const m = S.settingsMenu, cur = menus.find(x => x[0] === m);
  const side = `<nav class="kset-side" aria-label="Menu tetapan"><button type="button" class="kset-si${cur ? "" : " on"}" data-act="settingsmenu" data-id=""><span class="kset-sic">${svg("gear")}</span><span><b>Semua Tetapan</b><small>Urus semua tetapan sistem</small></span></button>${menus.map(([id, ic, t]) => `<button type="button" class="kset-si${m === id ? " on" : ""}" data-act="settingsmenu" data-id="${id}"><span class="kset-sic">${svg(ic)}</span><span><b>${t}</b></span></button>`).join("")}</nav>`;
  if (!cur) return `<div class="kset">${side}<section class="kset-main"><header class="kset-h"><span class="kset-hic">${svg("gear")}</span><div><h2>Tetapan Kehadiran</h2><p>Pilih menu untuk urus tetapan</p></div></header><div class="kset-grid">${menus.map(([id, ic, t, d, c]) => `<button type="button" class="kset-card" data-act="settingsmenu" data-id="${id}"><span class="kset-cic" style="--c:${c}">${svg(ic)}</span><span class="kset-ct"><b>${t}</b><small>${d}</small></span><span class="kset-chev">›</span></button>`).join("")}</div></section></div>`;
  const panel = `<div class="kset">${side}<section class="kset-main"><header class="kset-h"><span class="kset-hic" style="--c:${cur[4]}">${svg(cur[1])}</span><div><h2>${cur[2]}</h2><p>${cur[3]}</p></div><button type="button" class="kset-back" data-act="settingsmenu" data-id="">← Kembali</button></header>`;
  return panel + `<div class="ap" style="grid-template-columns:1fr">${["work","rest","rules","ot"].includes(m) ? `<form class="card" id="f-set"><div class="settings-panel" ${m==="work"?"":"hidden"}><h3>Waktu kerja umum</h3><p class="mute">Dipakai untuk staff yang tiada syif sendiri.</p>
      <div class="g2"><div><label>Masuk</label><input class="field" type="time" name="work_start" value="${esc(String(st.work_start).slice(0,5))}"></div><div><label>Balik</label><input class="field" type="time" name="work_end" value="${esc(String(st.work_end).slice(0,5))}"></div></div>
      <div><label>Hari bekerja</label><div class="days">${days}</div></div>
      </div><div class="settings-panel" ${m==="rules"?"":"hidden"}><div><label>Tempoh bertenang lewat (minit)</label><input class="field" type="number" min="0" max="240" name="grace_min" value="${st.grace_min}"></div>
      </div><div class="settings-panel" ${m==="ot"?"":"hidden"}><div><label>OT dikira jika lebih (minit selepas waktu balik)</label><input class="field" type="number" min="0" max="600" name="ot_min_minutes" value="${st.ot_min_minutes}"></div>
      <div class="g2"><div><label>Kadar OT hari rehat (× kadar OT)</label><input class="field" type="number" step="0.01" min="0" max="5" name="ot_restday_mult" value="${+st.ot_restday_mult}"></div>
      <div><label>Kadar OT cuti umum (× kadar OT)</label><input class="field" type="number" step="0.01" min="0" max="5" name="ot_ph_mult" value="${+st.ot_ph_mult}"></div></div>
      <p class="mute" style="margin:-4px 0 0">Akta Kerja 1955: OT hari biasa 1.5×, hari rehat 2×, cuti umum 3× gaji sejam. Jika kadar OT staff sudah 1.5× gaji sejam, isi 1.33 dan 2.</p>
      <label class="sw"><input type="checkbox" name="ot_offday_all" ${st.ot_offday_all ? "checked" : ""}> Kerja pada hari rehat dikira OT sepenuhnya</label>
      <label class="sw"><input type="checkbox" name="ot_require_approval" ${st.ot_require_approval ? "checked" : ""}> OT perlu kelulusan Owner sebelum dibayar</label>
      </div><div class="settings-panel" ${m==="rest"?"":"hidden"}><h3>Rehat</h3><div><label>Rehat tanpa gaji (minit)</label><input class="field" type="number" min="0" max="240" name="break_min" value="${+st.break_min || 0}"><p class="mute" style="margin:6px 0 0">Dipakai untuk staff waktu biasa. Rehat syif ditetapkan dalam Syif & Jadual. Jika staff tidak punch rehat dan kerja 6 jam atau lebih, rehat ditolak automatik.</p></div><label class="sw"><input type="checkbox" name="allow_rest_punch" ${st.allow_rest_punch ? "checked" : ""}> Benarkan punch rehat (mula / habis rehat)</label>
      </div><div class="settings-panel" ${m==="rules"?"":"hidden"}>
      <label class="sw"><input type="checkbox" name="enforce_geofence" ${st.enforce_geofence ? "checked" : ""}> Sekat punch di luar kawasan lokasi tag</label>
      <label class="sw"><input type="checkbox" name="require_selfie" ${st.require_selfie ? "checked" : ""}> Wajib selfie</label>
      </div><button class="btn" type="submit">Simpan tetapan</button></form>` : ""}
    ${m==="shift" ? `<div class="card"><h3>Syif</h3><p class="mute">Rehat syif ditolak automatik jika staff kerja 6 jam atau lebih tanpa punch rehat.</p><div class="shlist">${shifts || `<p class="mute">Belum ada syif.</p>`}</div>
      <form id="f-shift" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px">
        <b>${se ? `Edit syif: ${esc(se.name)}` : "Tambah syif baharu"}</b>
        <div class="g2"><div><label>Nama syif</label><input class="field" name="name" required placeholder="cth: Syif Pagi" value="${esc(sv.name)}"></div><div><label>Warna</label><input class="field" type="color" name="color" value="${esc(sv.color)}" style="height:42px;padding:4px"></div></div>
        <div class="g3"><div><label>Masuk</label><input class="field" type="time" name="start_time" value="${sv.start}" required></div><div><label>Balik</label><input class="field" type="time" name="end_time" value="${sv.end}" required></div><div><label>Rehat (min)</label><input class="field" type="number" min="0" max="240" name="break_min" value="${sv.brk}"></div></div>
        ${se ? `<div class="g2"><button class="btn alt" type="button" data-act="shcancel">Batal</button><button class="btn" type="submit">Simpan perubahan</button></div>` : `<button class="btn" type="submit">+ Tambah syif</button>`}</form></div>
    <div class="card full"><div class="r"><h3>Jadual mingguan</h3><span class="r" style="gap:6px"><button class="sm" data-act="wk" data-n="-7">‹</button><span class="mute">${dayLabel(wk[0])} – ${dayLabel(wk[6])}</span><button class="sm" data-act="wk" data-n="7">›</button></span></div>
      <p class="mute">Ubah syif atau beri hari rehat untuk tarikh tertentu. "Lalai" ikut syif & hari kerja staff. Disimpan terus.</p>
      ${staff.length ? `<div class="tw"><table class="ros"><thead><tr><th class="nm">Staff</th>${wk.map(k => `<th class="${S.holidays[k] ? "ph" : ""}">${DAYS[dow(k)].slice(0, 3)}<br><span class="mute">${+k.slice(8)}/${+k.slice(5, 7)}</span></th>`).join("")}</tr></thead><tbody>${roster}</tbody></table></div>` : `<p class="mute">Belum ada staff.</p>`}</div>
    ` : ""}${m==="holiday" ? `<div class="card"><h3>Cuti umum & cuti syarikat</h3><p class="mute">Cuti umum dibayar. Staff yang bekerja pada hari ini dapat OT kadar cuti umum. Tarikh bertanda * tertakluk pengumuman rasmi.</p>
      ${hols.length ? `<div class="pl">${hols.map(h => `<div class="loc"><div class="grow"><b>${dayLabel(h.day)} ${h.day.slice(0, 4)}</b> · ${esc(h.name)} ${h.kind === "syarikat" ? `<span class="chip blue">Syarikat</span>` : ""}</div><button class="sm bad" data-act="holdel" data-day="${h.day}">Padam</button></div>`).join("")}</div>` : `<p class="mute">Tiada.</p>`}
      <form id="f-hol" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px">
        <div class="g3"><div><label>Tarikh</label><input class="field" type="date" name="day" required></div><div><label>Nama</label><input class="field" name="name" required placeholder="cth: Cuti ganti"></div><div><label>Jenis</label><select class="field" name="kind"><option value="umum">Cuti umum</option><option value="syarikat">Cuti syarikat</option></select></div></div>
        <button class="btn" type="submit">+ Tambah cuti</button></form></div>
    ` : ""}${m==="gps" ? `<div class="card"><h3>Lokasi tag</h3><p class="mute">Staff hanya boleh punch masuk/balik dalam radius lokasi aktif (jika sekatan dihidupkan). Boleh ada lebih daripada satu lokasi.</p>
      ${locs || `<p class="mute">Belum ada lokasi.</p>`}
      <form id="f-loc" style="display:flex;flex-direction:column;gap:10px">
        ${locEdit ? `<b>Edit lokasi: ${esc(locEdit.name)}</b>` : ""}
        <div class="g2"><div><label>Nama lokasi</label><input class="field" name="name" placeholder="cth: Kedai Kubang Kerian" value="${esc(locEdit?.name || "")}" required></div><div><label>Radius (meter)</label><input class="field" type="number" name="radius_m" min="10" max="5000" value="${esc(locEdit?.radius_m ?? 100)}" required></div></div>
        <div><label>Koordinat atau pautan Google Maps</label><input class="field" name="coord" placeholder="cth: 6.0950, 102.2800" value="${locEdit ? esc(Number(locEdit.lat).toFixed(8) + ", " + Number(locEdit.lng).toFixed(8)) : ""}"></div>
        <button class="sm" type="button" data-act="here">📍 Guna lokasi saya sekarang</button>
        <div id="locprev"></div>
        <button class="btn" type="submit">${locEdit ? "Simpan perubahan" : "+ Tambah lokasi"}</button>${locEdit ? `<button class="sm" type="button" data-act="loccancel">Batal</button>` : ""}</form></div>
    ` : ""}${m==="staffgps" ? staffLocationCard(staff) : ""}${m==="staff" ? payCard(staff) : ""}</div></section></div>`;
}
function staffLocationCard(staff){
  const active=S.locs.filter(l=>l.active);
  return `<div class="card"><h3>Lokasi Punch Individu</h3><p class="mute">Owner sahaja boleh memilih lokasi. Lalai menggunakan semua lokasi aktif. Sekatan punch masuk/balik mengikut tetapan Peraturan Kehadiran.</p>${!S.settings.enforce_geofence?`<div class="notice">Sekatan GPS dimatikan. Hidupkan di Peraturan Kehadiran untuk menguatkuasakan pilihan lokasi.</div>`:""}${!active.length?`<div class="notice">Tambah lokasi aktif di menu Lokasi Tag (GPS) dahulu.</div>`:""}<div class="ps-list">${staff.map(s=>{
    const ids=individualLocations(s.id),anywhere=anywhereAllowed(s.id),names=anywhere?"Di mana-mana (GPS direkod)":ids===null?"Semua lokasi aktif":ids.map(id=>S.locs.find(l=>l.id===id)?.name||"Lokasi dipadam").join(", ");
    return `<details class="pd" style="min-width:0"><summary style="cursor:pointer"><b>${esc(s.full_name)}</b><div class="mute" style="font-size:12px;overflow-wrap:anywhere">${anywhere?"Bebas lokasi":ids===null?"Lalai":"Individu"} · ${esc(names)}</div></summary><form class="f-staffgps" data-staff="${esc(s.id)}" style="display:grid;gap:8px;margin-top:10px"><label>Kaedah<select class="field" name="mode"><option value="global"${!anywhere&&ids===null?" selected":""}>Semua lokasi aktif (lalai)</option><option value="individual"${!anywhere&&ids!==null?" selected":""}>Lokasi terpilih sahaja</option><option value="anywhere"${anywhere?" selected":""}>Bebas lokasi (di mana-mana)</option></select></label><div class="mute">Pilih satu atau lebih lokasi untuk kaedah individu:</div>${active.map(l=>`<label class="sw" style="align-items:flex-start"><input type="checkbox" name="locid" value="${esc(l.id)}"${ids?.includes(l.id)?" checked":""}> <span>${esc(l.name)} · ${esc(l.radius_m)} m</span></label>`).join("")}<button type="submit" class="btn">Simpan lokasi staf</button></form></details>`;
  }).join("")||'<p class="mute">Tiada staf aktif.</p>'}</div></div>`;
}
function payCard(staff) {
  const unset = staff.filter(s => !S.pay[s.id]).length;
  const sorted = [...staff].sort((a, b) => (!!S.pay[a.id] - !!S.pay[b.id]) || String(a.full_name || "").localeCompare(String(b.full_name || "")));
  const filt = "const q=this.closest('.card').querySelector('[data-psq]').value.trim().toLowerCase(),u=this.closest('.card').querySelector('[data-psu]').checked;this.closest('.card').querySelectorAll('[data-pd]').forEach(d=>{d.hidden=(q&&!d.dataset.q.includes(q))||(u&&d.dataset.set==='1')})";
  return `<div class="card full"><div class="ps-head"><div><h3 style="margin:0">Staff: syif, hari kerja & gaji</h3>
    <p class="mute" style="margin:2px 0 0">${staff.length} staff${unset ? ` · <b class="ps-warn">${unset} belum ada gaji</b>` : " · semua lengkap"} · tekan nama untuk ubah</p></div></div>
    ${staff.length > 4 ? `<div class="ps-tools"><input class="field" type="search" data-psq placeholder="Cari nama staff…" oninput="${filt}"><label class="sw"><input type="checkbox" data-psu onchange="${filt.replace(/this\.closest/g, "this.closest")}"> Belum lengkap sahaja</label></div>` : ""}
    <div class="ps-list">${sorted.map(s => payForm(s)).join("") || `<p class="mute">Belum ada staff.</p>`}</div></div>`;
}
const tcase = s => String(s || "").toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, c) => a + c.toUpperCase());
function payForm(s) {
  const p = S.pay[s.id] || { pay_type:"daily", rate:0, ot_rate:0, late_mode:"none", late_rate:0, monthly_workdays:26, allowance:0 };
  const a = (S.astaff || {})[s.id] || {}, own = a.work_days && a.work_days.length, wd = own ? a.work_days : (S.settings.work_days || []);
  const sh = a.shift_id && shiftById(a.shift_id);
  const opt = (v, l, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`;
  const nm = tcase(s.full_name || "Staff"), ini = nm.split(/\s+/).filter(w => !/^(bin|binti|b|bt)$/i.test(w)).slice(0, 2).map(w => w[0]).join("");
  const set = !!S.pay[s.id], days = [1,2,3,4,5,6,0].filter(d => wd.includes(d));
  const LATE = { none:"", pay_rate:"Potong ikut minit", per_minute:"Potong/minit", per_late:"Potong/lewat" };
  return `<details class="pd ps-item${set ? "" : " unset"}" ${S.payOpen["f" + s.id] ? "open" : ""} data-pd="${esc(s.id)}" data-set="${set ? 1 : 0}" data-q="${esc(nm.toLowerCase())}"><summary>
    <span class="ps-av"${sh?.color ? ` style="background:${esc(sh.color)}33;color:${esc(sh.color)}"` : ""}>${esc(ini || "?")}</span>
    <span class="ps-main"><b class="ps-name">${esc(nm)}</b>
      <span class="ps-chips"><span class="ps-chip">${sh ? `<i style="background:${esc(sh.color || "#888")}"></i>${esc(sh.name)} ${String(sh.start_time).slice(0, 5)}–${String(sh.end_time).slice(0, 5)}` : "🕘 Waktu biasa"}</span>
      <span class="ps-chip">📅 ${days.length} hari${days.length && days.length < 7 ? ` · ${days.map(d => DAYS[d].slice(0, 3)).join(" ")}` : ""}</span>
      ${set ? `<span class="ps-chip gold">💰 ${PAY_LABEL[p.pay_type]} ${rm(p.rate)}</span>${+p.ot_rate ? `<span class="ps-chip">OT ${rm(p.ot_rate)}/j</span>` : ""}${+p.allowance ? `<span class="ps-chip">Elaun ${rm(p.allowance)}</span>` : ""}${LATE[p.late_mode] ? `<span class="ps-chip">${LATE[p.late_mode]}</span>` : ""}` : `<span class="ps-chip red">⚠ Gaji belum ditetapkan</span>`}</span></span>
    <span class="ps-chev">›</span></summary>
    <form class="f-pay" data-staff="${esc(s.id)}" style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
      <div class="ps-sec">📅 Syif & hari kerja</div>
      <div class="g2"><div><label>Syif lalai</label><select class="field" name="shift_id"><option value="">Waktu kerja umum</option>${(S.shifts || []).filter(x => x.active || x.id === a.shift_id).map(x => opt(x.id, `${esc(x.name)} (${String(x.start_time).slice(0, 5)}–${String(x.end_time).slice(0, 5)})`, a.shift_id)).join("")}</select></div>
      <div><label class="sw" style="margin-top:22px"><input type="checkbox" name="own_days" ${own ? "checked" : ""}> Hari kerja sendiri</label></div></div>
      <div class="days">${[1,2,3,4,5,6,0].map(d => `<label><input type="checkbox" name="swd" value="${d}" ${wd.includes(d) ? "checked" : ""}> ${DAYS[d].slice(0, 3)}</label>`).join("")}</div>
      <div class="ps-sec">💰 Gaji</div>
      <div class="g2"><div><label>Cara gaji</label><select class="field" name="pay_type">${opt("daily","Harian (RM sehari)",p.pay_type)}${opt("hourly","Sejam (RM sejam)",p.pay_type)}${opt("monthly","Bulanan (RM sebulan)",p.pay_type)}</select></div>
      <div><label>Kadar (RM)</label><input class="field" type="number" step="0.01" min="0" name="rate" value="${p.rate}"></div></div>
      <div class="ps-sec">⏱ OT, elaun & potongan</div>
      <div class="g2"><div><label>Kadar OT (RM sejam, hari biasa)</label><input class="field" type="number" step="0.01" min="0" name="ot_rate" value="${p.ot_rate}"></div>
      <div><label>Elaun tetap sebulan (RM)</label><input class="field" type="number" step="0.01" min="0" name="allowance" value="${p.allowance}"></div></div>
      <div class="g2"><div><label>Potongan lewat</label><select class="field" name="late_mode">${opt("none","Tiada potongan",p.late_mode)}${opt("pay_rate","Ikut jam kerja — 8 jam sehari (seminit)",p.late_mode)}${opt("per_minute","RM setiap minit lewat",p.late_mode)}${opt("per_late","RM setiap kali lewat",p.late_mode)}</select></div>
      <div data-late-rate${p.late_mode === "pay_rate" || p.late_mode === "none" ? " hidden" : ""}><label>Kadar potongan lewat (RM)</label><input class="field" type="number" step="0.01" min="0" name="late_rate" value="${p.late_rate}"></div><p class="mute" data-late-note style="grid-column:1/-1;margin:2px 0 0;font-size:12.5px"${p.late_mode === "pay_rate" ? "" : " hidden"}>Gaji dikira maksimum 8 jam sehari — kerja lebih tidak menambah gaji. Jika jam kerja kurang daripada 8 jam (lewat masuk, balik awal atau rehat lebih), kekurangan dipotong ikut kadar gaji seminit (kadar sehari ÷ 480 minit). Contoh: RM70 sehari → RM0.1458 seminit; kurang 20 minit = RM2.92.</p></div>
      <div><label>Hari kerja sebulan (untuk potongan tidak hadir gaji bulanan)</label><input class="field" type="number" min="1" max="31" name="monthly_workdays" value="${p.monthly_workdays}"></div>
      <button class="btn" type="submit">Simpan ${esc(nm)}</button></form></details>`;
}

/* Kerja bersih hari ini (paparan langsung), selari dengan kiraan gaji computeDays():
   jika staff TIDAK punch rehat, rehat syif ditolak automatik. Paparan dibuat lancar:
   kemajuan "berhenti" pada 5 jam selama tempoh rehat, kemudian sambung — jadi pada 6 jam
   ke atas nilainya sama seperti gaji (kasar − rehat syif). Sasaran maksimum 8 jam. */
function netWorkedToday(mine, sc, nowMs = Date.now()) {
  let start = null, pause = null, ms = 0, restCount = 0;
  for (const p of mine) {
    const at = new Date(p.punched_at).getTime();
    if (p.kind === "in" && start == null) start = at;
    else if (p.kind === "rest_start" && start != null && pause == null) pause = at;
    else if (p.kind === "rest_end" && pause != null) { ms += Math.max(0, pause - start); start = at; pause = null; restCount++; }
    else if (p.kind === "out" && start != null) { ms += Math.max(0, (pause ?? at) - start); if (pause != null) restCount++; start = null; pause = null; }
  }
  if (start != null) ms += Math.max(0, (pause ?? nowMs) - start);
  if (pause != null) restCount++;
  const gross = Math.round(ms / 60000), brk = sc.type === "work" ? (sc.brk || 0) : 0;
  const autoBreak = !restCount && brk > 0 ? Math.min(brk, Math.max(0, gross - (360 - brk))) : 0;
  const mins = Math.max(0, gross - autoBreak);
  const target = sc.type === "work" ? Math.min(480, Math.max(0, sc.end - sc.start - brk)) : 0;
  return { mins, autoBreak, target, percent: target ? Math.min(100, Math.round(mins / target * 100)) : null };
}
const workedNote = w => w.autoBreak ? `Rehat ${fmtMin(w.autoBreak)} ditolak auto (tiada punch rehat)` : "Tidak termasuk rehat";

let clockTimer = null, tickN = 0;
function tickClock() {
  const el = $("#clock"); if (!el) return;
  const d = klDate(Date.now());
  el.textContent = `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
  const out = $("#punch-worked"); if (!out || !S.me || !S.settings) return;
  const today = nowKey(), mine = S.punches.filter(p => p.staff_id === S.me && dayKey(p.punched_at) === today);
  const sc=schedFor(S.me,today), w=netWorkedToday(mine, sc), mins=w.mins, target=w.target, pct=w.percent;
  out.textContent=fmtMin(mins);
  const wn=$("#punch-worked-note"); if(wn) wn.textContent=workedNote(w);
  const p=$("#punch-percent"), bar=$("#punch-progress");
  if(p) p.textContent=pct==null ? "—" : pct+"%";
  if(bar) bar.style.width=(pct||0)+"%";
  const leaveEl=$("#punch-required-leave");
  if (leaveEl) {
    const first=mine.find(p=>p.kind==="in");
    if(first && target) {
      let restMs=0, restAt=null;
      for(const p of mine) {
        const at=new Date(p.punched_at).getTime();
        if(p.kind==="rest_start" && restAt==null) restAt=at;
        else if(p.kind==="rest_end" && restAt!=null) { restMs+=Math.max(0,at-restAt); restAt=null; }
      }
      if(restAt!=null) restMs+=Math.max(0,Date.now()-restAt);
      const due=new Date(new Date(first.punched_at).getTime()+target*60000+Math.max((sc.brk||0)*60000,restMs));
      leaveEl.textContent=hm(due.toISOString());
    }
  }
}

/* ---------- punch (selfie + GPS) ---------- */
async function startPunch(kind) {
  const st = S.settings, label = kind === "in" ? "Punch Masuk" : "Punch Balik";
  const o = sheet(`<div class="r"><h2>${label}</h2><button class="sm" data-x>Tutup</button></div>
    <div class="cam" id="cam"><video id="vid" playsinline autoplay muted></video></div>
    <div class="gps" id="gps">📍 Mencari lokasi GPS…</div>
    <div id="acts" class="g2"><button class="btn" id="snap">📸 Ambil selfie</button><label class="btn alt" style="margin:0;text-align:center;color:var(--fg)">🖼 Kamera telefon<input type="file" accept="image/*" capture="user" id="file" hidden></label></div>`);
  let stream = null, watch = null, pos = null, blob = null, done = false;
  const q = s => o.querySelector(s);
  o.__cleanup = () => { done = true; stream?.getTracks().forEach(t => t.stop()); if (watch != null) navigator.geolocation.clearWatch(watch); };
  q("[data-x]").onclick = () => closeSheet(o);
  const showGps = () => {
    const g = q("#gps"); if (!g) return;
    if (!pos) return;
    const n = nearest(pos.lat, pos.lng), acc = Math.round(pos.acc);
    if(anywhereAllowed()){g.className="gps ok";g.textContent=`✓ Bebas lokasi · GPS direkod (±${acc} m).`;return;}
    if (!n) { const blocked=individualLocations(S.me)!==null&&st.enforce_geofence;g.className = "gps"+(blocked?" bad":"");g.textContent=blocked?"Tiada lokasi individu aktif. Hubungi Owner.":`📍 Lokasi didapati (ketepatan ±${acc} m). Tiada lokasi tag ditetapkan.`; return; }
    const inside = n.d <= n.radius_m; g.className = "gps " + (inside ? "ok" : "bad");
    g.innerHTML = inside ? `✓ Dalam kawasan <b>${esc(n.name)}</b> · ${Math.round(n.d)} m (±${acc} m)` : `✗ Anda ${Math.round(n.d)} m dari <b>${esc(n.name)}</b> (had ${n.radius_m} m, ketepatan ±${acc} m)${st.enforce_geofence ? ". Punch akan ditolak — pergi ke lokasi kerja." : ". Punch tetap direkod sebagai luar kawasan."}`;
  };
  if (!navigator.geolocation) q("#gps").textContent = "Telefon ini tidak menyokong GPS.";
  else watch = navigator.geolocation.watchPosition(p => { if (!pos || p.coords.accuracy <= pos.acc + 5) pos = { lat:p.coords.latitude, lng:p.coords.longitude, acc:p.coords.accuracy }; showGps(); },
    e => { const g = q("#gps"); if (g) { g.className = "gps bad"; g.textContent = e.code === 1 ? "Akses lokasi ditolak. Benarkan lokasi untuk laman ini dalam tetapan pelayar, kemudian cuba lagi." : "Lokasi tidak dapat dikesan. Pastikan GPS dihidupkan."; } },
    { enableHighAccuracy:true, maximumAge:0, timeout:20000 });
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user", width:{ ideal:720 }, height:{ ideal:960 } }, audio:false });
    if (done) { stream.getTracks().forEach(t => t.stop()); return; }
    q("#vid").srcObject = stream;
  } catch (e) { q("#cam").innerHTML = `<div style="display:grid;place-items:center;height:100%;padding:20px;text-align:center" class="mute">Kamera tidak dapat dibuka di sini. Tekan "Kamera telefon" untuk ambil selfie.</div>`; q("#snap").disabled = true; }
  const finish = async src => {   // src: video atau ImageBitmap
    const w = src.videoWidth || src.width, h = src.videoHeight || src.height; if (!w) return;
    const sc = Math.min(1, 900 / Math.max(w, h)), c = document.createElement("canvas"); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
    const x = c.getContext("2d"); x.drawImage(src, 0, 0, c.width, c.height);
    const n = pos && nearest(pos.lat, pos.lng);
    const lines = [`${kind === "in" ? "MASUK" : "BALIK"} · ${S.profile?.full_name || ""}`, `${dayLabel(nowKey())} ${hm(Date.now())}`, pos ? (n ? `${n.name} · ${Math.round(n.d)} m` : `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`) : "Lokasi belum dikesan"];
    const fs = Math.max(14, Math.round(c.width / 26)); x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, c.height - fs * 4.2, c.width, fs * 4.2);
    x.fillStyle = "#ffd24a"; x.font = `700 ${fs}px sans-serif`; lines.forEach((l, i) => x.fillText(l, fs * .6, c.height - fs * (3.1 - i * 1.25)));
    blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.8));
    stream?.getTracks().forEach(t => t.stop());
    q("#cam").innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="Selfie">`;
    q("#acts").outerHTML = `<div class="g2"><button class="btn alt" id="redo">Ambil semula</button><button class="btn" id="send">Hantar ${label}</button></div>`;
    q("#redo").onclick = () => { closeSheet(o); startPunch(kind); };
    q("#send").onclick = () => submit();
  };
  q("#snap").onclick = () => finish(q("#vid"));
  q("#file").onchange = async e => { const f = e.target.files?.[0]; if (!f) return; try { finish(await createImageBitmap(f, { imageOrientation:"from-image" })); } catch (_) { toast("Gambar tidak dapat dibaca"); } };
  async function submit() {
    const b = q("#send"); if (!pos) { toast("Tunggu lokasi GPS dikesan dahulu"); return; }
    const n = nearest(pos.lat, pos.lng);
    if(st.enforce_geofence&&individualLocations(S.me)!==null&&!n){toast("Tiada lokasi individu aktif. Hubungi Owner.");return;}
    if (st.enforce_geofence && n && n.d > n.radius_m) { toast(`Anda di luar kawasan (${Math.round(n.d)} m)`); return; }
    b.disabled = true; b.textContent = "Menghantar…";
    try {
      let path = null;
      if (blob) {
        path = `${S.me}/${nowKey()}/${Date.now()}-${kind}.jpg`;
        const { error } = await S.client.storage.from(BUCKET).upload(path, blob, { contentType:"image/jpeg", upsert:false }); if (error) throw error;
      }
      const { data, error } = await S.client.rpc("attendance_punch", { p_kind:kind, p_lat:pos.lat, p_lng:pos.lng, p_accuracy:pos.acc, p_photo:path, p_device:navigator.userAgent.slice(0, 200) });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data; if (row) S.punches.push(row);
      if (path && blob) S.urls[path] = URL.createObjectURL(blob);
      closeSheet(o); toast(`${label} berjaya · ${hm(row?.punched_at || Date.now())}`); render();
    } catch (e) { b.disabled = false; b.textContent = `Hantar ${label}`; toast(errMsg(e)); }
  }
}
// Punch rehat: GPS sahaja, tanpa selfie
function restPunch(kind, btn) {
  if (!navigator.geolocation) return toast("Telefon ini tidak menyokong GPS.");
  const lab = kind === "rest_start" ? "Mula rehat" : "Habis rehat";
  btn.disabled = true; btn.textContent = "📍 Mencari lokasi…";
  navigator.geolocation.getCurrentPosition(async p => {
    const { data, error } = await S.client.rpc("attendance_punch", { p_kind:kind, p_lat:p.coords.latitude, p_lng:p.coords.longitude, p_accuracy:p.coords.accuracy, p_photo:null, p_device:navigator.userAgent.slice(0, 200) });
    if (error) { btn.disabled = false; btn.textContent = `☕ ${lab}`; return toast(errMsg(error)); }
    const row = Array.isArray(data) ? data[0] : data; if (row) S.punches.push(row);
    toast(`${lab} · ${hm(row?.punched_at || Date.now())}`); render();
  }, e => { btn.disabled = false; btn.textContent = `☕ ${lab}`; toast(e.code === 1 ? "Akses lokasi ditolak." : "Lokasi tidak dapat dikesan."); }, { enableHighAccuracy:true, timeout:20000, maximumAge:0 });
}

/* ---------- butiran punch & edit (Owner) ---------- */
const kindOpts = cur => Object.entries(KIND_LABEL).map(([k, l]) => `<option value="${k}" ${cur === k ? "selected" : ""}>${l}</option>`).join("");
function openPunch(id) {
  const p = S.punches.find(x => x.id === id); if (!p) return;
  const loc = p.lat != null ? `<iframe class="map" loading="lazy" src="${mapUrl(p.lat, p.lng)}" title="Peta lokasi punch"></iframe>
    <div class="r"><span class="mute">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.accuracy_m ? ` · ±${Math.round(p.accuracy_m)} m` : ""}</span><a class="sm" href="${gmaps(p.lat, p.lng)}" target="_blank" rel="noopener" style="text-decoration:none">Buka Google Maps</a></div>` : `<p class="mute">Tiada lokasi GPS (punch manual).</p>`;
  const o = sheet(`<div class="r"><h2>${esc(nameOf(p.staff_id))} · ${KIND_LABEL[p.kind]}</h2><button class="sm" data-x>Tutup</button></div>
    <div class="mute">${dayLabel(dayKey(p.punched_at))} · <b style="color:var(--fg)">${hm(p.punched_at)}</b>${p.location_name ? ` · ${esc(p.location_name)} (${p.distance_m} m, ${p.inside ? "dalam kawasan" : "luar kawasan"})` : ""}</div>
    ${p.photo_path ? `<img class="ph-big" data-ph="${esc(p.photo_path)}" src="${esc(S.urls[p.photo_path] || "")}" alt="Selfie">` : ""}
    ${loc}
    ${p.note ? `<div class="notice">Catatan: ${esc(p.note)}</div>` : ""}
    ${p.edited_at ? `<small class="mute">${p.manual ? "Dimasukkan" : "Diubah"} oleh ${esc(nameOf(p.edited_by))} pada ${dayLabel(dayKey(p.edited_at))} ${hm(p.edited_at)}</small>` : ""}
    ${S.owner ? `<button class="btn alt" data-day2>✎ Edit semua rekod hari ini</button>` : ""}`);
  o.querySelector("[data-x]").onclick = () => closeSheet(o);
  const d2 = o.querySelector("[data-day2]"); if (d2) d2.onclick = () => { closeSheet(o); openDay(p.staff_id, dayKey(p.punched_at)); };
  signPhotos([p]);
}
function manualPunch(staffId) { openDay(staffId, S.day || nowKey()); }

// Editor hari (Owner): betulkan semua punch, syif, OT & lewat untuk seorang staff pada satu tarikh, dengan sebab & jejak audit.
async function openDay(sid, k) {
  // sentiasa ambil data terkini untuk staff & tarikh ini
  const [pr, r0, f0] = await Promise.all([
    S.client.from("attendance_punches").select("*").eq("staff_id", sid).gte("punched_at", klIso(k, "00:00")).lt("punched_at", klIso(nextDay(k), "00:00")).order("punched_at"),
    optional(S.client.from("attendance_roster").select("*").eq("staff_id", sid).eq("day", k)),
    optional(S.client.from("attendance_day_flags").select("*").eq("staff_id", sid).eq("day", k))]);
  if (pr.error) return toast(errMsg(pr.error));
  const ps = pr.data || [];
  delete S.roster[sid + "|" + k]; delete S.flags[sid + "|" + k];
  r0.forEach(x => S.roster[sid + "|" + k] = x); f0.forEach(x => S.flags[sid + "|" + k] = x);
  const d = computeDays(ps, sid, k, nextDay(k))[0]; computePay([d], S.pay[sid], sid);
  const f = d.flag || {}, r = (S.roster || {})[sid + "|" + k], rv = r ? (r.shift_id || "rest") : "";
  const act = (S.shifts || []).filter(x => x.active || x.id === r?.shift_id);
  const row = (p, i) => `<div class="er" data-i="${i}"${p ? ` data-id="${esc(p.id)}"` : ""}><select class="field" name="kind">${kindOpts(p?.kind || "in")}</select><input class="field" type="time" name="t" value="${p ? hhmm24(p.punched_at) : ""}" required>
    ${p?.photo_path ? `<img data-ph="${esc(p.photo_path)}" src="${esc(S.urls[p.photo_path] || "")}" alt="" class="th">` : `<span class="th">${p?.manual ? "✎" : p ? "–" : "+"}</span>`}<label class="sw" title="Padam"><input type="checkbox" name="del"> 🗑</label></div>`;
  const o = sheet(`<div class="r"><div><h2>${esc(nameOf(sid))}</h2><div class="mute">${dayLabel(k)} ${k.slice(0, 4)} · ${esc(schedText(d.sched))}</div></div><button class="sm" data-x>Tutup</button></div>
    <div class="r" style="justify-content:flex-start;gap:6px">${dayChips(d) || `<span class="chip">Tiada rekod</span>`}${d.worked ? `<span class="chip">Kerja ${fmtMin(d.worked)}</span>` : ""}</div>
    <form id="f-day" style="display:flex;flex-direction:column;gap:12px">
      <div><label>Syif hari ini</label><select class="field" name="roster"><option value="" ${rv === "" ? "selected" : ""}>Lalai</option><option value="rest" ${rv === "rest" ? "selected" : ""}>Hari rehat</option>${act.map(x => `<option value="${esc(x.id)}" ${rv === x.id ? "selected" : ""}>${esc(x.name)} (${String(x.start_time).slice(0, 5)}–${String(x.end_time).slice(0, 5)})</option>`).join("")}</select></div>
      <div><label>Rekod punch (masa Malaysia)</label><div id="rows" class="pl">${ps.map(row).join("")}</div><button type="button" class="sm" id="addrow" style="margin-top:8px">+ Tambah punch</button></div>
      <div class="g2"><div><label>OT</label><select class="field" name="ot_status"><option value="" ${!f.ot_status ? "selected" : ""}>Ikut kiraan (${fmtMin(d.ot)})</option><option value="approved" ${f.ot_status === "approved" ? "selected" : ""}>Lulus</option><option value="rejected" ${f.ot_status === "rejected" ? "selected" : ""}>Tolak</option></select></div>
        <div><label>Minit OT diluluskan</label><input class="field" type="number" min="0" max="1440" name="ot_min" value="${f.ot_min ?? d.ot}"></div></div>
      <label class="sw"><input type="checkbox" name="late_excused" ${f.late_excused ? "checked" : ""}> Maafkan lewat hari ini${d.lateRaw ? ` (${fmtMin(d.lateRaw)})` : ""}</label>
      <div><label>Sebab perubahan</label><input class="field" name="note" required placeholder="cth: lupa punch balik, disahkan supervisor" value=""></div>
      <button class="btn" type="submit">Simpan</button></form>
    <details id="aud"><summary>Sejarah perubahan</summary><div class="pl" id="audl" style="margin-top:8px"><p class="mute">Memuatkan…</p></div></details>`);
  o.querySelector("[data-x]").onclick = () => closeSheet(o);
  signPhotos(ps);
  let n = ps.length;
  o.querySelector("#addrow").onclick = () => { const kinds = ["in","rest_start","rest_end","out"], last = o.querySelectorAll(".er").length; o.querySelector("#rows").insertAdjacentHTML("beforeend", row(null, n++));
    const el = o.querySelector("#rows").lastElementChild; el.querySelector("[name=kind]").value = last === 0 ? "in" : last % 2 ? "out" : "in"; el.querySelector("[name=t]").value = last === 0 ? hhmmOf(d.sched.start || 540) : hhmmOf(d.sched.end || 1080); };
  o.querySelector("#aud").addEventListener("toggle", async e => { if (!e.target.open) return;
    const { data, error } = await S.client.from("attendance_audit").select("*").eq("staff_id", sid).eq("day", k).order("at", { ascending:false }).limit(50);
    const L = o.querySelector("#audl"); if (error) { L.innerHTML = `<p class="mute">${esc(errMsg(error))}</p>`; return; }
    L.innerHTML = (data || []).map(a => { const nw = a.new_row || {}, od = a.old_row || {}, what = a.tbl === "attendance_punches"
        ? `${a.action === "insert" ? "Tambah" : a.action === "delete" ? "Padam" : "Ubah"} punch ${KIND_LABEL[nw.kind || od.kind] || ""} ${od.punched_at && a.action !== "insert" ? hm(od.punched_at) : ""}${a.action === "update" && nw.punched_at ? " → " + hm(nw.punched_at) : a.action === "insert" ? hm(nw.punched_at) : ""}`
        : `Keputusan: ${nw.ot_status ? "OT " + (nw.ot_status === "approved" ? `lulus ${nw.ot_min ?? ""}m` : "ditolak") : "OT ikut kiraan"}${nw.late_excused ? " · lewat dimaafkan" : ""}`;
      return `<div class="loc"><div class="grow">${esc(what)}<div class="mute">${esc(nameOf(a.actor))} · ${dayLabel(dayKey(a.at))} ${hm(a.at)}${(nw.note || od.note) ? " · " + esc(nw.note || od.note) : ""}</div></div></div>`; }).join("") || `<p class="mute">Tiada perubahan.</p>`; });
  o.querySelector("#f-day").onsubmit = async e => {
    e.preventDefault(); const fm = e.target, btn = fm.querySelector("[type=submit]"), note = fm.note.value.trim(); btn.disabled = true;
    try {
      const ops = [];
      for (const el of o.querySelectorAll(".er")) {
        const id = el.dataset.id, del = el.querySelector("[name=del]").checked, kind = el.querySelector("[name=kind]").value, t = el.querySelector("[name=t]").value;
        if (!id && (del || !t)) continue;
        if (id && del) { ops.push(S.client.from("attendance_punches").delete().eq("id", id)); continue; }
        if (!t) throw new Error("Isi masa untuk setiap punch.");
        const at = klIso(k, t), old = ps.find(p => p.id === id);
        if (id && old && (old.kind !== kind || hhmm24(old.punched_at) !== t)) ops.push(S.client.from("attendance_punches").update({ kind, punched_at:at, note }).eq("id", id));
        if (!id) ops.push(S.client.from("attendance_punches").insert({ staff_id:sid, kind, punched_at:at, manual:true, note }));
      }
      const newR = fm.roster.value;
      if (newR !== rv) ops.push(newR === "" ? S.client.from("attendance_roster").delete().eq("staff_id", sid).eq("day", k)
        : S.client.from("attendance_roster").upsert({ staff_id:sid, day:k, shift_id:newR === "rest" ? null : newR, note }, { onConflict:"staff_id,day" }));
      const otS = fm.ot_status.value || null, otM = fm.ot_min.value === "" ? null : +fm.ot_min.value, lx = fm.late_excused.checked;
      if ((otS || null) !== (f.ot_status || null) || (otS === "approved" && otM !== (f.ot_min ?? null)) || lx !== !!f.late_excused)
        ops.push(S.client.from("attendance_day_flags").upsert({ staff_id:sid, day:k, ot_status:otS, ot_min:otS === "approved" ? otM : null, late_excused:lx, note, decided_by:S.me, decided_at:new Date().toISOString() }, { onConflict:"staff_id,day" }));
      if (!ops.length) { closeSheet(o); return; }
      for (const op of ops) { const { error } = await op; if (error) throw error; }
      closeSheet(o); toast("Rekod hari dikemas kini"); S.loaded = false; render(); loadTab();
    } catch (err) { btn.disabled = false; toast(errMsg(err)); }
  };
}
const hhmm24 = t => { const d = klDate(t); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };

// Staff: tuntut punch tertinggal
function requestPunch(k) {
  const d = (staffMonth(S.me).days || []).find(x => x.key === k), last = d?.list?.[d.list.length - 1];
  const kind = !d?.present ? "in" : last?.kind === "rest_start" ? "rest_end" : "out", sc = schedFor(S.me, k);
  const o = sheet(`<div class="r"><h2>Tuntut punch tertinggal</h2><button class="sm" data-x>Tutup</button></div>
    <p class="mute">Owner akan semak. Selepas diluluskan, punch ini masuk rekod anda (ditanda manual).</p>
    <form id="f-req" style="display:flex;flex-direction:column;gap:10px">
      <div class="g3"><div><label>Jenis</label><select class="field" name="kind">${kindOpts(kind)}</select></div><div><label>Tarikh</label><input class="field" type="date" name="day" value="${k}" max="${nowKey()}" required></div>
      <div><label>Masa</label><input class="field" type="time" name="t" value="${hhmmOf(kind === "in" ? sc.start : sc.end)}" required></div></div>
      <div><label>Sebab</label><input class="field" name="reason" required placeholder="cth: telefon habis bateri, lupa punch balik"></div>
      <button class="btn" type="submit">Hantar tuntutan</button></form>`);
  o.querySelector("[data-x]").onclick = () => closeSheet(o);
  o.querySelector("#f-req").onsubmit = async e => {
    e.preventDefault(); const fm = e.target, at = klIso(fm.day.value, fm.t.value);
    if (new Date(at) > new Date()) return toast("Masa tidak boleh pada masa depan.");
    fm.querySelector("[type=submit]").disabled = true;
    const { error } = await S.client.from("attendance_requests").insert({ staff_id:S.me, kind:fm.kind.value, punched_at:at, reason:fm.reason.value.trim() });
    if (error) { fm.querySelector("[type=submit]").disabled = false; return toast(errMsg(error)); }
    closeSheet(o); toast("Tuntutan dihantar"); await loadRequests(); render();
  };
}
async function saveFlag(sid, k, patch) {
  const cur = (S.flags || {})[sid + "|" + k] || { staff_id:sid, day:k, late_excused:false, ot_status:null, ot_min:null };
  const row = { staff_id:sid, day:k, ot_status:cur.ot_status ?? null, ot_min:cur.ot_min ?? null, late_excused:!!cur.late_excused, note:cur.note ?? null, ...patch, decided_by:S.me, decided_at:new Date().toISOString() };
  const { data, error } = await S.client.from("attendance_day_flags").upsert(row, { onConflict:"staff_id,day" }).select().single(); if (error) throw error;
  S.flags[sid + "|" + k] = data;
}

/* ---------- tetapan ---------- */
function parseCoord(s) {
  s = String(s || ""); const m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  return m ? { lat:+m[1], lng:+m[2] } : null;
}
// Peta interaktif untuk menetapkan lokasi punch staff. Koordinat disimpan melalui borang sedia ada.
let locMap = null, locMarker = null, locMapHost = null, leafletPromise = null;
function loadLocationLeaflet() {
  if (window.L?.map) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-ada-leaflet]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; css.dataset.adaLeaflet = '1';
      document.head.append(css);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => window.L?.map ? resolve(window.L) : reject(new Error('Leaflet tidak tersedia'));
    script.onerror = () => reject(new Error('Peta interaktif tidak dapat dimuatkan'));
    document.head.append(script);
  }).catch(err => { leafletPromise = null; throw err; });
  return leafletPromise;
}
function locPreview() {
  const f = $("#f-loc"), box = $("#locprev"); if (!f || !box) return;
  const selected = parseCoord(f.elements.coord.value);
  const valid = selected && Math.abs(selected.lat) <= 90 && Math.abs(selected.lng) <= 180;
  const center = valid ? selected : { lat: 4.2105, lng: 101.9758 };
  if (!box.querySelector('[data-location-map]')) {
    if (locMap) { locMap.remove(); locMap = null; locMarker = null; }
    box.innerHTML = '<p class="mute" style="margin:4px 0">Tekan peta atau seret pin untuk pilih lokasi. Zum dan gerakkan peta dengan jari.</p><div data-location-map style="height:310px;width:100%;border-radius:12px;overflow:hidden;background:#e6e6e6"></div><p class="mute" data-location-hint style="margin:6px 0">Pilih lokasi pada peta untuk isi koordinat secara automatik.</p>';
  }
  const host = box.querySelector('[data-location-map]');
  if (locMap && locMapHost === host) {
    if (valid) { locMarker.setLatLng([center.lat, center.lng]); locMap.setView([center.lat, center.lng], Math.max(locMap.getZoom(), 15)); }
    return;
  }
  locMapHost = host;
  loadLocationLeaflet().then(L => {
    if (!host.isConnected || $("#locprev")?.querySelector('[data-location-map]') !== host) return;
    if (locMap) { locMap.remove(); locMap = null; }
    locMap = L.map(host, { scrollWheelZoom:false }).setView([center.lat, center.lng], valid ? 17 : 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
    }).addTo(locMap);
    locMarker = L.marker([center.lat, center.lng], { draggable:true, autoPan:true, opacity:valid ? 1 : 0.7 }).addTo(locMap);
    const setCoord = point => {
      const field = $("#f-loc")?.elements.coord; if (!field) return;
      field.value = point.lat.toFixed(6) + ', ' + point.lng.toFixed(6);
      locMarker.setLatLng(point); locMarker.setOpacity(1);
      const hint = $("#locprev")?.querySelector('[data-location-hint]');
      if (hint) hint.textContent = 'Lokasi dipilih: ' + field.value;
    };
    locMap.on('click', e => setCoord(e.latlng));
    locMarker.on('dragend', () => setCoord(locMarker.getLatLng()));
    requestAnimationFrame(() => locMap?.invalidateSize());
  }).catch(() => {
    if (!host.isConnected) return;
    host.innerHTML = valid ? '<iframe class="map" loading="lazy" title="Pratonton lokasi" src="' + mapUrl(center.lat, center.lng) + '"></iframe>' : '';
    const hint = $("#locprev")?.querySelector('[data-location-hint]');
    if (hint) hint.textContent = 'Peta interaktif gagal dimuatkan. Masukkan koordinat secara manual atau guna GPS.';
  });
}
function csv() {
  const rows = [["Staff","Cara gaji","Kadar","Hari hadir","Tidak hadir","Jam kerja","Lewat (kali)","Lewat (minit)","OT biasa (jam)","OT hari rehat (jam)","OT cuti umum (jam)","Gaji asas","Bayaran cuti umum","Potongan tidak hadir","OT (RM)","Elaun","Potongan lewat","Cuti berbayar (hari)","Bayaran cuti","Cuti tanpa gaji (hari)","Potongan cuti tanpa gaji","Potongan advance","Tuntutan","Bersih"]];
  activeStaff().forEach(s => { const { c } = staffMonth(s.id);
    rows.push([s.full_name, c.hasPay ? PAY_LABEL[c.pay.pay_type] : "-", c.pay.rate, c.presentDays, c.absent, (c.workedMin / 60).toFixed(2), c.lateCount, Math.round(c.lateMin), (c.otBy.normal / 60).toFixed(2), (c.otBy.rest / 60).toFixed(2), (c.otBy.ph / 60).toFixed(2), c.base.toFixed(2), c.holidayPay.toFixed(2), c.absentDeduct.toFixed(2), c.otPay.toFixed(2), c.allowance.toFixed(2), c.lateDeduct.toFixed(2), c.paidLeave, c.leavePay.toFixed(2), c.unpaidLeave, c.unpaidDeduct.toFixed(2), c.advDeduct.toFixed(2), c.claimPay.toFixed(2), c.net.toFixed(2)]); });
  const txt = "﻿" + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a2 = document.createElement("a"); a2.href = URL.createObjectURL(new Blob([txt], { type:"text/csv" })); a2.download = `gaji-${S.month}.csv`; a2.click();
}

/* ---------- muat & peristiwa ---------- */
async function loadTab(silent) {
  try {
    if (!S.settings) await loadBase();
    let a, b; const t = nowKey();
    if (S.tab === "today") [a, b] = [S.day, nextDay(S.day)];
    else if (["gaji","rekod","lulus","kalendar"].includes(S.tab)) [a, b] = monthRange(S.month);
    else if (S.tab === "tetapan") [a, b] = [S.week, addDays(S.week, 7)];
    else [a, b] = [t, nextDay(t)];
    S.punches = S.tab === "tetapan" ? [] : await loadPunches(a, b);
    await loadAux(a < t ? a : t, b > addDays(t, 8) ? b : addDays(t, 8));
    if (S.owner || S.tab === "rekod") await loadRequests();
    S.err = "";
  } catch (e) { S.err = errMsg(e); }
  S.loaded = true;
  if (silent && document.activeElement && root.contains?.(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  render();
}
function onClick(e) {
  const t = e.target.closest("[data-tab],[data-act],[data-punch]"); if (!t) return;
  if (t.dataset.tab) { S.tab = t.dataset.tab; S.loaded = false; render(); loadTab(); return; }
  if (t.dataset.punch) return openPunch(t.dataset.punch);
  const a = t.dataset.act, run = async (fn, ok) => { t.disabled = true; try { await fn(); if (ok) toast(ok); render(); } catch (err) { t.disabled = false; toast(errMsg(err)); } };
  if (a === "settingsmenu") { S.settingsMenu = t.dataset.id || ""; S.locEdit = null; S.shEdit = null; render(); }
  else if (a === "reload") { S.settings = null; S.loaded = false; render(); loadTab(); }
  else if (a === "punch") startPunch(t.dataset.kind);
  else if (a === "rest") restPunch(t.dataset.kind, t);
  else if (a === "manual") manualPunch(t.dataset.staff);
  else if (a === "day") openDay(t.dataset.staff, t.dataset.day);
  else if (a === "req") requestPunch(t.dataset.day);
  else if (a === "reqdel") { if (confirm("Batal tuntutan ini?")) run(async () => { const { error } = await S.client.from("attendance_requests").delete().eq("id", t.dataset.id); if (error) throw error; await loadRequests(); }, "Tuntutan dibatalkan"); }
  else if (a === "reqok" || a === "reqno") { const note = a === "reqno" ? prompt("Sebab tolak (pilihan):", "") : null; if (a === "reqno" && note === null) return;
    run(async () => { const { error } = await S.client.rpc("attendance_request_decide", { p_id:t.dataset.id, p_approve:a === "reqok", p_note:note }); if (error) throw error; await loadTab(); }, a === "reqok" ? "Diluluskan — punch ditambah" : "Ditolak"); }
  else if (a === "otok" || a === "otno") { const inp = root.querySelector(`[data-otmin="${t.dataset.staff}|${t.dataset.day}"]`);
    run(() => saveFlag(t.dataset.staff, t.dataset.day, a === "otok" ? { ot_status:"approved", ot_min:inp ? +inp.value : null } : { ot_status:"rejected", ot_min:null }), a === "otok" ? "OT diluluskan" : "OT ditolak"); }
  else if (a === "otall") { if (!confirm("Luluskan semua OT dalam senarai ini?")) return;
    run(async () => { for (const inp of root.querySelectorAll("[data-otmin]")) { const [sid, k] = inp.dataset.otmin.split("|"); await saveFlag(sid, k, { ot_status:"approved", ot_min:+inp.value }); } }, "Semua OT diluluskan"); }
  else if (a === "excuse") run(() => saveFlag(t.dataset.staff, t.dataset.day, { late_excused:true }), "Lewat dimaafkan");
  else if (a === "togglepay") { S.payOpen[t.dataset.staff] = !S.payOpen[t.dataset.staff]; render(); }
  else if (a === "csv") csv();
  else if (a === "report") printReport(t.dataset.staff ? [t.dataset.staff] : activeStaff().map(s => s.id));
  else if (a === "dayshift") { S.day = addDays(S.day, +t.dataset.n); S.loaded = false; render(); loadTab(); }
  else if (a === "wk") { S.week = addDays(S.week, +t.dataset.n); S.loaded = false; render(); loadTab(); }
  else if (a === "here") {
    if (!navigator.geolocation) return toast("GPS tidak disokong"); t.disabled = true; t.textContent = "Mencari lokasi…";
    navigator.geolocation.getCurrentPosition(p => { const f = $("#f-loc"); f.coord.value = `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`; t.disabled = false; t.textContent = `📍 Lokasi didapati (±${Math.round(p.coords.accuracy)} m)`; locPreview(); },
      () => { t.disabled = false; t.textContent = "📍 Guna lokasi saya sekarang"; toast("Lokasi tidak dapat dikesan"); }, { enableHighAccuracy:true, timeout:20000, maximumAge:0 });
  }
  else if (a === "locedit") { S.locEdit = t.dataset.id; render(); locPreview(); $("#f-loc")?.scrollIntoView({block:"nearest",behavior:"smooth"}); }
  else if (a === "loccancel") { S.locEdit = null; render(); }
  else if (a === "loctoggle" || a === "locdel") {
    const l = S.locs.find(x => x.id === t.dataset.id); if (!l) return;
    if (a === "locdel" && !confirm(`Padam lokasi "${l.name}"?`)) return;
    run(async () => {
      if (a === "locdel") { const { error } = await S.client.from("attendance_locations").delete().eq("id", l.id); if (error) throw error; S.locs = S.locs.filter(x => x !== l); if (S.locEdit === l.id) S.locEdit = null; }
      else { const { error } = await S.client.from("attendance_locations").update({ active:!l.active }).eq("id", l.id); if (error) throw error; l.active = !l.active; }
    });
  }
  else if (a === "shedit") { S.shEdit = t.dataset.id; render(); root.querySelector("#f-shift")?.scrollIntoView({ block:"nearest", behavior:"smooth" }); root.querySelector("#f-shift [name=name]")?.focus(); }
  else if (a === "shcancel") { S.shEdit = null; render(); }
  else if (a === "shtoggle" || a === "shdel") {
    const sh = shiftById(t.dataset.id); if (!sh) return;
    if (a === "shdel" && !confirm(`Padam syif "${sh.name}"?${staffUsing(sh.id) ? ` ${staffUsing(sh.id)} staff guna syif ini.` : ""} Staff dalam syif ini kembali ke waktu kerja umum dan jadual tarikh yang guna syif ini dibuang.`)) return;
    run(async () => {
      if (a === "shdel") { const { error } = await S.client.from("attendance_shifts").delete().eq("id", sh.id); if (error) throw error; if (S.shEdit === sh.id) S.shEdit = null; S.shifts = S.shifts.filter(x => x !== sh); Object.values(S.astaff).forEach(x => { if (x.shift_id === sh.id) x.shift_id = null; }); }
      else { const { error } = await S.client.from("attendance_shifts").update({ active:!sh.active }).eq("id", sh.id); if (error) throw error; sh.active = !sh.active; }
    });
  }
  else if (a === "holdel") { if (!confirm("Padam cuti ini?")) return;
    run(async () => { const { error } = await S.client.from("attendance_holidays").delete().eq("day", t.dataset.day); if (error) throw error; delete S.holidays[t.dataset.day]; }, "Cuti dipadam"); }
}
async function onChange(e) {
  const t = e.target;
  if (t.name === "late_mode") { const f = t.closest("form") || t.closest("details") || app; const r = f.querySelector("[data-late-rate]"), n = f.querySelector("[data-late-note]"); if (r) r.hidden = t.value === "pay_rate" || t.value === "none"; if (n) n.hidden = t.value !== "pay_rate"; return; }
  if (t.id === "month" && t.value) { S.month = t.value; S.loaded = false; render(); loadTab(); }
  else if (t.id === "day" && t.value) { S.day = t.value; S.loaded = false; render(); loadTab(); }
  else if (t.dataset.roster) {
    const [sid, k] = t.dataset.roster.split("|"), v = t.value; t.disabled = true;
    const { error } = v === "" ? await S.client.from("attendance_roster").delete().eq("staff_id", sid).eq("day", k)
      : await S.client.from("attendance_roster").upsert({ staff_id:sid, day:k, shift_id:v === "rest" ? null : v }, { onConflict:"staff_id,day" });
    if (error) { t.disabled = false; return toast(errMsg(error)); }
    if (v === "") delete S.roster[sid + "|" + k]; else S.roster[sid + "|" + k] = { staff_id:sid, day:k, shift_id:v === "rest" ? null : v };
    toast("Jadual disimpan"); render();
  }
}
function onInput(e) { if (e.target.name === "coord") locPreview(); }
function onToggle(e) { const d = e.target.closest?.("details[data-pd]"); if (d) S.payOpen["f" + d.dataset.pd] = d.open; }
async function onSubmit(e) {
  const f = e.target; if (f.id === "f-day" || f.id === "f-req") return;
  e.preventDefault();
  const btn = f.querySelector("[type=submit]"); const fd = new FormData(f); btn && (btn.disabled = true);
  try {
    if (f.id === "f-set") {
      const v = { work_start:fd.get("work_start"), work_end:fd.get("work_end"), work_days:fd.getAll("wd").map(Number), grace_min:+fd.get("grace_min") || 0, ot_min_minutes:+fd.get("ot_min_minutes") || 0,
        break_min:+fd.get("break_min") || 0, ot_restday_mult:+fd.get("ot_restday_mult") || 1, ot_ph_mult:+fd.get("ot_ph_mult") || 1,
        ot_offday_all:fd.has("ot_offday_all"), ot_require_approval:fd.has("ot_require_approval"), allow_rest_punch:fd.has("allow_rest_punch"),
        enforce_geofence:fd.has("enforce_geofence"), require_selfie:fd.has("require_selfie"), updated_at:new Date().toISOString() };
      if (tMin(v.work_end) <= tMin(v.work_start)) throw new Error("Waktu balik mesti selepas waktu masuk.");
      const { data, error } = await S.client.from("attendance_settings").update(v).eq("id", 1).select().single(); if (error) throw error; S.settings = { ...S.settings, ...data }; toast("Tetapan disimpan");
    } else if (f.id === "f-loc") {
      const c = parseCoord(fd.get("coord")); if (!c) throw new Error("Masukkan koordinat atau tekan 'Guna lokasi saya sekarang'.");
      const v = { name:String(fd.get("name")).trim(), radius_m:Number(fd.get("radius_m")), lat:c.lat, lng:c.lng };
      if (!v.name || !Number.isInteger(v.radius_m) || v.radius_m < 10 || v.radius_m > 5000 || Math.abs(c.lat)>90 || Math.abs(c.lng)>180) throw new Error("Nama, radius atau koordinat tidak sah.");
      const editId = S.locEdit;
      const q = S.client.from("attendance_locations");
      const { data, error } = await (editId ? q.update(v).eq("id", editId) : q.insert(v)).select().single(); if (error) throw error;
      if (editId) { S.locs = S.locs.map(x => x.id === editId ? data : x); S.locEdit = null; toast("Lokasi dikemas kini"); } else { S.locs.push(data); toast("Lokasi ditambah"); }
    } else if (f.classList.contains("f-staffgps")) {
      if(!S.owner)throw new Error("Hanya Owner boleh menetapkan lokasi.");
      const sid=f.dataset.staff;
      if(!S.staff.some(s=>s.id===sid&&s.enabled!==false&&s.role!=="owner"))throw new Error("Staf tidak sah.");
      const mode=fd.get("mode");
      if(!["global","individual","anywhere"].includes(mode))throw new Error("Kaedah lokasi tidak sah.");
      const ids=mode==="individual"?[...new Set(fd.getAll("locid"))]:null;
      if(ids!==null&&(!ids.length||ids.some(id=>!S.locs.some(l=>l.id===id&&l.active))))throw new Error("Pilih sekurang-kurangnya satu lokasi aktif.");
      const patch={allowed_location_ids:ids,allow_punch_anywhere:mode==="anywhere",updated_at:new Date().toISOString()};
      const q=S.client.from("attendance_staff");
      const {data,error}=await (S.astaff[sid]?q.update(patch).eq("staff_id",sid):q.insert({staff_id:sid,...patch})).select().single();
      if(error)throw error;S.astaff[sid]=data;toast("Lokasi staf disimpan");
    } else if (f.id === "f-shift") {
      const v = { name:String(fd.get("name")).trim(), start_time:fd.get("start_time"), end_time:fd.get("end_time"), break_min:+fd.get("break_min") || 0, color:fd.get("color") || "#e8b10b" };
      if (tMin(v.end_time) <= tMin(v.start_time)) throw new Error("Waktu balik syif mesti selepas waktu masuk.");
      if (S.shEdit) {
        const { data, error } = await S.client.from("attendance_shifts").update(v).eq("id", S.shEdit).select().single(); if (error) throw error;
        S.shifts = S.shifts.map(x => x.id === data.id ? data : x).sort((x, y) => String(x.start_time).localeCompare(String(y.start_time))); S.shEdit = null; toast("Syif dikemas kini");
      } else { const { data, error } = await S.client.from("attendance_shifts").insert(v).select().single(); if (error) throw error; S.shifts.push(data); toast("Syif ditambah"); }
    } else if (f.id === "f-hol") {
      const v = { day:fd.get("day"), name:String(fd.get("name")).trim(), kind:fd.get("kind") };
      const { data, error } = await S.client.from("attendance_holidays").upsert(v, { onConflict:"day" }).select().single(); if (error) throw error; S.holidays[data.day] = data; toast("Cuti ditambah");
    } else if (f.classList.contains("f-pay")) {
      const id = f.dataset.staff;
      const v = { staff_id:id, pay_type:fd.get("pay_type"), rate:+fd.get("rate") || 0, ot_rate:+fd.get("ot_rate") || 0, late_mode:fd.get("late_mode"), late_rate:+fd.get("late_rate") || 0, monthly_workdays:+fd.get("monthly_workdays") || 26, allowance:+fd.get("allowance") || 0, updated_at:new Date().toISOString() };
      const { data, error } = await S.client.from("staff_pay").upsert(v, { onConflict:"staff_id" }).select().single(); if (error) throw error;
      S.pay[id] = data;
      const as = { staff_id:id, shift_id:fd.get("shift_id") || null, work_days:fd.has("own_days") ? fd.getAll("swd").map(Number) : null, updated_at:new Date().toISOString() };
      const r2 = await S.client.from("attendance_staff").upsert(as, { onConflict:"staff_id" }).select().single(); if (r2.error) throw r2.error;
      S.astaff[id] = r2.data; S.payOpen["f" + id] = false; toast("Disimpan");
    }
    render();
  } catch (err) { toast(errMsg(err)); btn && (btn.disabled = false); }
}

/* host = elemen kosong dalam #ada-cloud-view. ctx = {client, profile} */
// Slip gaji seorang staff untuk satu bulan (dipakai oleh Profil Saya & Profil staff). Keadaan modul dipulihkan selepas kira.
export async function computeSlip(client, profile, staffId, month) {
  const keep = { ...S };
  try {
    Object.assign(S, { client, profile, me: profile?.id, owner: profile?.role === "owner", month, settings: null });
    await loadBase();
    const [a, b] = monthRange(month);
    await loadAux(a, b);
    const { data, error } = await client.from("attendance_punches").select("*").eq("staff_id", staffId).gte("punched_at", klIso(a, "00:00")).lt("punched_at", klIso(b, "00:00")).order("punched_at", { ascending:true }).limit(3000);
    if (error) throw error;
    const days = computeDays(data || [], staffId, a, b), c = computePay(days, S.pay[staffId], staffId), st = S.settings;
    const lines = [];
    if (c.hasPay) {
      lines.push(["Gaji asas (" + PAY_LABEL[c.pay.pay_type] + ")", c.baseNote, c.base]);
      if (c.holidayPay) lines.push(["Bayaran cuti umum", c.phDays + " hari", c.holidayPay]);
      if (c.leavePay) lines.push(["Bayaran cuti berbayar", c.paidLeave + " hari", c.leavePay]);
      if (c.otPayBy.normal || c.otBy.normal) lines.push(["Kerja lebih masa (OT)", (c.otBy.normal / 60).toFixed(2) + " jam × " + rm(c.pay.ot_rate), c.otPayBy.normal]);
      if (c.otBy.rest) lines.push(["OT hari rehat", (c.otBy.rest / 60).toFixed(2) + " jam × " + rm(c.pay.ot_rate) + " × " + (+st.ot_restday_mult), c.otPayBy.rest]);
      if (c.otBy.ph) lines.push(["OT cuti umum", (c.otBy.ph / 60).toFixed(2) + " jam × " + rm(c.pay.ot_rate) + " × " + (+st.ot_ph_mult), c.otPayBy.ph]);
      if (c.allowance) lines.push(["Elaun tetap", "", c.allowance]);
      if (c.claimPay) lines.push(["Tuntutan (claim)", c.claims.length + " resit", c.claimPay]);
      if (c.absentDeduct) lines.push(["Potongan tidak hadir", c.absent + " hari", -c.absentDeduct]);
      if (c.unpaidDeduct) lines.push(["Potongan cuti tanpa gaji", c.unpaidLeave + " hari", -c.unpaidDeduct]);
      if (c.lateDeduct) lines.push(c.pay.late_mode === "pay_rate" ? ["Potongan kurang jam (8 jam/hari)", c.shortDays + " hari · " + Math.round(c.shortMin) + " min × " + rm(c.latePerMin), -c.lateDeduct] : ["Potongan lewat", c.lateCount + " kali · " + Math.round(c.lateMin) + " min", -c.lateDeduct]);
      c.adv.forEach(x => lines.push(["Potongan advance", "ansuran " + x.n + "/" + x.of + (x.note ? " · " + x.note : ""), -x.amt]));
    }
    const rows = days.filter(d => d.present || (d.workday && !d.future) || d.type === "ph").map(d => ({ label: dayLabel(d.key), in: d.firstIn ? hm(d.firstIn.punched_at) : "–", out: d.lastOut ? hm(d.lastOut.punched_at) : "–", worked: d.worked ? fmtMin(d.worked) : "–",
      note: [d.type === "ph" ? d.sched.ph.name : "", d.leave ? (LEAVE_NAME[d.leave.kind] || "Cuti") : (!d.present && d.workday ? "Tidak hadir" : ""), d.late ? "Lewat " + fmtMin(d.late) : "", d.ot ? "OT " + fmtMin(d.otStatus === "approved" ? d.otPaid : d.ot) + (d.otStatus === "pending" && st.ot_require_approval ? " (menunggu)" : d.otStatus === "rejected" ? " (ditolak)" : "") : "", d.rest ? "Rehat " + fmtMin(d.rest) : "", d.open && d.key < nowKey() ? "Tiada punch balik" : ""].filter(Boolean).join(" · ") }));
    return { c, lines, rows, stats: { present: c.presentDays, absent: c.absent, worked: fmtMin(c.workedMin), late: c.lateCount, lateMin: fmtMin(c.lateMin), ot: fmtMin(c.otMin), paidLeave: c.paidLeave, unpaidLeave: c.unpaidLeave } };
  } finally { Object.assign(S, keep); }
}

export function mountKehadiran(host, ctx) {
  S.client = ctx.client; S.profile = ctx.profile; S.me = ctx.profile?.id; S.owner = ctx.profile?.role === "owner";
  if (!S.day) S.day = nowKey(); if (!S.month) S.month = nowKey().slice(0, 7); if (!S.week) S.week = weekStart(nowKey());
  if (!S.tabSet) { S.tab = S.owner ? "papan" : "punch"; S.tabSet = true; }
  if (!S.owner && !["punch","rekod"].includes(S.tab)) S.tab = "punch";
  document.documentElement.classList.remove("ada-sheet-open");
  root = host.shadowRoot || host.attachShadow({ mode:"open" });
  root.innerHTML = `<style>${CSS}</style><div class="shell"><div class="wrap" id="app"></div></div>`;
  app = root.getElementById("app");
  app.addEventListener("click", onClick); app.addEventListener("change", onChange); app.addEventListener("input", onInput);
  app.addEventListener("submit", onSubmit); app.addEventListener("toggle", onToggle, true);
  clearInterval(clockTimer); tickN = 0;
  clockTimer = setInterval(() => { if (!host.isConnected) return clearInterval(clockTimer); tickClock();
    if (++tickN % 4 === 0 && S.tab === "papan" && S.loaded && document.visibilityState === "visible" && !root.querySelector(".ov")) loadTab(true); }, 15000);
  S.settings = null; S.loaded = false; render(); loadTab();
  window.__adaLive?.(host, ["attendance_punches","attendance_requests","attendance_day_flags","staff_leaves"], () => loadTab(true), () => !!root.querySelector(".ov"));
}
