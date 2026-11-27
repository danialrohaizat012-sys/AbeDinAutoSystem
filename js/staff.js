import { mountHROwnerAccess } from "./hr-delegate.mjs?v=1";
import { mountPayrollQueue } from "./payroll-handoff.mjs?v=1";
// Abe Din Auto – Urus Staff (menu Staff). Hanya Owner.
// Cipta akaun log masuk baharu melalui Supabase Auth (klien sementara, sesi Owner tidak terjejas),
// kemudian aktifkan profil melalui RPC staff_save. Senarai melalui RPC staff_list (lihat V66_STAFF_MIGRATION.sql).
// UI dalam Shadow DOM supaya tidak bercampur dengan CSS sistem sedia ada.
import { mountProfile, PROFILE_CSS, CATEGORY, EMP_TYPE, CONTRACT, completeness, LEAVE, CLAIM } from "./staff-profile.js?v=11";
export const CSS = `
:host{display:block;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;--pri:#e8b10b;--pri-fg:#141000;
  --ok:#3fae6b;--bad:#e0473f;--f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f);background:#0a0a09;border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;margin-top:14px}
@media (max-width:640px){.shell{font-size:13.5px;border:0;border-radius:0;padding:4px 0 70px;background:transparent;gap:10px;margin-top:6px}h2{font-size:16px}h3{font-size:15px}.kick{font-size:10px}.chip{font-size:11px}.btn{font-size:13.5px;padding:8px 13px;border-radius:10px}}
h3{margin:0;font-size:18px;font-weight:800}
.kick{font-size:11px;letter-spacing:.14em;color:var(--pri);font-weight:700}
p{margin:0}.mute{color:var(--mute);font-size:13.5px}
button,input,select{font:inherit;color:inherit}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.grow{flex:1}
.btn{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:9px 13px;font-weight:700;font-size:14px;cursor:pointer}
.btn.pri{background:var(--pri);border-color:var(--pri);color:var(--pri-fg)}
.btn.bad{color:#ffaaa4;border-color:#6b2420}
.btn.sm{padding:6px 10px;font-size:13px}
.btn:disabled{opacity:.5}
.list{display:flex;flex-direction:column;gap:8px}
.item{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.item .who{flex:1;min-width:180px}
.item small{color:var(--mute);font-size:12.5px;display:block}
.chip{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700;margin-right:4px}
.c-on{background:#12321f;color:#8ce3ad}.c-off{background:#2c2a25;color:#cfc8b6}.c-role{background:#3a2f0a;color:#ffd257}.c-warn{background:#3a1513;color:#ffaaa4}
.form{background:var(--card);border:1px solid #5a4a14;border-radius:14px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.form .full{grid-column:1/-1}
@media(max-width:560px){.form{grid-template-columns:1fr}}
label{display:block;font-size:11.5px;color:var(--mute);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.field{width:100%;min-width:0;border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:10px 12px;font-size:16px;color:var(--fg)}
.field:focus{outline:2px solid var(--pri)}
.msg{font-size:14px;min-height:1em}.msg.err{color:#ffaaa4}.msg.ok{color:#8ce3ad}
.share{white-space:pre-wrap;background:var(--soft);border:1px dashed #5a4a14;border-radius:10px;padding:10px;font-size:14px}
.empty{color:var(--mute);text-align:center;padding:18px}
.perms{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}
.sw{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:9px 11px;cursor:pointer;font-size:14px;font-weight:600;text-transform:none;letter-spacing:0;color:var(--fg);margin:0}
.sw input{appearance:none;-webkit-appearance:none;width:40px;height:22px;border-radius:999px;background:#3a372f;position:relative;flex:0 0 40px;cursor:pointer;transition:background .15s}
.sw input::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}
.sw input:checked{background:var(--ok)}.sw input:checked::after{left:21px}
.sw input:disabled{opacity:.4}
.mods{font-size:12.5px;color:var(--mute);margin-top:4px}.mods b{color:var(--fg);font-weight:600}
.cats{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.cat{white-space:nowrap;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer}
.cat.on{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}.cat i{font-style:normal;opacity:.7;margin-left:4px}
.ava{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#3a2f0a;color:#ffd257;display:flex;align-items:center;justify-content:center;font-weight:800;flex:0 0 44px}
.pbar{height:4px;border-radius:9px;background:#2c2a25;margin-top:6px;max-width:220px;overflow:hidden}.pbar i{display:block;height:100%;background:var(--pri)}
.c-blue{background:#12263a;color:#8cc4ff}.c-pur{background:#2a1a3a;color:#d6a8ff}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}@media(max-width:700px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}.stat small{display:block;color:var(--mute);font-size:12px;font-weight:600}.stat b{font-size:26px;line-height:1.15;font-variant-numeric:tabular-nums}
.stat.y{border-color:#4a3f14;background:#1c180b}.stat.y b{color:#ffd257}.stat.g b{color:#8ce3ad}.stat.r b{color:#ffaaa4}
.tool{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tool .field{flex:1;min-width:220px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:10px}
.sc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s}
.sc:hover{border-color:#4a3f14}.sc.off{opacity:.62}
.sc .sch{display:flex;gap:12px;align-items:center}.sc .nm{flex:1;min-width:0}.sc .nm b{display:block;font-size:15.5px;line-height:1.25;cursor:pointer;overflow-wrap:anywhere}
.sc .nm small{color:var(--mute);font-size:12.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc .meta{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:var(--mute)}
.sc .ft{display:flex;gap:6px;border-top:1px solid var(--line);padding-top:10px;margin-top:auto}.sc .ft .btn{flex:1;text-align:center}
.sc .pbar{max-width:none;margin-top:0}
.chips{display:flex;flex-wrap:wrap;gap:4px}.chips .chip{margin:0}
`;
const FULL_CSS = CSS + PROFILE_CSS + `.inbox{border-color:#5a4a14}.inbox .it{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--soft)}
.inbox .it .grow{min-width:200px}.badge{background:#e0473f;color:#fff;border-radius:99px;font-size:12px;padding:1px 7px;margin-left:6px}`;
const rmx = n => "RM" + Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dmyx = s => { if (!s) return "-"; const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
const KLx = 8 * 3600000, ymx = () => new Date(Date.now() + KLx).toISOString().slice(0, 7);
const ROLES = { operations: "Operations (staff)", sales_advisor: "Sales Advisor", owner: "Owner" };
const ROLE_HINT = { operations: "Lalai: semua menu kecuali Jualan, Pelanggan, Laporan dan TikTok Lead. Boleh ubah di bawah.", sales_advisor: "Lalai: semua menu termasuk Runner & TikTok Lead. Boleh ubah di bawah.", owner: "Akses penuh termasuk sahkan pemeriksaan, modal dan urus staff." };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => { if (!s) return "belum pernah"; const d = new Date(s); return isNaN(d) ? "-" : d.toLocaleString("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
const MENUS = [["inventory","Inventori"],["suppliers","Pembekal"],["pemeriksaan","Pemeriksaan"],["kehadiran","Kehadiran"],["puspakom","Puspakom"],["runner","Runner"],["belanja","Perbelanjaan"],["sales","Jualan"],["customers","Pelanggan"],["applications","Permohonan"],["sewa","Sewa"],["reports","Laporan"],["tiktok","TikTok Lead"]];
function defPerm(role, page) { if (role === "owner") return true; if (role === "operations" && ["sales", "customers", "reports"].includes(page)) return false; if (page === "runner" && !["operations", "sales_advisor"].includes(role)) return false; if (page === "tiktok" && role !== "sales_advisor") return false; return true; }
function canPage(u, page) { if (u.role === "owner") return true; const v = u.permissions && typeof u.permissions === "object" ? u.permissions[page] : undefined; return typeof v === "boolean" ? v : defPerm(u.role, page); }
const SUPA_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import { mountHRDashboard } from "./hr-dashboard.mjs?v=hr6-staging";
import { mountHRAssistant } from "./hr-assistant.mjs?v=hr6-staging";

import { mountKpi } from "./hr-kpi.mjs?v=1";

import { mountAssets } from "./hr-assets.mjs?v=1";

export function mountStaff(host, ctx) {
  const client = ctx.client, me = ctx.profile || {};
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${FULL_CSS}</style><section class="shell" id="app"></section>`;
  const app = root.getElementById("app");
  const S = { rows: null, err: "", mode: null, edit: null, msg: "", msgCls: "", share: "", hr: {}, cat: "all", q: "", prof: null, urls: {}, inbox: { leaves: [], claims: [], adv: [] } };
  const $ = s => root.querySelector(s);

  async function load() {
    const { data, error } = await client.rpc("staff_list");
    if (error) {
      S.rows = [];
      S.err = /staff_list|function/i.test(error.message) && /not find|does not exist|schema cache/i.test(error.message)
        ? "Fungsi staff belum dipasang. Jalankan V66_STAFF_MIGRATION.sql dalam Supabase SQL Editor."
        : "Gagal memuatkan staff: " + error.message;
    } else { S.rows = data || []; S.err = ""; }
    const hr = await client.from("staff_hr").select("staff_id,staff_code,ic_no,phone,address,dob,gender,emergency_name,emergency_phone,join_date,position,department,category,employment_type,contract_status,bank_name,bank_account,epf_no,socso_no,photo_path,ic_photo_path");
    S.hr = {}; (hr.data || []).forEach(h => S.hr[h.staff_id] = h);
    const [il, ic, ia] = await Promise.all([client.from("staff_leaves").select("*").eq("status", "pending").order("date_from"),
      client.from("staff_claims").select("*").eq("status", "pending").order("claim_date"), client.from("staff_advances").select("*").eq("status", "requested").order("created_at")]);
    S.inbox = { leaves: il.data || [], claims: ic.data || [], adv: ia.data || [] };
    const paths = [...Object.values(S.hr).map(h => h.photo_path), ...S.inbox.claims.map(c => c.receipt_path), ...S.inbox.leaves.map(l => l.attachment_path)].filter(Boolean);
    if (paths.length) { const { data: u } = await client.storage.from("staff-docs").createSignedUrls(paths, 3600); (u || []).forEach(x => { if (x.signedUrl) S.urls[x.path] = x.signedUrl; }); }
    render();
  }

  function openProfile(uid) {
    const u = S.rows.find(r => r.id === uid); if (!u) return;
    S.prof = uid; mountProfile(app, ctx, u, () => { S.prof = null; load(); });
    host.scrollIntoView?.({ block: "start" });
  }
  function render() {
    if (S.prof) return;
    const all = S.rows, catOf = u => (S.hr[u.id]?.category) || "staff_biasa";
    const counts = {}; (all || []).forEach(u => counts[catOf(u)] = (counts[catOf(u)] || 0) + 1);
    const q = S.q.toLowerCase();
    const rows = all === null ? null : all.filter(u => (S.cat === "all" || catOf(u) === S.cat) && (!q || [u.full_name, u.email, S.hr[u.id]?.staff_code, S.hr[u.id]?.position, S.hr[u.id]?.ic_no].join(" ").toLowerCase().includes(q)));
    const catBar = all && all.length ? `<div class="tool"><input class="field" id="q" placeholder="🔍 Cari nama, IC, Staff ID, jawatan…" value="${esc(S.q)}"></div><div class="cats"><span class="cat ${S.cat === "all" ? "on" : ""}" data-cat="all">Semua<i>${all.length}</i></span>${Object.entries(CATEGORY).filter(([k]) => counts[k]).map(([k, t]) => `<span class="cat ${S.cat === k ? "on" : ""}" data-cat="${k}">${t}<i>${counts[k]}</i></span>`).join("")}</div>` : "";
    const nIn = S.inbox.leaves.length + S.inbox.claims.length + S.inbox.adv.length, act = (all || []).filter(u => u.enabled).length;
    const low = (all || []).filter(u => u.enabled && completeness(S.hr[u.id]).pct < 80).length;
    app.innerHTML = `${S.mode ? "" : `<div class="stats"><div class="stat"><small>Jumlah staff</small><b>${all ? all.length : "–"}</b></div><div class="stat g"><small>Aktif</small><b>${all ? act : "–"}</b></div>
        <div class="stat ${nIn ? "y" : ""}"><small>Menunggu kelulusan</small><b>${nIn}</b></div><div class="stat ${low ? "r" : ""}"><small>Profil belum lengkap</small><b>${all ? low : "–"}</b></div></div>`}
      ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ""}
      ${S.mode ? formView() : ""}
      ${S.share ? `<div class="share" id="share">${esc(S.share)}</div><div class="row"><button class="btn sm" data-a="copy">Salin untuk WhatsApp</button><button class="btn sm" data-a="hide">Tutup</button></div>` : ""}
      <p class="msg ${S.msgCls}" id="msg">${esc(S.msg)}</p>
      ${!S.mode && me.role === "owner" && all && !S.err ? `<div id="hr-dashboard"></div><details class="sec" id="hr-assistant-wrap"><summary>HR Assistant</summary><div id="hr-assistant"></div></details>` : ""}
      ${!S.mode && me.role === "owner" && all && !S.err ? `<details class="sec" id="hr-kpi-wrap"><summary>Sasaran &amp; Penilaian KPI</summary><div id="hr-kpi"></div></details>` : ""}
      ${!S.mode && me.role === "owner" && all && !S.err ? `<details class="sec" id="hr-assets-wrap"><summary>Pengurusan aset syarikat</summary><div id="hr-assets"></div></details>` : ""}
      ${!S.mode && me.role === "owner" && all && !S.err ? `<details class="sec" id="payroll-queue-wrap"><summary>Kelulusan Payroll</summary><div id="payroll-queue"></div></details>` : ""}
      ${!S.mode && me.role === "owner" && all && !S.err ? `<details class="sec" id="hr-delegate-wrap"><summary>Akses HR khas &amp; kelulusan</summary><div id="hr-delegate"></div></details>` : ""}
      ${S.mode ? "" : inboxView()}
      ${S.mode ? "" : `<div class="row" style="margin-top:4px"><div class="grow"><div class="kick">PASUKAN</div><h3>Senarai staff</h3></div><button class="btn pri" data-a="new">+ Tambah staff</button></div>${catBar}`}
      <div class="grid">${rows === null ? `<div class="empty">Memuatkan…</div>` : (globalThis.adaPg?globalThis.adaPg.rows("st-acc",rows,render):rows).map(item).join("") || `<div class="empty">Tiada staff ditemui.</div>`}</div>${rows?(globalThis.adaPg?globalThis.adaPg.nav("st-acc",rows.length):""):""}
      ${S.mode ? "" : `<p class="mute">Setiap staff log masuk dengan emel dan kata laluan sendiri di <b>abedinauto.my/admin</b>.</p>`}`;
    const hrDash = app.querySelector("#hr-dashboard"); if (hrDash) mountHRDashboard(hrDash, ctx, all);
    const ha = app.querySelector("#hr-assistant-wrap"); if (ha) ha.ontoggle = () => { if (ha.open && !ha.dataset.loaded) { ha.dataset.loaded = "1"; mountHRAssistant(ha.querySelector("#hr-assistant"), ctx, all); } };
    const kpi = app.querySelector("#hr-kpi-wrap"); if (kpi) kpi.ontoggle = () => { if (kpi.open && !kpi.dataset.loaded) { kpi.dataset.loaded = "1"; mountKpi(kpi.querySelector("#hr-kpi"), ctx, all); } };
    const assets = app.querySelector("#hr-assets-wrap"); if (assets) assets.ontoggle = () => { if (assets.open && !assets.dataset.loaded) { assets.dataset.loaded = "1"; mountAssets(assets.querySelector("#hr-assets"), ctx); } };
    const pq=app.querySelector("#payroll-queue-wrap"); if(pq) pq.ontoggle=()=>{if(pq.open && !pq.dataset.loaded){pq.dataset.loaded="1";mountPayrollQueue(pq.querySelector("#payroll-queue"),ctx,all);}};
    const hd=app.querySelector("#hr-delegate-wrap"); if(hd) hd.ontoggle=()=>{if(hd.open&&!hd.dataset.loaded){hd.dataset.loaded="1";mountHROwnerAccess(hd.querySelector("#hr-delegate"),ctx,all);}};
    bind();
  }

  function inboxView() {
    const I = S.inbox, n = I.leaves.length + I.claims.length + I.adv.length; if (!n) return "";
    const nm = id => esc((S.rows || []).find(r => r.id === id)?.full_name || "Staff");
    const link = p => p && S.urls[p] ? ` · <a href="${esc(S.urls[p])}" target="_blank" style="color:var(--pri)">${/\.pdf$/i.test(p) ? "PDF" : "Lampiran"}</a>` : "";
    const btns = (t, id) => `<button class="btn sm pri" data-ok="${t}:${id}">Lulus</button><button class="btn sm" data-no="${t}:${id}">Tolak</button>`;
    return `<div class="sec inbox"><div class="row"><h4 class="grow">Menunggu kelulusan<span class="badge">${n}</span></h4></div><div class="list" style="margin-top:8px">
      ${(globalThis.adaPg?globalThis.adaPg.rows("st-leave",I.leaves,render):I.leaves).map(l => `<div class="it"><div class="grow"><b>${nm(l.staff_id)}</b> · ${LEAVE[l.kind]} ${+l.days} hari<div class="mute">${dmyx(l.date_from)}${l.date_to !== l.date_from ? " – " + dmyx(l.date_to) : ""}${l.reason ? " · " + esc(l.reason) : ""}${link(l.attachment_path)}</div></div>${btns("staff_leaves", l.id)}</div>`).join("")}${(globalThis.adaPg?globalThis.adaPg.nav("st-leave",I.leaves.length):"")}
      ${(globalThis.adaPg?globalThis.adaPg.rows("st-claim",I.claims,render):I.claims).map(c => `<div class="it"><div class="grow"><b>${nm(c.staff_id)}</b> · Tuntutan ${esc(CLAIM[c.category])} <b>${rmx(c.amount)}</b><div class="mute">${dmyx(c.claim_date)} · ${esc(c.description)}${c.receipt_path ? link(c.receipt_path) : " · tiada resit"}</div></div>${btns("staff_claims", c.id)}</div>`).join("")}${(globalThis.adaPg?globalThis.adaPg.nav("st-claim",I.claims.length):"")}
      ${I.adv.map(a => `<div class="it"><div class="grow"><b>${nm(a.staff_id)}</b> · Advance <b>${rmx(a.amount)}</b> / ${a.months} bulan<div class="mute">Mula potong ${esc(a.start_month)} · ${rmx(a.monthly)} sebulan${a.note ? " · " + esc(a.note) : ""}</div></div>${btns("staff_advances", a.id)}</div>`).join("")}
      </div><p class="mute" style="margin-top:6px">Tuntutan yang diluluskan di sini dibayar bersama gaji bulan ${esc(ymx())}. Untuk pilih bulan lain, buka Profil staff.</p></div>`;
  }
  async function decide(btn, ok) {
    const [t, id] = (ok ? btn.dataset.ok : btn.dataset.no).split(":");
    const note = ok ? null : prompt("Sebab tolak (pilihan):", ""); if (!ok && note === null) return;
    const now = new Date().toISOString();
    const patch = t === "staff_leaves" ? { status: ok ? "approved" : "rejected", review_note: note || null, reviewed_by: me.id, reviewed_at: now }
      : t === "staff_claims" ? { status: ok ? "approved" : "rejected", pay_month: ok ? ymx() : null, review_note: note || null, reviewed_by: me.id, reviewed_at: now }
      : { status: ok ? "active" : "rejected", review_note: note || null };
    btn.disabled = true;
    const { error } = await client.from(t).update(patch).eq("id", id);
    if (error) { btn.disabled = false; return say("Gagal: " + error.message, "err"); }
    say(ok ? "Diluluskan ✓" : "Ditolak.", "ok"); load();
  }
  function item(u) {
    const self = u.id === me.id, h = S.hr[u.id] || {}, c = completeness(h), ph = h.photo_path && S.urls[h.photo_path];
    const ini = (u.full_name || "?").split(/\s+/).filter(w => !/^(bin|binti|bt|b)$/i.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const menus = u.role === "owner" ? null : MENUS.filter(([k]) => canPage(u, k)).map(([, t]) => t);
    return `<div class="sc ${u.enabled ? "" : "off"}">
      <div class="sch">${ph ? `<img class="ava" src="${esc(ph)}" alt="">` : `<div class="ava">${esc(ini)}</div>`}
        <div class="nm"><b data-prof="${esc(u.id)}">${esc(u.full_name || "(tiada nama)")}${self ? ` <span class="mute" style="font-weight:500">· anda</span>` : ""}</b><small>${esc(h.position || u.email || "-")}${h.staff_code ? " · " + esc(h.staff_code) : ""}</small></div>
        <span class="chip ${u.enabled ? "c-on" : "c-off"}">${u.enabled ? "Aktif" : "Nyahaktif"}</span></div>
      <div class="chips"><span class="chip c-role">${esc(ROLES[u.role] || u.role || "-")}</span><span class="chip c-pur">${esc(CATEGORY[h.category || "staff_biasa"])}</span>${h.employment_type && h.employment_type !== "permanent" ? `<span class="chip c-off">${esc(EMP_TYPE[h.employment_type])}</span>` : ""}${h.contract_status && h.contract_status !== "active" ? `<span class="chip c-warn">${esc(CONTRACT[h.contract_status])}</span>` : ""}${u.email_confirmed === false ? `<span class="chip c-warn">Emel belum disahkan</span>` : ""}</div>
      <div class="meta"><span title="${esc(menus ? menus.join(", ") : "Semua menu")}">Akses: <b style="color:var(--fg)">${menus ? (menus.length ? menus.length + " menu" : "Dashboard sahaja") : "Semua menu"}</b></span><span>Masuk: ${fmt(u.last_sign_in_at)}</span></div>
      <div><div class="meta" style="margin-bottom:4px"><span>Profil HR</span><span>${c.pct}%</span></div><div class="pbar"><i style="width:${c.pct}%"></i></div></div>
      <div class="ft"><button class="btn sm pri" data-prof="${esc(u.id)}">Profil</button>${self ? "" : `<button class="btn sm" data-edit="${esc(u.id)}">Edit akses</button><button class="btn sm ${u.enabled ? "bad" : "pri"}" data-tog="${esc(u.id)}">${u.enabled ? "Nyahaktif" : "Aktifkan"}</button>`}</div></div>`;
  }

  function formView() {
    const e = S.edit || {}, isNew = S.mode === "new", link = S.mode === "link";
    return `<form class="form" id="f">
      <div class="full"><b>${isNew ? "Tambah staff baharu" : link ? "Sambung akaun sedia ada" : "Edit staff"}</b>
        <p class="mute">${isNew ? "Akaun log masuk dicipta terus. Beri emel dan kata laluan ini kepada staff." : link ? "Untuk akaun yang sudah dicipta dalam Supabase Auth atau sudah daftar sendiri." : ""}</p></div>
      <div><label>Nama penuh</label><input class="field" name="nama" required value="${esc(e.full_name || "")}"></div>
      <div><label>Emel</label><input class="field" name="email" type="email" required ${S.mode === "edit" ? "readonly" : ""} value="${esc(e.email || "")}" autocomplete="off"></div>
      ${isNew ? `<div><label>Kata laluan (min 8 aksara)</label><input class="field" name="pw" type="text" minlength="8" required autocomplete="new-password" value="${esc(genPw())}"></div>` : ""}
      <div><label>Peranan</label><select class="field" name="role">${Object.entries(ROLES).map(([k, t]) => `<option value="${k}" ${(e.role || "operations") === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <p class="mute full" id="hint">${esc(ROLE_HINT[e.role || "operations"])}</p>
      <div class="full" id="permbox">${permHtml(e.role || "operations", e)}</div>
      <div class="full row"><button class="btn pri" type="submit">${isNew ? "Cipta akaun" : "Simpan"}</button><button class="btn" type="button" data-a="cancel">Batal</button>
        <span class="grow"></span>${isNew ? `<button class="btn sm" type="button" data-a="link">Akaun sudah wujud?</button>` : ""}</div>
    </form>`;
  }
  function permHtml(role, u) {
    if (role === "owner") return `<p class="mute">Owner sentiasa boleh buka semua menu.</p>`;
    const cur = { role, permissions: u && u.role === role ? u.permissions : null };
    return `<label>Menu yang boleh dibuka</label><div class="perms">${MENUS.map(([k, t]) => {
      const lock = k === "runner" && role !== "operations";
      return `<label class="sw"><span>${t}</span><input type="checkbox" name="perm_${k}" ${canPage(cur, k) && !lock ? "checked" : ""} ${lock ? "disabled title=\"Runner hanya untuk peranan Operations\"" : ""}></label>`; }).join("")}</div>
      <p class="mute" style="margin-top:6px">Dashboard dan Tetapan sentiasa boleh dibuka. Menu yang ditutup disorok daripada staff ini.</p>`;
  }
  function readPerms(form, role) {
    if (role === "owner") return {};
    const o = {}; MENUS.forEach(([k]) => { const i = form.querySelector(`[name=perm_${k}]`); if (i) o[k] = !i.disabled && i.checked; }); return o;
  }
  function genPw() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; let s = ""; const a = new Uint32Array(10); crypto.getRandomValues(a); a.forEach(n => s += c[n % c.length]); return s; }
  function say(t, cls) { S.msg = t; S.msgCls = cls || ""; const m = $("#msg"); if (m) { m.textContent = t; m.className = "msg " + (cls || ""); } }

  function bind() {
    app.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === "new") { S.mode = "new"; S.edit = null; S.share = ""; say(""); render(); }
      if (a === "link") { S.mode = "link"; render(); }
      if (a === "cancel") { S.mode = null; S.edit = null; render(); }
      if (a === "hide") { S.share = ""; render(); }
      if (a === "copy") navigator.clipboard?.writeText(S.share).then(() => say("Disalin ✓", "ok"), () => say("Pilih teks di atas dan salin.", ""));
    });
    app.querySelectorAll("[data-ok]").forEach(b => b.onclick = () => decide(b, true));
    app.querySelectorAll("[data-no]").forEach(b => b.onclick = () => decide(b, false));
    app.querySelectorAll("[data-prof]").forEach(b => b.onclick = () => openProfile(b.dataset.prof));
    app.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { S.cat = b.dataset.cat; render(); });
    const qi = $("#q"); if (qi) qi.oninput = () => { S.q = qi.value; const pos = qi.selectionStart; render(); const n = $("#q"); n.focus(); n.setSelectionRange(pos, pos); };
    app.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { S.edit = S.rows.find(r => r.id === b.dataset.edit); S.mode = "edit"; S.share = ""; render(); });
    app.querySelectorAll("[data-tog]").forEach(b => b.onclick = async () => {
      const u = S.rows.find(r => r.id === b.dataset.tog), was = !!u.enabled; b.disabled = true;
      const { error } = await client.rpc("staff_save", { p_email: u.email, p_full_name: u.full_name || u.email, p_role: u.role || "operations", p_enabled: !was });
      if (error) { b.disabled = false; return say("Gagal: " + error.message, "err"); }
      say(was ? `${u.full_name} dinyahaktifkan.` : `${u.full_name} diaktifkan.`, "ok"); load();
    });
    const sel = $("select[name=role]"); if (sel) sel.onchange = () => { $("#hint").textContent = ROLE_HINT[sel.value]; $("#permbox").innerHTML = permHtml(sel.value, S.edit); };
    const f = $("#f"); if (f) f.onsubmit = submit;
  }

  async function submit(ev) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget), nama = String(f.get("nama") || "").trim(), email = String(f.get("email") || "").trim().toLowerCase(), role = String(f.get("role")), pw = String(f.get("pw") || "");
    const perms = readPerms(ev.currentTarget, role);
    const btn = ev.currentTarget.querySelector("[type=submit]"); btn.disabled = true; say("Sila tunggu…");
    try {
      if (S.mode === "new") {
        if (pw.length < 8) throw new Error("Kata laluan sekurang-kurangnya 8 aksara.");
        const { createClient } = await import(SUPA_ESM);
        const tmp = createClient(ctx.url, ctx.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "ada-staff-create" } });
        const { data, error } = await tmp.auth.signUp({ email, password: pw, options: { data: { full_name: nama } } });
        if (error) {
          if (/not allowed|disabled/i.test(error.message)) throw new Error("Pendaftaran akaun baharu dimatikan dalam Supabase (Authentication → Sign In / Providers → Allow new users to sign up). Hidupkan, atau cipta akaun dalam Supabase Auth dan guna \"Akaun sudah wujud?\".");
          if (/already registered|already exists/i.test(error.message)) throw new Error("Emel ini sudah ada akaun. Tekan \"Akaun sudah wujud?\" untuk sambungkannya.");
          throw error;
        }
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error("Emel ini sudah ada akaun. Tekan \"Akaun sudah wujud?\" untuk sambungkannya.");
        try { await tmp.auth.signOut(); } catch (_) {}
        const needConfirm = !data?.session;
        const r = await client.rpc("staff_save", { p_email: email, p_full_name: nama, p_role: role, p_enabled: true, p_permissions: perms });
        if (r.error) throw r.error;
        S.share = `Akaun Abe Din Auto anda:\nPautan: https://abedinauto.my/admin\nEmel: ${email}\nKata laluan: ${pw}\n${needConfirm ? "\nSila sahkan emel anda dahulu (semak inbox/spam) sebelum log masuk.\n" : ""}Tukar kata laluan selepas log masuk pertama jika perlu.`;
        S.mode = null; say(`Akaun ${nama} dicipta${needConfirm ? ". Staff perlu sahkan emel dahulu (Supabase hantar emel pengesahan)." : " dan diaktifkan."}`, "ok");
      } else {
        const enabled = S.mode === "edit" ? !!S.edit.enabled : true;
        const r = await client.rpc("staff_save", { p_email: email, p_full_name: nama, p_role: role, p_enabled: enabled, p_permissions: perms });
        if (r.error) throw r.error;
        S.mode = null; S.edit = null; say(`${nama} disimpan.`, "ok");
      }
      await load();
    } catch (e) { btn.disabled = false; say(e?.message || String(e), "err"); }
  }

  render(); load();
  window.__adaLive?.(host, ["staff_leaves","staff_claims","staff_advances","staff_hr","staff_pay"], load, () => !!(S.mode || S.prof));
}
