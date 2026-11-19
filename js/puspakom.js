// Abe Din Auto – modul Puspakom (V72). Status pemeriksaan B5 / B7 untuk setiap kereta dalam inventori.
// Dimuat oleh app.html melalui import("./js/puspakom.js"). Jadual: puspakom (lihat V72_PUSPAKOM.sql).
// Semua kereta inventori (kecuali Sold) dipaparkan secara automatik; yang belum ada rekod = "Belum tempah".
// Owner, Sales Advisor dan staf Operations aktif boleh edit semua rekod; padam hanya Owner. UI dalam Shadow DOM.
const CSS = `
:host{display:block;--bg:#0a0a09;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;
  --y:#f5c400;--y-soft:#2e2608;--y-ink:#ffd84d;--red:#3a1513;--red-ink:#ffaaa4;--ok:#3fae6b;
  --f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f)}
button,input,select,textarea{font:inherit;color:inherit}
h2{margin:0;font-size:20px;font-weight:800}
.kick{font-size:11px;letter-spacing:.14em;color:var(--y);font-weight:700;text-transform:uppercase}
.mute{color:var(--mute);font-size:13px}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.btn{border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:10px 14px;font-weight:800;font-size:14px;cursor:pointer}
.btn.pri{background:var(--y);border-color:var(--y);color:#0b0b0b}
.btn.bad{background:var(--red);border-color:#6b2420;color:var(--red-ink)}
.btn:disabled{opacity:.55}
.panel{background:#000;border:1px solid #3a3007;border-radius:16px;padding:14px;margin-bottom:14px}
.panel-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.panel-h b{color:var(--y);font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.slot{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #262626;font-size:14px;cursor:pointer}
.slot:first-of-type{border-top:0}
.slot .tm{width:92px;flex:none;font-weight:800;color:var(--y)}
.slot .pl{font-weight:800;letter-spacing:.04em}
.slot .lc{color:#aaa;font-size:12.5px;margin-left:auto;text-align:right}
.slot.done .tm,.slot.done .pl{opacity:.45;text-decoration:line-through}
.slot.late .tm{color:#ff8a7a}
.none{color:#aaa;font-size:13.5px}
.soon{font-size:12.5px;color:#aaa;margin-top:8px}
.panel .btn{width:100%;margin-top:10px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
@media(min-width:760px){.stats{grid-template-columns:repeat(6,1fr)}}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:11px;cursor:pointer}
.stat.on{border-color:var(--y);box-shadow:0 0 0 1px var(--y) inset;background:var(--y-soft)}
.stat .n{font-size:22px;font-weight:800}.stat .l{font-size:12px;color:var(--mute);font-weight:600}
.stat.warn .n{color:var(--red-ink)}
.locs{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;scrollbar-width:none}
.loc{flex:none;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer}
.loc.on{background:var(--y);color:#0b0b0b;border-color:var(--y)}
.search{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:16px;margin-bottom:14px}
.grp{margin-bottom:18px}
.grp-h{display:flex;justify-content:space-between;align-items:center;background:#000;border:1px solid #3a3007;color:var(--y);font-weight:800;font-size:13.5px;letter-spacing:.05em;text-transform:uppercase;padding:10px 14px;border-radius:12px;margin-bottom:10px}
.grp-n{background:var(--y);color:#0b0b0b;border-radius:999px;min-width:26px;text-align:center;padding:2px 8px;font-size:13px}
.list{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.car{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--y);border-radius:14px;padding:13px}
.top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.plate{display:inline-block;font-weight:800;font-size:15px;letter-spacing:.06em;background:#000;color:#fff;padding:3px 10px;border-radius:7px;border:1.5px solid #555}
.vid{font-size:11.5px;font-weight:800;color:var(--mute);margin-left:6px}
.model{font-weight:700;font-size:14px;margin-top:6px}
.meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;align-items:center}
.pill{font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap}
.p-belum{background:var(--soft);color:var(--fg);border:1px solid var(--line)}.p-tempah{background:var(--y-soft);color:var(--y-ink)}
.p-lulus{background:#12321f;color:#8ce3ad}.p-gagal{background:var(--red);color:var(--red-ink)}
.p-B5{background:var(--y-soft);color:var(--y-ink)}.p-B7{background:#000;color:var(--y);border:1px solid #444}.p-B5B7{background:var(--y);color:#0b0b0b}
.date{font-size:13px;color:var(--mute);font-weight:600}
.tag{font-size:11px;font-weight:800;background:var(--y);color:#0b0b0b;border-radius:6px;padding:1px 6px;margin-left:4px}
.where,.runner{font-size:13px;color:var(--mute);font-weight:600;margin-top:6px}
.warnline{font-size:12.5px;font-weight:700;color:var(--red-ink);margin-top:6px}
.todo{margin-top:9px;padding:9px 11px;border-radius:11px;background:var(--y-soft);font-size:13.5px;font-weight:600;display:flex;gap:8px}
.todo.alert{background:var(--red);color:var(--red-ink)}
.expiry{margin-top:11px;border:1px solid #356446;border-radius:12px;padding:12px;background:#10291b;display:grid;gap:9px}
.expiry-head,.expiry-dates{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.expiry-head strong{color:#b9f7cd;font-size:17px;font-weight:800}
.expiry-head span,.expiry-dates{color:#c7d1ca;font-size:11px}
.expiry-dates b{color:#fff}
.expiry-bar{height:9px;border-radius:100px;background:#253a2e;overflow:hidden}
.expiry-bar i{display:block;height:100%;background:#4ac27a;border-radius:100px}
.expiry-warning{background:#332b13;border-color:#92712d;color:#ffe5a2}
.expiry-warning .expiry-head strong{color:#ffe5a2}.expiry-warning .expiry-bar i{background:#efc366}
.expiry-urgent,.expiry-expired{background:#381c1b;border-color:#ac5149}
.expiry-urgent .expiry-head strong,.expiry-expired .expiry-head strong{color:#ffb1a9}
.expiry-urgent .expiry-bar i,.expiry-expired .expiry-bar i{background:#e76d62}

.note{font-size:13px;color:var(--mute);margin-top:7px;white-space:pre-wrap}
.docs,.acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.doc{border:1px dashed var(--line);background:transparent;color:var(--mute);border-radius:8px;padding:5px 9px;font-size:12px;font-weight:700;cursor:pointer}
.doc.ok{border:1px solid var(--y);background:var(--y-soft);color:var(--fg)}
.chip{border:1px solid var(--line);background:transparent;border-radius:10px;padding:6px 10px;font-size:12.5px;font-weight:700;cursor:pointer}
.chip.cur{background:var(--y);color:#0b0b0b;border-color:var(--y)}
.edit{background:none;border:0;color:var(--mute);font-size:13px;font-weight:800;cursor:pointer;padding:4px}
.ro .acts,.ro .edit{display:none}.ro .doc{cursor:default}
.more{width:100%;margin-top:8px}
.empty{text-align:center;padding:30px;color:var(--mute);background:var(--card);border:1px dashed var(--line);border-radius:14px}
.ov{font:15px/1.45 var(--f);color:var(--fg);position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:flex-end;justify-content:center;z-index:9999}
.ov.show{display:flex}@media(min-width:640px){.ov{align-items:center}}
.sheet{background:var(--card);border:1px solid var(--line);width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px;max-height:92vh;overflow:auto}
@media(min-width:640px){.sheet{border-radius:18px}}
.sheet h3{margin:0 0 4px;font-size:18px}
label{display:block;font-size:11.5px;color:var(--mute);margin:12px 0 6px;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.field{display:block;width:100%;min-width:0;height:46px;border:1px solid var(--line);background:var(--soft);border-radius:11px;padding:0 12px;font-size:16px;-webkit-appearance:none;appearance:none}
textarea.field{height:auto;min-height:70px;padding:10px 12px}
.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.seg.s2{grid-template-columns:repeat(2,1fr)}
.seg button{height:44px;border-radius:11px;border:1px solid var(--line);background:var(--soft);font-size:14px;font-weight:700;cursor:pointer}
.seg button.sel{background:var(--y);color:#0b0b0b;border-color:var(--y)}
.row{display:flex;gap:8px;margin-top:16px}.row .btn{flex:1}
.err{color:var(--red-ink);font-size:13px;margin-top:8px;min-height:1em}
.copybox{width:100%;min-height:220px;font-size:13px;font-family:ui-monospace,Menlo,monospace;border:1px solid var(--line);background:var(--soft);border-radius:11px;padding:10px}
.toast{font:15px/1.45 var(--f);position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:var(--y);color:#0b0b0b;font-weight:800;padding:10px 16px;border-radius:12px;display:none;z-index:10000}

/* --- Kad dikemas (v3): warna ikut status --- */
.list{gap:12px;grid-template-columns:repeat(auto-fill,minmax(310px,1fr))}
.car{--sc:#6b6b6b;background:#131311;border:1px solid #2a2722;border-left:0;border-radius:16px;padding:14px 14px 12px;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:10px}
.car::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--sc)}
.car.st-tempah{--sc:#4f8ff7}.car.st-lulus{--sc:#34b36b}.car.st-gagal{--sc:#e5534b}.car.st-belum{--sc:#6b6b6b}
.car.is-alert{border-color:#6b2420;box-shadow:0 0 0 1px #6b2420 inset}
.top{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
.id{display:flex;align-items:center;gap:8px}
.plate{font-size:15px;padding:4px 10px;border-radius:7px;background:#000;border:1.5px solid #6d6d6d;color:#fff;letter-spacing:.07em}
.vid{margin:0;font-size:12px;color:#8c8778}
.badges{display:flex;gap:5px;flex-wrap:wrap}
.pill{font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:999px;letter-spacing:.02em}
.p-belum{background:#26241f;color:#cfc8b6;border:1px solid #3a372f}
.p-tempah{background:#13233f;color:#9cc2ff;border:1px solid #2b4a7e}
.p-lulus{background:#10301e;color:#8ce3ad;border:1px solid #1f5a37}
.p-gagal{background:#3a1513;color:#ffaaa4;border:1px solid #6b2420}
.p-B5{background:#2e2608;color:#ffd84d;border:1px solid #5a4a10}.p-B7{background:#000;color:#ffd84d;border:1px solid #5a4a10}.p-B5B7{background:#f5c400;color:#0b0b0b;border:1px solid #f5c400}
.model{margin:0;font-size:14.5px;font-weight:800;letter-spacing:.01em;color:#f4efe2;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.yr{font-size:12.5px;font-weight:700;color:#8c8778}
.invrow{display:flex;gap:6px;flex-wrap:wrap}
.inv{font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:7px;background:#26241f;color:#cfc8b6}
.inv-sold{background:#2a1d3d;color:#cdb2ff}.inv-res{background:#3d2d0c;color:#ffcc66}.inv-warn{background:#3a1513;color:#ffaaa4}
.appt{display:flex;gap:12px;align-items:center;background:#0c0c0b;border:1px solid #2a2722;border-radius:12px;padding:9px 11px}
.cal{flex:none;width:50px;border-radius:10px;overflow:hidden;text-align:center;background:#1b1a17;border:1px solid #3a372f}
.cal b{display:block;font-size:21px;line-height:1.15;padding-top:4px;color:#fff}
.cal span{display:block;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:var(--sc);color:#fff;padding:2px 0}
.appt-i{min-width:0;display:flex;flex-direction:column;gap:2px}
.appt-t{font-size:15px;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.appt-s{font-size:13px;color:#b3ad9c;font-weight:600}.appt-s.pad{padding:0 2px}
.tag{margin:0;font-size:11px;font-weight:900;border-radius:6px;padding:2px 7px}
.tag.t-today{background:#e5534b;color:#fff}.tag.t-soon{background:#f5c400;color:#0b0b0b}
.todo{margin:0;padding:9px 11px;border-radius:10px;background:#1b1a17;border:1px solid #2a2722;color:#e8e2d2;font-size:13px;font-weight:600;line-height:1.4;align-items:flex-start}
.todo .ti{flex:none;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:900;background:var(--sc);color:#fff;margin-top:-1px}
.todo.alert{background:#2a1110;border-color:#6b2420;color:#ffc9c4}.todo.alert .ti{background:#e5534b}
.note{margin:0;font-size:12.5px;color:#9e988a;font-style:italic}
.docs{margin:0;align-items:center;gap:5px}
.dl{font-size:11.5px;font-weight:800;color:#ffaaa4;margin-right:2px}.dl.all{color:#8ce3ad}
.doc{border:1px dashed #4a463c;color:#9e988a;border-radius:8px;padding:4px 9px;font-size:12px}
.doc.ok{border:1px solid #1f5a37;background:#10301e;color:#8ce3ad}
.foot{display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;border-top:1px solid #24221d;padding-top:10px;margin-top:2px}
.acts{margin:0;gap:5px}
.chip{border-radius:9px;padding:5px 9px;font-size:12px;color:#b3ad9c}
.chip.cur{background:var(--sc);border-color:var(--sc);color:#fff}
.edit{border:1px solid #3a372f;border-radius:9px;padding:5px 11px;color:#f4efe2;font-size:12.5px}
.ro .foot{display:none}
.grp-h{background:#0c0c0b;border-color:#2a2722;color:#f4efe2}
.car .plate{font-size:18px;font-weight:900;letter-spacing:.1em;padding:5px 12px;border-radius:8px;background:#000;color:#fff;border:2px solid #f5c400;box-shadow:0 0 0 3px rgba(245,196,0,.12)}
.slot .pl{font-size:15px;font-weight:900;letter-spacing:.08em;color:#fff}
`;
const TYPES = [{v:"B5",l:"B5 (MV15)",c:"p-B5"},{v:"B7",l:"B7",c:"p-B7"},{v:"B5+B7",l:"B5 + B7",c:"p-B5B7"}];
const STATUSES = [{v:"belum",l:"Belum tempah"},{v:"tempah",l:"Booking"},{v:"lulus",l:"✓ Lulus"},{v:"gagal",l:"Gagal"}];
const myStatuses = () => STATUSES;
const GROUPS = [{v:"tempah",t:"📅 Booking"},{v:"lulus",t:"✓ Lulus"},{v:"gagal",t:"✕ Gagal"},{v:"belum",t:"⏳ Belum tempah"}];
const DOCS = [{k:"geran",l:"Geran"},{k:"ic",l:"IC pemilik"},{k:"sk",l:"Surat kuasa"}];
const NEGERI = ["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu","WP Kuala Lumpur","WP Labuan","WP Putrajaya"];
const MONTHS = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"];
const VALID_DAYS = 120;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normPlate = p => String(p || "").toUpperCase().replace(/\s+/g, "");
const find = (a, v) => a.find(x => x.v === v) || a[0];
const pad = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const todayStr = () => ymd(new Date());
const addDays = (s, n) => { const p = s.split("-"); return ymd(new Date(+p[0], +p[1] - 1, +p[2] + n)); };
const daysBetween = (a, b) => { const pa = a.split("-"), pb = b.split("-"); return Math.round((Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / 86400000); };
// V83: operational 120-day countdown starts at the recorded Puspakom booking/inspection date, only after Lulus.
const expiryTodayMY = () => {
  const parts = new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kuala_Lumpur",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get = type => parts.find(p=>p.type===type)?.value;
  return get("year")+"-"+get("month")+"-"+get("day");
};
const expiryInfo = (c, today = expiryTodayMY()) => {
  if (c.status !== "lulus" || !c.date || !/^\d{4}-\d{2}-\d{2}$/.test(c.date)) return null;
  const [y,m,d] = c.date.split("-").map(Number);
  if (new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10) !== c.date) return null;
  const expiry = addDays(c.date, VALID_DAYS), left = daysBetween(today, expiry);
  return { expiry, left, elapsed: Math.max(0, Math.min(VALID_DAYS, VALID_DAYS - left)),
    tone: left < 0 ? "expired" : left <= 14 ? "urgent" : left <= 30 ? "warning" : "valid" };
};
const expiryPanel = c => {
  if (c.status !== "lulus") return "";
  const x = expiryInfo(c);
  if (!x) return '<div class="expiry expiry-warning">Tarikh booking/pemeriksaan diperlukan untuk kira tamat tempoh 120 hari.</div>';
  const label = x.left < 0 ? "Tamat tempoh" : x.left === 0 ? "Tamat hari ini" : x.left + " hari lagi";
  const pct = Math.round(x.elapsed / VALID_DAYS * 100);
  return '<div class="expiry expiry-' + x.tone + '" aria-label="Tempoh sah 120 hari"><div class="expiry-head"><strong>' + label +
    '</strong><span>' + pct + '% tempoh berlalu</span></div><div class="expiry-bar"><i style="width:' + pct +
    '%"></i></div><div class="expiry-dates"><span>Booking: <b>' + esc(fmtDate(c.date)) + '</b></span><span>Tamat: <b>' +
    esc(fmtDate(x.expiry)) + '</b></span></div></div>';
};
const fmtDate = s => { if (!s) return ""; const p = s.split("-"); return (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0]; };
const fmtTime = t => { if (!t) return ""; const [hs, ms = "00"] = t.split(":"); const h = +hs; const part = h < 12 ? "pagi" : h < 14 ? "tengah hari" : h < 19 ? "petang" : "malam"; return (h % 12 || 12) + (ms !== "00" ? ":" + ms : "") + " " + part; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const tMin = t => { const p = t.split(":"); return +p[0] * 60 + +p[1]; };
const dayLabel = s => { const d = daysBetween(todayStr(), s); return d === 0 ? "Hari ini" : d === 1 ? "Esok" : d === 2 ? "Lusa" : ""; };

let S = null;

export function mountPuspakom(host, ctx) {
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><div class="shell" id="app"></div><div class="ov" id="ov"></div><div class="toast" id="toast"></div>`;
  S = { root, client: ctx.client, profile: ctx.profile || {}, vehicles: Array.isArray(ctx.vehicles) ? ctx.vehicles : [],
    rows: [], loaded: false, err: "", filter: "semua", loc: "semua", q: "", expanded: {}, busy: false };
  S.isOwner = S.profile.role === "owner";
  S.canEdit = S.isOwner || S.profile.role === "sales_advisor" || S.profile.role === "operations";
  root.getElementById("app").addEventListener("click", onClick);
  root.getElementById("app").addEventListener("input", e => { if (e.target.id === "q") { S.q = e.target.value; renderList(); } });
  render();
  load();
  clearInterval(mountPuspakom._t);
  mountPuspakom._t = setInterval(() => { if (S && S.root.isConnected !== false && !S.root.getElementById("ov").classList.contains("show")) render(); }, 60000);
}

async function load() {
  try {
    const { data, error } = await S.client.from("puspakom").select("*").limit(5000);
    if (error) throw error;
    S.rows = data || []; S.loaded = true; S.err = "";
  } catch (e) {
    S.loaded = true;
    const m = String(e?.message || e);
    S.err = /puspakom/.test(m) && /(does not exist|schema cache|not find)/i.test(m) ? "Jadual Puspakom belum dipasang. Jalankan V72_PUSPAKOM.sql dalam Supabase." : "Data Puspakom tak dapat dimuatkan: " + m;
  }
  render();
}

// Gabung inventori (vehicles) dengan rekod puspakom ikut plat
function cars() {
  const byPlate = {};
  S.rows.forEach(r => { byPlate[normPlate(r.plate)] = r; });
  const out = [], seen = {};
  // Semua kereta dipaparkan, termasuk Reserved dan yang dah dijual dalam katalog (masih perlu Puspakom untuk tukar milik).
  // Kereta yang dah Sold sepenuhnya disembunyikan, kecuali ada booking / gagal yang masih aktif.
  S.vehicles.forEach(v => {
    const k = normPlate(v.plate); if (!k || seen[k]) return;
    const r = byPlate[k];
    if (String(v.status || "").toLowerCase() === "sold" && !(r && (r.status === "tempah" || r.status === "gagal"))) return;
    seen[k] = 1; out.push(toCar(k, r, v));
  });
  S.rows.forEach(r => { const k = normPlate(r.plate); if (seen[k]) return; seen[k] = 1; out.push(toCar(k, r, null)); });
  return out;
}
function toCar(plate, r, v) {
  r = r || {};
  return { plate, rec: r, v, inv: !!v, vid: v?.vehicle_id || "", vuuid: v?.id || r.vehicle_id || null,
    model: v ? ((v.make || "") + " " + (v.model || "")).replace(/\s+/g, " ").trim().toUpperCase() : "", year: v?.model_year || "",
    vstatus: invStatus(v),
    type: r.jenis || "B5", status: r.status || "belum", date: r.tarikh || "", time: r.masa ? String(r.masa).slice(0, 5) : "",
    state: r.negeri || "", runner: r.runner || "", docs: r.dokumen || {}, note: r.catatan || "" };
}

// Sama seperti effStatus() dalam app.html
function invStatus(v) {
  if (!v) return "";
  const c = String(v.catalogue_status || "").toLowerCase(), st = String(v.status || "").toLowerCase();
  if (st === "sold" || c === "sold") return "sold";
  if (st === "reserved" || (c === "reserved" && st === "available")) return "reserved";
  return st;
}
const INV_LABEL = { reserved: "● Reserved", sold: "● Dah dijual — perlu Puspakom untuk tukar milik", preparation: "● Preparation" };
function where(c) { return c.state ? "Puspakom " + c.state : ""; }
function nextStep(c) {
  const t = todayStr();
  if (c.status === "lulus") {
    if (!c.date) return { txt: "Lulus — isi tarikh booking/pemeriksaan untuk kira 120 hari", alert: true };
    const exp = addDays(c.date, VALID_DAYS), left = daysBetween(t, exp);
    const who = c.type === "B5" ? "urus tukar milik di JPJ" : "hantar laporan B7 ke bank & urus tukar milik di JPJ";
    if (left < 0) return { txt: "Laporan dah luput (" + fmtDate(exp) + ") — perlu buat pemeriksaan semula", alert: true };
    return { txt: "Selesai — " + who + ". Tamat dalam " + left + " hari (" + fmtDate(exp) + ")", alert: left <= 14 };
  }
  if (c.status === "gagal") return { txt: "Baiki kerosakan, kemudian tempah pemeriksaan ulang", alert: true };
  if (c.status === "tempah") {
    if (!c.date) return { txt: "Isi tarikh temujanji", alert: false };
    const d = daysBetween(t, c.date);
    if (d < 0) return { txt: "Tarikh dah lepas — kemas kini status (Lulus / Gagal)", alert: true };
    if (d === 0 && c.time && nowMin() > tMin(c.time) + 60) return { txt: "Masa temujanji (" + fmtTime(c.time) + ") dah lepas — kemas kini status (Lulus / Gagal)", alert: true };
    const at = (c.time ? " jam " + fmtTime(c.time) : "") + (where(c) ? " di " + where(c) : "");
    const miss = DOCS.filter(x => !c.docs[x.k]).map(x => x.l);
    const need = miss.length ? " Belum sedia: " + miss.join(", ") + "." : " Semua dokumen sedia ✓";
    if (d === 0) return { txt: "Hari ini" + at + "! Bawa kereta, geran & IC." + need, alert: false };
    if (d === 1) return { txt: "Esok" + at + "." + need, alert: false };
    return { txt: "Bawa kereta, geran & IC pada " + fmtDate(c.date) + at + " (" + d + " hari lagi)", alert: false };
  }
  return { txt: "Tempah slot " + find(TYPES, c.type).l + " di MyPUSPAKOM", alert: false };
}
const isAlert = c => nextStep(c).alert;

function render() {
  const app = S.root.getElementById("app");
  app.className = "shell" + (S.canEdit ? "" : " ro");
  if (!S.loaded) { app.innerHTML = `<div class="empty">Memuatkan data Puspakom…</div>`; return; }
  if (S.err) { app.innerHTML = `<div class="head"><div><div class="kick">Puspakom</div><h2>Pemeriksaan Puspakom</h2></div></div><div class="empty">${esc(S.err)}</div>`; return; }
  const all = cars();
  app.innerHTML = `<div class="head"><div><div class="kick">Puspakom</div><h2>Pemeriksaan Puspakom</h2>
      <div class="mute">${all.filter(c => c.inv).length} kereta dalam inventori · ${S.isOwner ? "Owner boleh kemas kini" : S.canEdit ? "Staf yang dibenarkan boleh buat booking & kemas kini semua rekod" : "Paparan sahaja — hanya Owner / Operations / Sales Advisor boleh kemas kini"}</div></div>
      <button class="btn" data-a="reload" type="button">↻ Muat semula</button></div>
    <div class="panel" id="today"></div><div class="stats" id="stats"></div><div class="locs" id="locs"></div>
    <input class="search" id="q" placeholder="Cari plat, model, ADA, lokasi atau runner…" autocomplete="off" value="${esc(S.q)}">
    <div id="list"></div>`;
  renderToday(all); renderStats(all); renderLocs(all); renderList();
}

function renderToday(all) {
  const t = todayStr();
  const list = all.filter(c => c.date === t && c.status !== "belum").sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const tmr = all.filter(c => c.status === "tempah" && c.date === addDays(t, 1)).length;
  const up = all.filter(c => c.status === "tempah" && c.date && c.date > t).length;
  let h = `<div class="panel-h"><b>📍 Jadual Hari Ini</b><span class="mute">${list.length} kereta</span></div>`;
  if (!list.length) h += `<div class="none">Tiada pemeriksaan hari ini.</div>`;
  h += list.map(c => {
    const done = c.status !== "tempah", late = !done && c.time && nowMin() > tMin(c.time) + 60;
    const mark = c.status === "lulus" ? " ✓" : c.status === "gagal" ? " ✕" : late ? " ⚠️" : "";
    return `<div class="slot${done ? " done" : ""}${late ? " late" : ""}" data-jump="${esc(c.plate)}"><span class="tm">${c.time ? fmtTime(c.time) : "Masa ?"}</span><span class="pl">${esc(c.plate)}${mark}</span><span class="lc">${esc(c.state)}</span></div>`;
  }).join("");
  h += `<div class="soon">Esok: ${tmr} kereta · Akan datang: ${up} kereta</div><button class="btn pri" data-a="copy" type="button">📋 Salin jadual untuk WhatsApp</button>`;
  S.root.getElementById("today").innerHTML = h;
}
function renderStats(all) {
  const n = { semua: all.length, belum: 0, tempah: 0, lulus: 0, gagal: 0, tindakan: 0 };
  all.forEach(c => { n[c.status]++; if (isAlert(c)) n.tindakan++; });
  const items = [["semua", "Jumlah kereta", ""], ["belum", "Belum tempah", ""], ["tempah", "Booking", ""], ["lulus", "Lulus", ""], ["gagal", "Gagal", ""], ["tindakan", "Perlu tindakan", n.tindakan ? "warn" : ""]];
  S.root.getElementById("stats").innerHTML = items.map(i => `<div class="stat ${i[2]}${S.filter === i[0] ? " on" : ""}" data-f="${i[0]}"><div class="n">${n[i[0]]}</div><div class="l">${i[1]}</div></div>`).join("");
}
function renderLocs(all) {
  const seen = {}; all.forEach(c => { const k = c.state || "—"; seen[k] = (seen[k] || 0) + 1; });
  const keys = Object.keys(seen).sort((a, b) => a === "—" ? 1 : b === "—" ? -1 : a.localeCompare(b));
  S.root.getElementById("locs").innerHTML = keys.length < 2 && S.loc === "semua" ? "" :
    `<button class="loc${S.loc === "semua" ? " on" : ""}" data-loc="semua">Semua lokasi</button>` +
    keys.map(k => `<button class="loc${S.loc === k ? " on" : ""}" data-loc="${esc(k)}">${k === "—" ? "Tiada lokasi" : esc(k)} (${seen[k]})</button>`).join("");
}
function card(c) {
  const t = find(TYPES, c.type), n = nextStep(c);
  const dl = c.status === "tempah" && c.date ? dayLabel(c.date) : "";
  const dd = c.date ? c.date.split("-") : null;
  const docOk = DOCS.filter(x => c.docs[x.k]).length;
  const inv = c.vstatus === "sold" ? `<span class="inv inv-sold">Dah dijual · perlu tukar milik</span>` : c.vstatus === "reserved" ? `<span class="inv inv-res">Reserved</span>` : c.vstatus === "preparation" ? `<span class="inv">Preparation</span>` : "";
  const appt = c.date && c.status !== "belum" ? `<div class="appt">
      <div class="cal"><b>${+dd[2]}</b><span>${MONTHS[+dd[1] - 1]}</span></div>
      <div class="appt-i">
        <div class="appt-t">${c.time ? fmtTime(c.time) : "Masa belum ditetapkan"}${dl ? `<span class="tag t-${dl === "Hari ini" ? "today" : "soon"}">${dl}</span>` : ""}</div>
        <div class="appt-s">${where(c) ? "📍 " + esc(where(c)) : "Lokasi belum ditetapkan"}</div>
        ${c.runner ? `<div class="appt-s">🧑 ${esc(c.runner)}</div>` : ""}
      </div></div>` : (where(c) || c.runner) ? `<div class="appt-s pad">${where(c) ? "📍 " + esc(where(c)) : ""}${where(c) && c.runner ? " · " : ""}${c.runner ? "🧑 " + esc(c.runner) : ""}</div>` : "";
  return `<div class="car st-${c.status}${n.alert ? " is-alert" : ""}" data-card="${esc(c.plate)}">
    <div class="top"><div class="id"><span class="plate">${esc(c.plate)}</span>${c.vid ? `<span class="vid">${esc(c.vid)}</span>` : ""}</div>
      <div class="badges"><span class="pill ${t.c}">${t.l}</span><span class="pill p-${c.status}">${find(STATUSES, c.status).l}</span></div></div>
    <div class="model">${esc(c.model || "—")}${c.year ? `<span class="yr">${esc(c.year)}</span>` : ""}</div>
    ${!c.inv || inv ? `<div class="invrow">${!c.inv ? `<span class="inv inv-warn">⚠ Tiada dalam inventori</span>` : ""}${inv}</div>` : ""}
    ${appt}
    ${expiryPanel(c)}
    <div class="todo${n.alert ? " alert" : ""}"><span class="ti">${n.alert ? "!" : "→"}</span><span>${esc(n.txt)}</span></div>
    ${c.note ? `<div class="note">${esc(c.note)}</div>` : ""}
    ${c.status === "tempah" || c.status === "belum" ? `<div class="docs"><span class="dl ${docOk === DOCS.length ? "all" : ""}">Dokumen ${docOk}/${DOCS.length}</span>${DOCS.map(x => { const ok = !!c.docs[x.k]; return `<button class="doc${ok ? " ok" : ""}" data-doc="${x.k}" data-plate="${esc(c.plate)}" type="button">${ok ? "✓" : "○"} ${x.l}</button>`; }).join("")}</div>` : ""}
    ${`<div class="foot"><div class="acts">${myStatuses().map(s => `<button class="chip${s.v === c.status ? " cur" : ""}" data-st="${s.v}" data-plate="${esc(c.plate)}" type="button">${s.l}</button>`).join("")}</div>
      <button class="edit" data-edit="${esc(c.plate)}" type="button">${S.isOwner ? "✎ Edit" : c.status === "belum" ? "＋ Booking" : "✎ Edit booking"}</button></div>`}
  </div>`;
}
function renderList() {
  const el = S.root.getElementById("list"); if (!el) return;
  const q = S.q.trim().toLowerCase();
  const rows = cars().filter(c => {
    if (S.filter === "tindakan" && !isAlert(c)) return false;
    if (S.filter !== "semua" && S.filter !== "tindakan" && c.status !== S.filter) return false;
    if (S.loc !== "semua" && (c.state || "—") !== S.loc) return false;
    if (q && [c.plate, c.model, c.vid, c.state, c.runner, c.note, c.vstatus, INV_LABEL[c.vstatus] || ""].join(" ").toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort((a, b) => {
    const aa = isAlert(a) ? 0 : 1, bb = isAlert(b) ? 0 : 1; if (aa !== bb) return aa - bb;
    const k1 = (a.date || "9999") + (a.time || "99"), k2 = (b.date || "9999") + (b.time || "99"); if (k1 !== k2) return k1.localeCompare(k2);
    return ((a.state || "~") + a.plate).localeCompare((b.state || "~") + b.plate);
  });
  if (!rows.length) { el.innerHTML = `<div class="empty">Tiada kereta dalam senarai ini.</div>`; return; }
  el.innerHTML = GROUPS.map(g => {
    const gr = rows.filter(c => c.status === g.v); if (!gr.length) return "";
    const cut = !S.expanded[g.v] && gr.length > 12 && !q;
    return `<section class="grp"><div class="grp-h"><span>${g.t}</span><span class="grp-n">${gr.length}</span></div>
      <div class="list">${(cut ? gr.slice(0, 10) : gr).map(card).join("")}</div>
      ${cut ? `<button class="btn more" data-more="${g.v}" type="button">Tunjuk semua ${gr.length} kereta</button>` : ""}</section>`;
  }).join("");
}

function toast(t) { const el = S.root.getElementById("toast"); el.textContent = t; el.style.display = "block"; clearTimeout(toast._t); toast._t = setTimeout(() => el.style.display = "none", 2400); }
function carByPlate(p) { return cars().find(c => c.plate === p); }

async function save(c, patch) {
  if (!S.canEdit || S.busy) return false;
  const rec = { plate: c.plate, vehicle_id: c.vuuid, jenis: c.type, status: c.status, tarikh: c.date || null, masa: c.time || null,
    negeri: c.state || null, runner: c.runner || null, dokumen: c.docs || {}, catatan: c.note || null, ...patch };
  if (rec.status === "belum") { rec.tarikh = null; rec.masa = null; }
  S.busy = true;
  try {
    const { data, error } = await S.client.from("puspakom").upsert(rec, { onConflict: "plate" }).select().single();
    if (error) throw error;
    const i = S.rows.findIndex(r => normPlate(r.plate) === c.plate);
    if (i >= 0) S.rows[i] = data; else S.rows.push(data);
    render(); return true;
  } catch (e) { toast("Gagal simpan: " + (e?.message || e)); return false; }
  finally { S.busy = false; }
}

function onClick(e) {
  const a = e.target.closest("[data-a]");
  if (a?.dataset.a === "reload") { S.loaded = false; render(); load(); return; }
  if (a?.dataset.a === "copy") { openCopy(); return; }
  const f = e.target.closest("[data-f]"); if (f) { S.filter = S.filter === f.dataset.f && f.dataset.f !== "semua" ? "semua" : f.dataset.f; render(); return; }
  const l = e.target.closest("[data-loc]"); if (l) { S.loc = l.dataset.loc; render(); return; }
  const m = e.target.closest("[data-more]"); if (m) { S.expanded[m.dataset.more] = true; renderList(); return; }
  const j = e.target.closest("[data-jump]"); if (j) {
    S.filter = "semua"; S.loc = "semua"; S.q = ""; render();
    const el = S.root.querySelector(`[data-card="${j.dataset.jump}"]`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.boxShadow = "0 0 0 3px #f5c400"; setTimeout(() => el.style.boxShadow = "", 1600); }
    return;
  }
  if (!S.canEdit) return;
  const ed = e.target.closest("[data-edit]"); if (ed) { const c0 = carByPlate(ed.dataset.edit); openForm(c0, !S.isOwner && c0 && c0.status === "belum" ? "tempah" : undefined); return; }
  const d = e.target.closest("[data-doc]"); if (d) {
    const c = carByPlate(d.dataset.plate); if (!c) return;
    const docs = { ...c.docs, [d.dataset.doc]: !c.docs[d.dataset.doc] }; save(c, { dokumen: docs }); return;
  }
  const s = e.target.closest("[data-st]"); if (s) {
    const c = carByPlate(s.dataset.plate); const st = s.dataset.st; if (!c || c.status === st) return;
    if (st === "tempah" && !c.date) { openForm(c, "tempah"); return; }
    const patch = { status: st };
    // Do not silently invent a booking date when approving an undated record.
    if (st === "lulus" && !c.date) { openForm(c, "lulus"); return; }
    save(c, patch).then(ok => ok && toast(c.plate + " → " + find(STATUSES, st).l));
  }
}

function hourOptions(cur) {
  const hrs = []; for (let h = 8; h <= 17; h++) hrs.push(pad(h) + ":00");
  if (cur && !hrs.includes(cur)) { hrs.push(cur); hrs.sort(); }
  return `<option value="">— Pilih jam —</option>` + hrs.map(v => `<option value="${v}"${v === cur ? " selected" : ""}>${fmtTime(v)}</option>`).join("");
}
function openForm(c, forceStatus) {
  if (!c) return;
  const ov = S.root.getElementById("ov");
  let type = c.type, status = forceStatus || c.status, docs = { ...c.docs };
  ov.innerHTML = `<form class="sheet" id="form">
    <h3>${esc(c.plate)}</h3><div class="mute">${esc(c.model || "")}${c.year ? " · " + esc(c.year) : ""}${c.vid ? " · " + esc(c.vid) : ""}</div>
    <label>Jenis Pemeriksaan</label><div class="seg" id="f-type"></div>
    <label>Status</label><div class="seg s2" id="f-status"></div>
    <div class="two" id="when"><div><label>Tarikh Puspakom</label><input class="field" type="date" id="f-date" value="${esc(c.date)}"></div>
      <div><label>Masa</label><select class="field" id="f-time">${hourOptions(c.time)}</select></div></div>
    <label>Lokasi Pemeriksaan (Negeri)</label><select class="field" id="f-state"><option value="">— Pilih —</option>${NEGERI.map(n => `<option${n === c.state ? " selected" : ""}>${n}</option>`).join("")}</select>
    <label>Dokumen sedia</label><div class="seg" id="f-docs"></div>
    <label>Runner / Siapa hantar</label><input class="field" id="f-runner" value="${esc(c.runner)}" placeholder="cth. Ali" autocomplete="off">
    <label>Catatan</label><textarea class="field" id="f-note" placeholder="cth. Pembeli: Ali, bank Maybank">${esc(c.note)}</textarea>
    <div class="err" id="ferr"></div>
    <div class="row"><button type="button" class="btn" data-x="cancel">Batal</button><button type="submit" class="btn pri">Simpan</button></div>
  </form>`;
  const $ = id => S.root.getElementById(id);
  const seg = (id, arr, val, set) => { $(id).innerHTML = arr.map(o => `<button type="button" data-v="${o.v}" class="${o.v === val ? "sel" : ""}">${o.l}</button>`).join(""); $(id).onclick = ev => { const b = ev.target.closest("button"); if (!b) return; set(b.dataset.v); seg(id, arr, b.dataset.v, set); }; };
  const toggleWhen = () => { $("when").style.display = status === "belum" ? "none" : ""; };
  const drawDocs = () => { $("f-docs").innerHTML = DOCS.map(x => `<button type="button" data-k="${x.k}" class="${docs[x.k] ? "sel" : ""}">${docs[x.k] ? "✓ " : "○ "}${x.l}</button>`).join(""); };
  $("f-docs").onclick = ev => { const b = ev.target.closest("button"); if (!b) return; docs[b.dataset.k] = !docs[b.dataset.k]; drawDocs(); };
  seg("f-type", TYPES, type, v => type = v);
  seg("f-status", myStatuses(), status, v => { status = v; toggleWhen(); });
  drawDocs(); toggleWhen();
  const close = () => ov.classList.remove("show");
  ov.onclick = ev => { if (ev.target === ov || ev.target.closest("[data-x=cancel]")) close(); };
  $("form").onsubmit = async ev => {
    ev.preventDefault();
    const date = status === "belum" ? "" : $("f-date").value, time = status === "belum" ? "" : $("f-time").value;
    if ((status === "tempah" || status === "lulus") && !date) { $("ferr").textContent = "Isi tarikh booking/pemeriksaan sebelum menyimpan status " + (status === "lulus" ? "Lulus" : "Booking") + "."; return; }
    const ok = await save(c, { jenis: type, status, tarikh: date || null, masa: time || null, negeri: $("f-state").value || null,
      runner: $("f-runner").value.trim() || null, dokumen: docs, catatan: $("f-note").value.trim() || null });
    if (ok) { close(); toast("Disimpan: " + c.plate); }
  };
  ov.classList.add("show");
}

function scheduleText() {
  const t = todayStr();
  const bk = cars().filter(c => c.status === "tempah" && c.date && c.date >= t).sort((a, b) => (a.date + (a.time || "99")).localeCompare(b.date + (b.time || "99")));
  const out = ["*ABE DIN AUTO — Jadual Puspakom*", ""]; let cur = "";
  bk.forEach(c => {
    if (c.date !== cur) { cur = c.date; if (out.length > 2) out.push(""); const dl = dayLabel(c.date); out.push("📅 *" + fmtDate(c.date) + (dl ? " (" + dl + ")" : "") + "*"); }
    out.push("• " + (c.time ? fmtTime(c.time) : "Masa ?") + " — " + c.plate + (c.model ? " (" + c.model + ")" : "") + " · " + find(TYPES, c.type).l + (c.state ? " · " + c.state : "") + (c.runner ? " · Runner: " + c.runner : ""));
  });
  if (!bk.length) out.push("Tiada booking akan datang.");
  const belum = cars().filter(c => c.status === "belum").length;
  if (belum) out.push("", "⏳ Belum tempah: " + belum + " kereta");
  return out.join("\n");
}
function openCopy() {
  const ov = S.root.getElementById("ov");
  ov.innerHTML = `<div class="sheet"><h3>Jadual untuk WhatsApp</h3><textarea class="copybox" id="ct" readonly>${esc(scheduleText())}</textarea>
    <div class="err" id="cm"></div><div class="row"><button type="button" class="btn" data-x="cancel">Tutup</button><button type="button" class="btn pri" id="cc">Salin</button></div></div>`;
  const doCopy = () => {
    const txt = S.root.getElementById("ct").value, m = S.root.getElementById("cm");
    Promise.resolve().then(() => navigator.clipboard.writeText(txt)).then(() => { m.textContent = "✓ Dah disalin. Tampal dalam WhatsApp."; m.style.color = "#8ce3ad"; })
      .catch(() => { m.textContent = "Tak dapat salin automatik — tekan lama pada teks dan pilih Salin."; });
  };
  S.root.getElementById("cc").onclick = doCopy;
  ov.onclick = ev => { if (ev.target === ov || ev.target.closest("[data-x=cancel]")) ov.classList.remove("show"); };
  ov.classList.add("show"); doCopy();
}
