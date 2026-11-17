// Abe Din Auto – modul Kehadiran: punch masuk/balik dengan selfie + lokasi GPS, laporan kehadiran dan gaji.
// Dimuat oleh app.html melalui import('./js/kehadiran.js'). Jadual & fungsi: lihat V71_KEHADIRAN.sql.
// Masa punch diambil dari server; jarak ke lokasi tag disemak semula di server.
const CSS = `
:host{display:block;--bg:#0a0a09;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;
  --pri:#e8b10b;--pri-fg:#141000;--ok:#4ac27a;--bad:#e5534b;--warn:#f0a020;--blue:#6ea8fe;
  --f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{background:var(--bg);color:var(--fg);font:15px/1.45 var(--f);padding:14px max(14px,env(safe-area-inset-left,0px)) 56px}
.wrap{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
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
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media (max-width:520px){.g3{grid-template-columns:1fr 1fr}}
.chip{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--soft);white-space:nowrap}
.chip.ok{background:#1d3a28;color:#8be0aa}.chip.bad{background:#3e1b19;color:#ff9a93}.chip.warn{background:#3d2d0c;color:#ffcc66}.chip.blue{background:#16253d;color:#a9c8ff}.chip.pri{background:var(--pri);color:var(--pri-fg)}
.clock{font-size:44px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
.status{font-size:15px}
.pl{display:flex;flex-direction:column;gap:8px}
.p{display:flex;gap:12px;align-items:center;background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:8px;cursor:pointer;text-align:left;width:100%}
.p img,.p .noimg{width:52px;height:52px;border-radius:10px;object-fit:cover;background:#222;flex:none}
.p .noimg{display:grid;place-items:center;color:var(--mute);font-size:20px}
.p b{font-variant-numeric:tabular-nums}
.p .meta{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.p .meta .r{justify-content:flex-start;gap:6px}
.staff{display:flex;flex-direction:column;gap:10px}
.num{font-variant-numeric:tabular-nums;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
th{color:var(--mute);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.tw{overflow-x:auto;margin:0 -4px}
.kv{display:grid;grid-template-columns:1fr auto;gap:4px 12px;font-size:14px}.kv span:nth-child(even){text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.kv .tot{font-weight:800;font-size:17px;color:var(--pri);border-top:1px solid var(--line);padding-top:6px}
.big{font-size:26px;font-weight:800;color:var(--pri);font-variant-numeric:tabular-nums}
.ov{color:var(--fg);font:15px/1.45 var(--f);position:fixed;inset:0;background:#000c;z-index:50;display:flex;align-items:flex-end;justify-content:center;padding:0}
@media (min-width:640px){.ov{align-items:center;padding:20px}}
.sheet{background:var(--card);border:1px solid var(--line);border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:94vh;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
@media (min-width:640px){.sheet{border-radius:20px}}
.cam{position:relative;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:3/4;max-height:58vh;margin:0 auto;width:100%}
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
`;

const DAYS = ["Ahad","Isnin","Selasa","Rabu","Khamis","Jumaat","Sabtu"];
const PAY_LABEL = { daily:"Harian", hourly:"Sejam", monthly:"Bulanan" };
const KL = 8 * 3600000;
const BUCKET = "attendance-selfies";

let root, app;
const S = { client:null, profile:null, me:null, owner:false, tab:"punch", settings:null, locs:[], pay:{}, staff:[], punches:[],
  day:"", month:"", urls:{}, loaded:false, err:"", clockT:null, payOpen:{} };

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
const nameOf = id => (S.staff.find(s => s.id === id) || {}).full_name || (id === S.me ? (S.profile?.full_name || "Saya") : "Staf");
const $ = s => root.querySelector(s);
function toast(m) { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; root.appendChild(t); setTimeout(() => t.remove(), 3200); }
function errMsg(e) { const m = e?.message || String(e); return /attendance_|relation .* does not exist|schema cache/i.test(m) ? "Pangkalan data kehadiran belum dipasang (V71)." : m; }
function sheet(html) { const o = document.createElement("div"); o.className = "ov"; o.innerHTML = `<div class="sheet">${html}</div>`; o.addEventListener("click", e => { if (e.target === o) closeSheet(o); }); root.appendChild(o); return o; }
function closeSheet(o) { o?.__cleanup?.(); o?.remove(); }
function nearest(lat, lng) { let best = null; for (const l of S.locs.filter(x => x.active)) { const d = distM(lat, lng, l.lat, l.lng); if (!best || d < best.d) best = { ...l, d }; } return best; }

/* ---------- data ---------- */
async function loadBase() {
  const c = S.client;
  const [st, lc, py] = await Promise.all([
    c.from("attendance_settings").select("*").eq("id", 1).maybeSingle(),
    c.from("attendance_locations").select("*").order("created_at"),
    S.owner ? c.from("staff_pay").select("*") : c.from("staff_pay").select("*").eq("staff_id", S.me),
  ]);
  for (const r of [st, lc, py]) if (r.error) throw r.error;
  S.settings = st.data || { work_start:"09:00", work_end:"18:00", work_days:[0,1,2,3,4,6], grace_min:10, ot_min_minutes:30, ot_offday_all:true, enforce_geofence:true, require_selfie:true };
  S.locs = lc.data || [];
  S.pay = {}; (py.data || []).forEach(p => S.pay[p.staff_id] = p);
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
const nextDay = k => new Date(Date.parse(k + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
const monthRange = m => { const [y, mo] = m.split("-").map(Number); const e = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 10); return [m + "-01", e]; };
async function signPhotos(list) {
  const need = [...new Set(list.map(p => p.photo_path).filter(p => p && !S.urls[p]))]; if (!need.length) return;
  try { const { data } = await S.client.storage.from(BUCKET).createSignedUrls(need, 3600); (data || []).forEach(d => { if (d.signedUrl && d.path) S.urls[d.path] = d.signedUrl; }); } catch (e) { console.warn(e); }
  root.querySelectorAll("img[data-ph]").forEach(i => { const u = S.urls[i.dataset.ph]; if (u && i.src !== u) i.src = u; });
}

/* ---------- pengiraan kehadiran & gaji ---------- */
function computeDays(punches, staffId, fromKey, toKeyExcl) {
  const st = S.settings, ws = tMin(st.work_start), we = tMin(st.work_end), wd = st.work_days || [];
  const by = {}; punches.filter(p => p.staff_id === staffId).forEach(p => (by[dayKey(p.punched_at)] ||= []).push(p));
  const out = [], today = nowKey();
  for (let k = fromKey; k < toKeyExcl; k = nextDay(k)) {
    const list = (by[k] || []).sort((a, b) => a.punched_at.localeCompare(b.punched_at));
    const workday = wd.includes(dow(k));
    let worked = 0, open = null, firstIn = null, lastOut = null;
    for (const p of list) {
      if (p.kind === "in") { if (open == null) open = p; if (firstIn == null) firstIn = p; }
      else if (open) { worked += (new Date(p.punched_at) - new Date(open.punched_at)) / 60000; open = null; lastOut = p; }
    }
    const present = !!firstIn;
    let late = 0, ot = 0, early = 0;
    if (present && workday) {
      const fi = minOfDay(firstIn.punched_at); if (fi - ws > (st.grace_min || 0)) late = fi - ws;
      if (lastOut) { const lo = minOfDay(lastOut.punched_at); const o = lo - we; if (o >= (st.ot_min_minutes || 0) && o > 0) ot = o; if (lo < we && !open) early = we - lo; }
    } else if (present && !workday && st.ot_offday_all) ot = worked;
    ot = Math.min(ot, worked);
    out.push({ key:k, workday, list, present, worked, late, ot, early, open:!!open, future:k > today, regular:Math.max(0, worked - ot) });
  }
  return out;
}
function computePay(days, pay) {
  const p = pay || { pay_type:"daily", rate:0, ot_rate:0, late_mode:"none", late_rate:0, monthly_workdays:26, allowance:0 };
  const presentDays = days.filter(d => d.present).length, workPresent = days.filter(d => d.present && d.workday).length;
  const absent = days.filter(d => d.workday && !d.present && !d.future).length;
  const workedMin = days.reduce((a, d) => a + d.worked, 0), regMin = days.reduce((a, d) => a + d.regular, 0), otMin = days.reduce((a, d) => a + d.ot, 0);
  const lateMin = days.reduce((a, d) => a + d.late, 0), lateCount = days.filter(d => d.late > 0).length, openCount = days.filter(d => d.open && d.key < nowKey()).length;
  const rate = +p.rate || 0; let base = 0, baseNote = "", absentDeduct = 0;
  if (p.pay_type === "daily") { const n = S.settings.ot_offday_all ? workPresent : presentDays; base = n * rate; baseNote = `${n} hari × ${rm(rate)}`; }
  else if (p.pay_type === "hourly") { base = regMin / 60 * rate; baseNote = `${(regMin / 60).toFixed(2)} jam × ${rm(rate)}`; }
  else { base = rate; absentDeduct = absent * rate / (+p.monthly_workdays || 26); baseNote = `Gaji bulanan`; }
  const otPay = otMin / 60 * (+p.ot_rate || 0);
  const lateDeduct = p.late_mode === "per_minute" ? lateMin * (+p.late_rate || 0) : p.late_mode === "per_late" ? lateCount * (+p.late_rate || 0) : 0;
  const allowance = +p.allowance || 0;
  const net = base + otPay + allowance - lateDeduct - absentDeduct;
  return { presentDays, absent, workedMin, regMin, otMin, lateMin, lateCount, openCount, base, baseNote, otPay, lateDeduct, absentDeduct, allowance, net, pay:p, hasPay:!!pay };
}

/* ---------- render ---------- */
function tabs() {
  const t = S.owner ? [["punch","Punch"],["today","Hari Ini"],["gaji","Gaji"],["tetapan","Tetapan"]] : [["punch","Punch"],["rekod","Rekod Saya"]];
  return `<div class="tabs">${t.map(([k, l]) => `<button data-tab="${k}" aria-pressed="${S.tab === k}">${l}</button>`).join("")}</div>`;
}
function render() {
  let h = `<div class="r"><h1>Kehadiran</h1><button class="sm" data-act="reload" title="Muat semula">↻</button></div>${tabs()}`;
  if (S.err) h += `<div class="notice err">${esc(S.err)}</div>`;
  if (!S.loaded) h += `<div class="card"><p class="mute">Memuatkan…</p></div>`;
  else if (S.tab === "today") h += viewToday();
  else if (S.tab === "gaji") h += viewGaji();
  else if (S.tab === "tetapan") h += viewTetapan();
  else if (S.tab === "rekod") h += viewRekod();
  else h += viewPunch();
  app.innerHTML = h;
  signPhotos(S.punches);
  tickClock();
}
function punchRow(p, showName) {
  const loc = p.inside == null ? (p.manual ? `<span class="chip blue">Manual</span>` : `<span class="chip">Tiada lokasi tag</span>`)
    : p.inside ? `<span class="chip ok">✓ ${esc(p.location_name || "Lokasi")} · ${p.distance_m}m</span>` : `<span class="chip bad">✗ Luar kawasan · ${p.distance_m}m</span>`;
  return `<button class="p" data-punch="${esc(p.id)}">${p.photo_path ? `<img data-ph="${esc(p.photo_path)}" src="${esc(S.urls[p.photo_path] || "")}" alt="">` : `<span class="noimg">${p.manual ? "✎" : "?"}</span>`}
    <span class="meta"><span class="r"><b>${hm(p.punched_at)}</b><span class="chip ${p.kind === "in" ? "pri" : ""}">${p.kind === "in" ? "MASUK" : "BALIK"}</span>${p.edited_at && !p.manual ? `<span class="chip warn">Diubah</span>` : ""}${showName ? `<span class="mute">${esc(nameOf(p.staff_id))}</span>` : ""}</span>
    <span class="r">${loc}</span></span></button>`;
}
function viewPunch() {
  const today = nowKey(), mine = S.punches.filter(p => p.staff_id === S.me && dayKey(p.punched_at) === today);
  const last = mine[mine.length - 1], working = last?.kind === "in";
  const firstIn = mine.find(p => p.kind === "in");
  const st = S.settings, wd = (st.work_days || []).includes(dow(today));
  let status = !last ? `<span class="chip">Belum punch masuk</span>` : working ? `<span class="chip ok">● Sedang bekerja sejak ${hm(last.punched_at)}</span>` : `<span class="chip blue">Sudah punch balik ${hm(last.punched_at)}</span>`;
  const late = firstIn && wd && minOfDay(firstIn.punched_at) - tMin(st.work_start) > (st.grace_min || 0) ? `<span class="chip bad">Lewat ${fmtMin(minOfDay(firstIn.punched_at) - tMin(st.work_start))}</span>` : "";
  const noLoc = !S.locs.some(l => l.active);
  return `<div class="card" style="align-items:center;text-align:center">
      <div class="mute">${dayLabel(today)} · Waktu kerja ${esc(String(st.work_start).slice(0,5))}–${esc(String(st.work_end).slice(0,5))}${wd ? "" : " · <b>Hari cuti</b>"}</div>
      <div class="clock" id="clock">--:--</div>
      <div class="status r" style="justify-content:center">${status}${late}</div>
      ${working ? `<button class="btn out" data-act="punch" data-kind="out">📸 Punch Balik</button>` : `<button class="btn" data-act="punch" data-kind="in">📸 Punch Masuk</button>`}
      <div class="mute">Perlu selfie dan lokasi GPS. Masa direkod mengikut jam server.</div>
    </div>
    ${noLoc ? `<div class="notice">${S.owner ? "Belum ada lokasi tag. Tambah di tab Tetapan supaya punch disemak ikut kawasan." : "Owner belum menetapkan lokasi kerja."}</div>` : ""}
    <div class="card"><h3>Punch saya hari ini</h3>${mine.length ? `<div class="pl">${[...mine].reverse().map(p => punchRow(p, false)).join("")}</div>` : `<p class="mute">Tiada punch lagi hari ini.</p>`}</div>`;
}
function dayTable(days) {
  const rows = days.filter(d => d.present || (d.workday && !d.future));
  if (!rows.length) return `<p class="mute">Tiada rekod.</p>`;
  return `<div class="tw"><table><thead><tr><th>Hari</th><th>Masuk</th><th>Balik</th><th class="n">Jam</th><th>Catatan</th></tr></thead><tbody>${rows.map(d => {
    const fi = d.list.find(p => p.kind === "in"), lo = [...d.list].reverse().find(p => p.kind === "out");
    const tags = [!d.present ? `<span class="chip bad">Tidak hadir</span>` : "", d.late ? `<span class="chip bad">Lewat ${fmtMin(d.late)}</span>` : "", d.ot ? `<span class="chip blue">OT ${fmtMin(d.ot)}</span>` : "", d.early ? `<span class="chip warn">Balik awal ${fmtMin(d.early)}</span>` : "", d.open ? (d.key < nowKey() ? `<span class="chip warn">Tiada punch balik</span>` : `<span class="chip ok">Sedang bekerja</span>`) : "", !d.workday && d.present ? `<span class="chip">Hari cuti</span>` : ""].join(" ");
    return `<tr><td>${dayLabel(d.key)}</td><td>${fi ? hm(fi.punched_at) : "–"}</td><td>${lo ? hm(lo.punched_at) : "–"}</td><td class="n">${d.worked ? fmtMin(d.worked) : "–"}</td><td>${tags}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function payBox(c) {
  if (!c.hasPay) return `<p class="mute">Tetapan gaji belum dibuat${S.owner ? " — tetapkan di tab Tetapan." : "."}</p>`;
  const p = c.pay;
  return `<div class="kv">
    <span>Gaji asas (${PAY_LABEL[p.pay_type]}) <small class="mute">${esc(c.baseNote)}</small></span><span>${rm(c.base)}</span>
    ${c.absentDeduct ? `<span>Potongan tidak hadir <small class="mute">${c.absent} hari</small></span><span>−${rm(c.absentDeduct)}</span>` : ""}
    <span>OT <small class="mute">${(c.otMin / 60).toFixed(2)} jam × ${rm(p.ot_rate)}</small></span><span>${rm(c.otPay)}</span>
    ${c.allowance ? `<span>Elaun</span><span>${rm(c.allowance)}</span>` : ""}
    ${p.late_mode !== "none" ? `<span>Potongan lewat <small class="mute">${p.late_mode === "per_minute" ? `${Math.round(c.lateMin)} min × ${rm(p.late_rate)}` : `${c.lateCount} kali × ${rm(p.late_rate)}`}</small></span><span>−${rm(c.lateDeduct)}</span>` : ""}
    <span class="tot">Jumlah bersih</span><span class="tot">${rm(c.net)}</span></div>`;
}
function statsRow(c) {
  return `<div class="g3"><div><div class="mute">Hadir</div><div class="num">${c.presentDays} hari</div></div><div><div class="mute">Jam kerja</div><div class="num">${fmtMin(c.workedMin)}</div></div><div><div class="mute">Tidak hadir</div><div class="num">${c.absent} hari</div></div>
    <div><div class="mute">Lewat</div><div class="num">${c.lateCount} kali · ${fmtMin(c.lateMin)}</div></div><div><div class="mute">OT</div><div class="num">${fmtMin(c.otMin)}</div></div><div><div class="mute">Lupa punch balik</div><div class="num">${c.openCount}</div></div></div>`;
}
function monthInput() { return `<input type="month" class="field" id="month" value="${esc(S.month)}" style="max-width:200px">`; }
function viewRekod() {
  const [a, b] = monthRange(S.month), days = computeDays(S.punches, S.me, a, b), c = computePay(days, S.pay[S.me]);
  return `<div class="card"><div class="r"><h3>Rekod bulan</h3>${monthInput()}</div>${statsRow(c)}</div>
    <div class="card"><h3>Anggaran gaji</h3>${payBox(c)}<small class="mute">Anggaran sahaja. Jumlah muktamad disahkan oleh Owner.</small></div>
    <div class="card"><h3>Harian</h3>${dayTable(days)}</div>`;
}
function activeStaff() { return S.staff.filter(s => s.enabled !== false && (s.role !== "owner" || S.punches.some(p => p.staff_id === s.id) || S.pay[s.id])); }
function viewToday() {
  const st = S.settings, k = S.day, wd = (st.work_days || []).includes(dow(k));
  const list = activeStaff();
  const cards = list.map(s => {
    const ps = S.punches.filter(p => p.staff_id === s.id && dayKey(p.punched_at) === k);
    const d = computeDays(ps, s.id, k, nextDay(k))[0], last = ps[ps.length - 1];
    const chip = !ps.length ? (wd && k <= nowKey() ? `<span class="chip bad">Belum hadir</span>` : `<span class="chip">Tiada rekod</span>`) : last.kind === "in" ? `<span class="chip ok">● Bekerja</span>` : `<span class="chip blue">Sudah balik · ${fmtMin(d.worked)}</span>`;
    return `<div class="card staff"><div class="r"><h3>${esc(s.full_name || "Staf")}</h3><span class="r" style="gap:6px">${chip}${d.late ? `<span class="chip bad">Lewat ${fmtMin(d.late)}</span>` : ""}${d.ot ? `<span class="chip blue">OT ${fmtMin(d.ot)}</span>` : ""}</span></div>
      ${ps.length ? `<div class="pl">${ps.map(p => punchRow(p, false)).join("")}</div>` : ""}
      <div><button class="sm" data-act="manual" data-staff="${esc(s.id)}">+ Punch manual</button></div></div>`;
  }).join("");
  const present = list.filter(s => S.punches.some(p => p.staff_id === s.id && dayKey(p.punched_at) === k)).length;
  return `<div class="card"><div class="r"><div><h3>${dayLabel(k)}</h3><span class="mute">${present}/${list.length} staf hadir${wd ? "" : " · hari cuti"}</span></div><input type="date" class="field" id="day" value="${esc(k)}" style="max-width:180px"></div></div>
    ${cards || `<div class="card"><p class="mute">Belum ada staf. Tambah staf di Tetapan → Staf & Akses.</p></div>`}`;
}
function viewGaji() {
  const [a, b] = monthRange(S.month), list = activeStaff();
  let total = 0;
  const cards = list.map(s => {
    const days = computeDays(S.punches, s.id, a, b), c = computePay(days, S.pay[s.id]); if (c.hasPay) total += c.net;
    const open = S.payOpen[s.id];
    return `<div class="card"><div class="r"><div><h3>${esc(s.full_name || "Staf")}</h3><span class="mute">${c.hasPay ? `${PAY_LABEL[c.pay.pay_type]} · ${rm(c.pay.rate)}` : "Tetapan gaji belum dibuat"}</span></div><div class="big">${c.hasPay ? rm(c.net) : "–"}</div></div>
      ${statsRow(c)}${payBox(c)}
      <button class="sm" data-act="togglepay" data-staff="${esc(s.id)}">${open ? "Tutup butiran harian" : "Lihat butiran harian"}</button>${open ? dayTable(days) : ""}</div>`;
  }).join("");
  return `<div class="card"><div class="r"><h3>Gaji bulan</h3>${monthInput()}</div><div class="r"><span class="mute">Jumlah gaji bersih semua staf</span><span class="big">${rm(total)}</span></div>
    <button class="sm" data-act="csv">⬇ Muat turun CSV</button></div>${cards || `<div class="card"><p class="mute">Belum ada staf.</p></div>`}`;
}
function viewTetapan() {
  const st = S.settings;
  const days = [1,2,3,4,5,6,0].map(d => `<label><input type="checkbox" name="wd" value="${d}" ${(st.work_days || []).includes(d) ? "checked" : ""}> ${DAYS[d]}</label>`).join("");
  const locs = S.locs.map(l => `<div class="loc"><div class="grow"><b>${esc(l.name)}</b> ${l.active ? "" : `<span class="chip">Tidak aktif</span>`}<div class="mute">Radius ${l.radius_m} m · <a href="${gmaps(l.lat, l.lng)}" target="_blank" rel="noopener" style="color:var(--pri)">Lihat peta</a></div></div>
    <button class="sm" data-act="loctoggle" data-id="${esc(l.id)}">${l.active ? "Matikan" : "Aktifkan"}</button><button class="sm bad" data-act="locdel" data-id="${esc(l.id)}">Padam</button></div>`).join("");
  const staff = S.staff.filter(s => s.enabled !== false && s.role !== "owner");
  return `<form class="card" id="f-set"><h3>Waktu kerja</h3>
      <div class="g2"><div><label>Masuk</label><input class="field" type="time" name="work_start" value="${esc(String(st.work_start).slice(0,5))}"></div><div><label>Balik</label><input class="field" type="time" name="work_end" value="${esc(String(st.work_end).slice(0,5))}"></div></div>
      <div><label>Hari bekerja</label><div class="days">${days}</div></div>
      <div class="g2"><div><label>Tempoh bertenang lewat (minit)</label><input class="field" type="number" min="0" max="240" name="grace_min" value="${st.grace_min}"></div>
      <div><label>OT dikira jika lebih (minit selepas waktu balik)</label><input class="field" type="number" min="0" max="600" name="ot_min_minutes" value="${st.ot_min_minutes}"></div></div>
      <label class="sw"><input type="checkbox" name="ot_offday_all" ${st.ot_offday_all ? "checked" : ""}> Kerja pada hari cuti dikira OT sepenuhnya</label>
      <label class="sw"><input type="checkbox" name="enforce_geofence" ${st.enforce_geofence ? "checked" : ""}> Sekat punch di luar kawasan lokasi tag</label>
      <label class="sw"><input type="checkbox" name="require_selfie" ${st.require_selfie ? "checked" : ""}> Wajib selfie</label>
      <button class="btn" type="submit">Simpan waktu kerja</button></form>
    <div class="card"><h3>Lokasi tag</h3><p class="mute">Staf hanya boleh punch dalam radius lokasi aktif (jika sekatan dihidupkan). Boleh ada lebih daripada satu lokasi.</p>
      ${locs || `<p class="mute">Belum ada lokasi.</p>`}
      <form id="f-loc" style="display:flex;flex-direction:column;gap:10px">
        <div class="g2"><div><label>Nama lokasi</label><input class="field" name="name" placeholder="cth: Kedai Kubang Kerian" required></div><div><label>Radius (meter)</label><input class="field" type="number" name="radius_m" min="10" max="5000" value="100" required></div></div>
        <div><label>Koordinat atau pautan Google Maps</label><input class="field" name="coord" placeholder="cth: 6.0950, 102.2800"></div>
        <button class="sm" type="button" data-act="here">📍 Guna lokasi saya sekarang</button>
        <div id="locprev"></div>
        <button class="btn" type="submit">+ Tambah lokasi</button></form></div>
    <div class="card"><h3>Gaji staf</h3><p class="mute">Pilih cara gaji untuk setiap staf. Kadar OT dalam RM sejam.</p>
      ${staff.map(s => payForm(s)).join("") || `<p class="mute">Belum ada staf.</p>`}</div>`;
}
function payForm(s) {
  const p = S.pay[s.id] || { pay_type:"daily", rate:0, ot_rate:0, late_mode:"none", late_rate:0, monthly_workdays:26, allowance:0 };
  const opt = (v, l, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`;
  return `<details ${S.payOpen["f" + s.id] ? "open" : ""} data-pd="${esc(s.id)}"><summary>${esc(s.full_name || "Staf")} — ${S.pay[s.id] ? `${PAY_LABEL[p.pay_type]} ${rm(p.rate)}` : "belum ditetapkan"}</summary>
    <form class="f-pay" data-staff="${esc(s.id)}" style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
      <div class="g2"><div><label>Cara gaji</label><select class="field" name="pay_type">${opt("daily","Harian (RM sehari)",p.pay_type)}${opt("hourly","Sejam (RM sejam)",p.pay_type)}${opt("monthly","Bulanan (RM sebulan)",p.pay_type)}</select></div>
      <div><label>Kadar (RM)</label><input class="field" type="number" step="0.01" min="0" name="rate" value="${p.rate}"></div></div>
      <div class="g2"><div><label>Kadar OT (RM sejam)</label><input class="field" type="number" step="0.01" min="0" name="ot_rate" value="${p.ot_rate}"></div>
      <div><label>Elaun tetap sebulan (RM)</label><input class="field" type="number" step="0.01" min="0" name="allowance" value="${p.allowance}"></div></div>
      <div class="g2"><div><label>Potongan lewat</label><select class="field" name="late_mode">${opt("none","Tiada potongan",p.late_mode)}${opt("per_minute","RM setiap minit lewat",p.late_mode)}${opt("per_late","RM setiap kali lewat",p.late_mode)}</select></div>
      <div><label>Kadar potongan lewat (RM)</label><input class="field" type="number" step="0.01" min="0" name="late_rate" value="${p.late_rate}"></div></div>
      <div><label>Hari kerja sebulan (untuk potongan tidak hadir gaji bulanan)</label><input class="field" type="number" min="1" max="31" name="monthly_workdays" value="${p.monthly_workdays}"></div>
      <button class="btn" type="submit">Simpan gaji ${esc(s.full_name || "")}</button></form></details>`;
}

let clockTimer = null;
function tickClock() { const el = $("#clock"); if (!el) return; const d = klDate(Date.now()); el.textContent = `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`; }

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
    if (!n) { g.className = "gps"; g.innerHTML = `📍 Lokasi didapati (ketepatan ±${acc} m). Tiada lokasi tag ditetapkan.`; return; }
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
    const n = pos && nearest(pos.lat, pos.lng), d = klDate(Date.now());
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

/* ---------- butiran punch & edit (Owner) ---------- */
function openPunch(id) {
  const p = S.punches.find(x => x.id === id); if (!p) return;
  const loc = p.lat != null ? `<iframe class="map" loading="lazy" src="${mapUrl(p.lat, p.lng)}" title="Peta lokasi punch"></iframe>
    <div class="r"><span class="mute">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.accuracy_m ? ` · ±${Math.round(p.accuracy_m)} m` : ""}</span><a class="sm" href="${gmaps(p.lat, p.lng)}" target="_blank" rel="noopener" style="text-decoration:none">Buka Google Maps</a></div>` : `<p class="mute">Tiada lokasi GPS (punch manual).</p>`;
  const o = sheet(`<div class="r"><h2>${esc(nameOf(p.staff_id))} · ${p.kind === "in" ? "Masuk" : "Balik"}</h2><button class="sm" data-x>Tutup</button></div>
    <div class="mute">${dayLabel(dayKey(p.punched_at))} · <b style="color:var(--fg)">${hm(p.punched_at)}</b>${p.location_name ? ` · ${esc(p.location_name)} (${p.distance_m} m, ${p.inside ? "dalam kawasan" : "luar kawasan"})` : ""}</div>
    ${p.photo_path ? `<img class="ph-big" data-ph="${esc(p.photo_path)}" src="${esc(S.urls[p.photo_path] || "")}" alt="Selfie">` : ""}
    ${loc}
    ${p.note ? `<div class="notice">Catatan: ${esc(p.note)}</div>` : ""}
    ${p.edited_at ? `<small class="mute">${p.manual ? "Dimasukkan" : "Diubah"} oleh ${esc(nameOf(p.edited_by))} pada ${dayLabel(dayKey(p.edited_at))} ${hm(p.edited_at)}</small>` : ""}
    ${S.owner ? `<form id="f-edit" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px"><h3>Betulkan rekod</h3>
      <div class="g2"><div><label>Jenis</label><select class="field" name="kind"><option value="in" ${p.kind === "in" ? "selected" : ""}>Masuk</option><option value="out" ${p.kind === "out" ? "selected" : ""}>Balik</option></select></div>
      <div><label>Masa</label><input class="field" type="datetime-local" name="t" value="${toLocalInput(p.punched_at)}" required></div></div>
      <div><label>Sebab perubahan</label><input class="field" name="note" value="${esc(p.note || "")}" required placeholder="cth: lupa punch balik"></div>
      <div class="g2"><button class="btn bad" type="button" id="del">Padam rekod</button><button class="btn" type="submit">Simpan</button></div></form>` : ""}`);
  o.querySelector("[data-x]").onclick = () => closeSheet(o);
  signPhotos([p]);
  const f = o.querySelector("#f-edit");
  if (f) {
    f.onsubmit = async e => { e.preventDefault(); const fd = new FormData(f);
      const { data, error } = await S.client.from("attendance_punches").update({ kind:fd.get("kind"), punched_at:fromLocalInput(fd.get("t")), note:String(fd.get("note")).trim() }).eq("id", p.id).select().single();
      if (error) return toast(errMsg(error)); Object.assign(p, data); S.punches.sort((a, b) => a.punched_at.localeCompare(b.punched_at)); closeSheet(o); toast("Rekod dikemas kini"); render(); };
    o.querySelector("#del").onclick = async () => { if (!confirm("Padam rekod punch ini? Tindakan ini tidak boleh dipulihkan.")) return;
      const { error } = await S.client.from("attendance_punches").delete().eq("id", p.id); if (error) return toast(errMsg(error));
      if (p.photo_path) S.client.storage.from(BUCKET).remove([p.photo_path]).catch(() => {});
      S.punches = S.punches.filter(x => x.id !== p.id); closeSheet(o); toast("Rekod dipadam"); render(); };
  }
}
function manualPunch(staffId) {
  const k = S.day;
  const o = sheet(`<div class="r"><h2>Punch manual · ${esc(nameOf(staffId))}</h2><button class="sm" data-x>Tutup</button></div>
    <p class="mute">Untuk staf yang lupa punch. Rekod ditanda "Manual".</p>
    <form id="f-man" style="display:flex;flex-direction:column;gap:10px">
      <div class="g2"><div><label>Jenis</label><select class="field" name="kind"><option value="in">Masuk</option><option value="out">Balik</option></select></div>
      <div><label>Masa</label><input class="field" type="datetime-local" name="t" value="${k}T${String(S.settings.work_start).slice(0,5)}" required></div></div>
      <div><label>Sebab</label><input class="field" name="note" required placeholder="cth: telefon rosak"></div>
      <button class="btn" type="submit">Simpan</button></form>`);
  o.querySelector("[data-x]").onclick = () => closeSheet(o);
  const f = o.querySelector("#f-man");
  f.onsubmit = async e => { e.preventDefault(); const fd = new FormData(f);
    const { data, error } = await S.client.from("attendance_punches").insert({ staff_id:staffId, kind:fd.get("kind"), punched_at:fromLocalInput(fd.get("t")), note:String(fd.get("note")).trim(), manual:true }).select().single();
    if (error) return toast(errMsg(error)); S.punches.push(data); S.punches.sort((a, b) => a.punched_at.localeCompare(b.punched_at)); closeSheet(o); toast("Punch manual disimpan"); render(); };
}

/* ---------- tetapan ---------- */
function parseCoord(s) {
  s = String(s || ""); const m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  return m ? { lat:+m[1], lng:+m[2] } : null;
}
function locPreview() { const f = $("#f-loc"), c = parseCoord(f?.coord.value), box = $("#locprev"); if (!box) return; box.innerHTML = c ? `<iframe class="map" loading="lazy" src="${mapUrl(c.lat, c.lng)}" title="Pratonton lokasi"></iframe>` : ""; }
function csv() {
  const [a, b] = monthRange(S.month);
  const rows = [["Staf","Cara gaji","Kadar","Hari hadir","Tidak hadir","Jam kerja","Lewat (kali)","Lewat (minit)","OT (jam)","Gaji asas","Potongan tidak hadir","OT (RM)","Elaun","Potongan lewat","Bersih"]];
  activeStaff().forEach(s => { const c = computePay(computeDays(S.punches, s.id, a, b), S.pay[s.id]);
    rows.push([s.full_name, c.hasPay ? PAY_LABEL[c.pay.pay_type] : "-", c.pay.rate, c.presentDays, c.absent, (c.workedMin / 60).toFixed(2), c.lateCount, Math.round(c.lateMin), (c.otMin / 60).toFixed(2), c.base.toFixed(2), c.absentDeduct.toFixed(2), c.otPay.toFixed(2), c.allowance.toFixed(2), c.lateDeduct.toFixed(2), c.net.toFixed(2)]); });
  const txt = "﻿" + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a2 = document.createElement("a"); a2.href = URL.createObjectURL(new Blob([txt], { type:"text/csv" })); a2.download = `gaji-${S.month}.csv`; a2.click();
}

/* ---------- muat & peristiwa ---------- */
async function loadTab() {
  try {
    if (!S.settings) await loadBase();
    if (S.tab === "today") S.punches = await loadPunches(S.day, nextDay(S.day));
    else if (S.tab === "gaji" || S.tab === "rekod") { const [a, b] = monthRange(S.month); S.punches = await loadPunches(a, b); }
    else if (S.tab === "punch") { const t = nowKey(); S.punches = await loadPunches(t, nextDay(t)); }
    S.err = "";
  } catch (e) { S.err = errMsg(e); }
  S.loaded = true; render();
}
function onClick(e) {
  const t = e.target.closest("[data-tab],[data-act],[data-punch]"); if (!t) return;
  if (t.dataset.tab) { S.tab = t.dataset.tab; S.loaded = false; render(); loadTab(); return; }
  if (t.dataset.punch) return openPunch(t.dataset.punch);
  const a = t.dataset.act;
  if (a === "reload") { S.settings = null; S.loaded = false; render(); loadTab(); }
  else if (a === "punch") startPunch(t.dataset.kind);
  else if (a === "manual") manualPunch(t.dataset.staff);
  else if (a === "togglepay") { S.payOpen[t.dataset.staff] = !S.payOpen[t.dataset.staff]; render(); }
  else if (a === "csv") csv();
  else if (a === "here") {
    if (!navigator.geolocation) return toast("GPS tidak disokong"); t.disabled = true; t.textContent = "Mencari lokasi…";
    navigator.geolocation.getCurrentPosition(p => { const f = $("#f-loc"); f.coord.value = `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`; t.disabled = false; t.textContent = `📍 Lokasi didapati (±${Math.round(p.coords.accuracy)} m)`; locPreview(); },
      () => { t.disabled = false; t.textContent = "📍 Guna lokasi saya sekarang"; toast("Lokasi tidak dapat dikesan"); }, { enableHighAccuracy:true, timeout:20000, maximumAge:0 });
  }
  else if (a === "loctoggle" || a === "locdel") {
    const l = S.locs.find(x => x.id === t.dataset.id); if (!l) return;
    (async () => {
      if (a === "locdel") { if (!confirm(`Padam lokasi "${l.name}"?`)) return; const { error } = await S.client.from("attendance_locations").delete().eq("id", l.id); if (error) return toast(errMsg(error)); S.locs = S.locs.filter(x => x !== l); }
      else { const { error } = await S.client.from("attendance_locations").update({ active:!l.active }).eq("id", l.id); if (error) return toast(errMsg(error)); l.active = !l.active; }
      render();
    })();
  }
}
function onChange(e) {
  const t = e.target;
  if (t.id === "month" && t.value) { S.month = t.value; S.loaded = false; render(); loadTab(); }
  else if (t.id === "day" && t.value) { S.day = t.value; S.loaded = false; render(); loadTab(); }
}
function onInput(e) { if (e.target.name === "coord") locPreview(); }
function onToggle(e) { const d = e.target.closest?.("details[data-pd]"); if (d) S.payOpen["f" + d.dataset.pd] = d.open; }
async function onSubmit(e) {
  const f = e.target; e.preventDefault();
  const btn = f.querySelector("[type=submit]"); const fd = new FormData(f); btn && (btn.disabled = true);
  try {
    if (f.id === "f-set") {
      const v = { work_start:fd.get("work_start"), work_end:fd.get("work_end"), work_days:fd.getAll("wd").map(Number), grace_min:+fd.get("grace_min") || 0, ot_min_minutes:+fd.get("ot_min_minutes") || 0,
        ot_offday_all:fd.has("ot_offday_all"), enforce_geofence:fd.has("enforce_geofence"), require_selfie:fd.has("require_selfie"), updated_at:new Date().toISOString() };
      if (tMin(v.work_end) <= tMin(v.work_start)) throw new Error("Waktu balik mesti selepas waktu masuk.");
      const { data, error } = await S.client.from("attendance_settings").update(v).eq("id", 1).select().single(); if (error) throw error; S.settings = data; toast("Waktu kerja disimpan");
    } else if (f.id === "f-loc") {
      const c = parseCoord(fd.get("coord")); if (!c) throw new Error("Masukkan koordinat atau tekan 'Guna lokasi saya sekarang'.");
      const { data, error } = await S.client.from("attendance_locations").insert({ name:String(fd.get("name")).trim(), radius_m:+fd.get("radius_m") || 100, lat:c.lat, lng:c.lng }).select().single(); if (error) throw error;
      S.locs.push(data); toast("Lokasi ditambah");
    } else if (f.classList.contains("f-pay")) {
      const id = f.dataset.staff;
      const v = { staff_id:id, pay_type:fd.get("pay_type"), rate:+fd.get("rate") || 0, ot_rate:+fd.get("ot_rate") || 0, late_mode:fd.get("late_mode"), late_rate:+fd.get("late_rate") || 0, monthly_workdays:+fd.get("monthly_workdays") || 26, allowance:+fd.get("allowance") || 0, updated_at:new Date().toISOString() };
      const { data, error } = await S.client.from("staff_pay").upsert(v, { onConflict:"staff_id" }).select().single(); if (error) throw error;
      S.pay[id] = data; S.payOpen["f" + id] = false; toast("Gaji disimpan");
    }
    render();
  } catch (err) { toast(errMsg(err)); btn && (btn.disabled = false); }
}

/* host = elemen kosong dalam #ada-cloud-view. ctx = {client, profile} */
export function mountKehadiran(host, ctx) {
  S.client = ctx.client; S.profile = ctx.profile; S.me = ctx.profile?.id; S.owner = ctx.profile?.role === "owner";
  if (!S.day) S.day = nowKey(); if (!S.month) S.month = nowKey().slice(0, 7);
  if (!S.owner && !["punch","rekod"].includes(S.tab)) S.tab = "punch";
  root = host.shadowRoot || host.attachShadow({ mode:"open" });
  root.innerHTML = `<style>${CSS}</style><div class="shell"><div class="wrap" id="app"></div></div>`;
  app = root.getElementById("app");
  app.addEventListener("click", onClick); app.addEventListener("change", onChange); app.addEventListener("input", onInput);
  app.addEventListener("submit", onSubmit); app.addEventListener("toggle", onToggle, true);
  clearInterval(clockTimer); clockTimer = setInterval(() => { if (root.isConnected === false || !host.isConnected) return clearInterval(clockTimer); tickClock(); }, 15000);
  S.settings = null; S.loaded = false; render(); loadTab();
}
