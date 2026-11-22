// Abe Din Auto – "Profil Saya": layan diri untuk setiap staf yang log masuk.
// Ringkasan, mohon cuti, slip gaji, tuntutan (claim) dengan resit, mohon advance, kemas kini maklumat sendiri.
// Data & kebenaran: V73_STAFF_HR.sql + V74_STAFF_SELF_SERVICE.sql. Slip gaji dikira oleh computeSlip() (kehadiran.js).
import { CSS } from "./staff.js?v=13";
import { PROFILE_CSS, CATEGORY, EMP_TYPE, LEAVE, CLAIM, leaveEntitle } from "./staff-profile.js?v=8";
import { slipHtml, printSlip, rm, monthName } from "./slip.js?v=1";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KL = 8 * 3600000;
const todayK = () => new Date(Date.now() + KL).toISOString().slice(0, 10);
const ymNow = () => todayK().slice(0, 7);
const dmy = s => { if (!s) return "-"; const [y, m, d] = String(s).slice(0, 10).split("-"); return d ? `${d}/${m}/${y}` : "-"; };
const nextDay = k => new Date(Date.parse(k + "T00:00:00Z") + 864e5).toISOString().slice(0, 10);
const dow = k => new Date(k + "T00:00:00Z").getUTCDay();
const addM = (m, n) => { const [y, mo] = m.split("-").map(Number), t = y * 12 + mo - 1 + n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const mIdx = (a, b) => { const [y1, m1] = a.split("-").map(Number), [y2, m2] = b.split("-").map(Number); return (y2 - y1) * 12 + (m2 - m1); };
const ST = { pending: ["Menunggu", "c-role"], approved: ["Lulus", "c-on"], rejected: ["Ditolak", "c-warn"], paid: ["Dibayar", "c-blue"], requested: ["Menunggu", "c-role"], active: ["Aktif", "c-blue"], done: ["Selesai", "c-on"], cancelled: ["Batal", "c-off"] };
const chip = s => `<span class="chip ${(ST[s] || ["", "c-off"])[1]}">${(ST[s] || [s])[0]}</span>`;
const TABS = [["home", "Ringkasan"], ["cuti", "Cuti"], ["gaji", "Slip Gaji"], ["claim", "Tuntutan"], ["advance", "Advance"], ["info", "Maklumat Saya"]];
const ME_CSS = `.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.tabs button{white-space:nowrap;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer;color:var(--fg)}
.tabs button.on{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}.badge{background:#e0473f;color:#fff;border-radius:99px;font-size:11px;padding:1px 6px;margin-left:4px}
.field{font-size:16px}textarea.field{resize:vertical}.list2{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.it{border:1px solid var(--line);border-radius:12px;padding:11px;background:var(--soft)}.it .row{gap:6px}
.go{cursor:pointer}.go:hover{border-color:#5a4a14}
@media (max-width:640px){.tabs{gap:5px}.tabs button{font-size:12.5px;padding:6px 11px}.it{padding:9px}.field{padding:9px 11px}label{font-size:11.5px}}`;

async function shrink(file) {
  if (!/^image\//.test(file.type) || file.size < 600000) return file;
  const img = await createImageBitmap(file).catch(() => null); if (!img) return file;
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(b => r(b ? new File([b], "img.jpg", { type: "image/jpeg" }) : file), "image/jpeg", .85));
}

export function mountStaffMe(host, ctx) {
  const client = ctx.client, me = ctx.profile || {}, uid = me.id;
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}${PROFILE_CSS}${ME_CSS}</style><section class="shell" id="app"></section>`;
  const app = root.getElementById("app");
  const S = { tab: new URLSearchParams(location.search).get("tab") || "home", hr: null, pay: null, settings: null, leaves: [], claims: [], adv: [], urls: {}, msg: "", cls: "", err: "", month: ymNow(), slip: null, slipErr: "", slipBusy: false, editInfo: false };
  if (!TABS.some(t => t[0] === S.tab)) S.tab = "home";
  const say = (t, c) => { S.msg = t; S.cls = c || ""; const m = app.querySelector("#mmsg"); if (m) { m.textContent = t; m.className = "msg " + (c || ""); } };

  async function load() {
    const r = await Promise.all([client.from("staff_hr").select("*").eq("staff_id", uid).maybeSingle(), client.from("staff_pay").select("*").eq("staff_id", uid).maybeSingle(),
      client.from("attendance_settings").select("work_days").eq("id", 1).maybeSingle(),
      client.from("staff_leaves").select("*").eq("staff_id", uid).order("date_from", { ascending: false }),
      client.from("staff_claims").select("*").eq("staff_id", uid).order("claim_date", { ascending: false }),
      client.from("staff_advances").select("*").eq("staff_id", uid).order("created_at", { ascending: false })]);
    const e = r.find(x => x.error)?.error;
    S.err = e ? (/does not exist|schema cache/i.test(e.message) ? "Pangkalan data Profil belum lengkap (V73/V74)." : e.message) : "";
    S.hr = r[0].data || {}; S.pay = r[1].data; S.settings = r[2].data || { work_days: [0, 1, 2, 3, 4, 6] };
    S.leaves = r[3].data || []; S.claims = r[4].data || []; S.adv = r[5].data || [];
    const paths = [S.hr.photo_path, ...S.claims.map(c => c.receipt_path), ...S.leaves.map(l => l.attachment_path)].filter(p => p && !S.urls[p]);
    if (paths.length) { const { data } = await client.storage.from("staff-docs").createSignedUrls(paths, 3600); (data || []).forEach(d => { if (d.signedUrl) S.urls[d.path] = d.signedUrl; }); }
    render();
    if (S.tab === "gaji" && !S.slip) loadSlip();
  }
  async function loadSlip() {
    S.slipBusy = true; S.slipErr = ""; render();
    try { const m = await import("./kehadiran.js?v=8"); S.slip = await m.computeSlip(client, me, uid, S.month); }
    catch (e) { S.slipErr = e?.message || String(e); S.slip = null; }
    S.slipBusy = false; render();
  }
  async function upload(file, name) {
    file = await shrink(file); if (file.size > 5242880) throw new Error("Fail melebihi 5MB.");
    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${uid}/${name}-${Date.now()}.${ext}`;
    const { error } = await client.storage.from("staff-docs").upload(path, file, { contentType: file.type || "image/jpeg" }); if (error) throw error; return path;
  }
  const workdaysBetween = (a, b) => { let n = 0; for (let k = a; k <= b; k = nextDay(k)) if ((S.settings.work_days || []).includes(dow(k))) n++; return n; };
  const fileLink = p => p && S.urls[p] ? ` · <a href="${esc(S.urls[p])}" target="_blank" style="color:var(--pri)">${/\.pdf$/i.test(p) ? "PDF" : "Lihat"}</a>` : "";

  function balances() {
    const e = leaveEntitle(S.hr), yr = todayK().slice(0, 4), L = S.leaves.filter(l => String(l.date_from).startsWith(yr));
    const used = (k, s) => L.filter(l => l.kind === k && l.status === s).reduce((a, l) => a + +l.days, 0);
    const one = k => { const ent = e[k] ?? null, u = used(k, "approved"), p = used(k, "pending"); return { k, ent, u, p, rem: ent == null ? null : ent - u - p }; };
    const list = ["annual", "mc", "hosp"]; if (S.hr.gender !== "female") list.push("paternity"); if (S.hr.gender !== "male") list.push("maternity"); list.push("unpaid", "emergency");
    return list.map(one);
  }
  const tile = (b, cls) => `<div class="tile ${cls || ""}"><small>${LEAVE[b.k]}</small><b>${b.ent == null ? b.u + " hari" : `${b.rem}/${b.ent}`}</b><small>${b.ent == null ? "diambil tahun ini" : `Diambil ${b.u} · Menunggu ${b.p}`}</small></div>`;

  function header() {
    const h = S.hr, ph = h.photo_path && S.urls[h.photo_path];
    const ini = (me.full_name || "?").split(/\s+/).filter(w => !/^(bin|binti|bt|b)$/i.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    return `<div class="hd">${ph ? `<img class="av" src="${esc(ph)}" alt="">` : `<div class="av">${esc(ini)}</div>`}<div class="grow"><div class="kick">PROFIL SAYA</div><h2>${esc((me.full_name || "").toUpperCase())}</h2>
      <div class="meta">${esc(h.position || "Jawatan belum ditetapkan")}${h.department ? " · " + esc(h.department) : ""}${h.staff_code ? " · ID " + esc(h.staff_code) : ""}</div>
      <div class="chips"><span class="chip c-pur">${esc(CATEGORY[h.category] || "Staff Biasa")}</span><span class="chip c-role">${esc(EMP_TYPE[h.employment_type] || "Tetap")}</span>${h.join_date ? `<span class="chip c-gry">Mula ${dmy(h.join_date)}</span>` : ""}</div></div></div>`;
  }
  function tabs() {
    const pend = { cuti: S.leaves.filter(l => l.status === "pending").length, claim: S.claims.filter(c => c.status === "pending").length, advance: S.adv.filter(a => a.status === "requested").length };
    return `<div class="tabs">${TABS.map(([k, t]) => `<button class="${S.tab === k ? "on" : ""}" data-tab="${k}">${t}${pend[k] ? `<span class="badge">${pend[k]}</span>` : ""}</button>`).join("")}</div>`;
  }

  function vHome() {
    const b = balances(), al = b.find(x => x.k === "annual"), mc = b.find(x => x.k === "mc");
    const cp = S.claims.filter(c => c.status === "pending"), ca = S.claims.filter(c => c.status === "approved");
    const cur = ymNow(), act = S.adv.filter(a => a.status === "active");
    const advNow = act.reduce((t, a) => { const i = mIdx(a.start_month, cur); return i >= 0 && i < a.months ? t + +a.monthly : t; }, 0);
    const recent = [...S.leaves.map(l => ({ t: l.created_at, h: `Cuti: ${LEAVE[l.kind]} ${dmy(l.date_from)} (${+l.days} hari)`, s: l.status })), ...S.claims.map(c => ({ t: c.created_at, h: `Tuntutan: ${CLAIM[c.category]} ${rm(c.amount)}`, s: c.status })), ...S.adv.map(a => ({ t: a.created_at, h: `Advance: ${rm(a.amount)} / ${a.months} bulan`, s: a.status }))].sort((x, y) => String(y.t).localeCompare(String(x.t))).slice(0, 6);
    return `<div class="tiles"><div class="tile go" data-tab="cuti"><small>Baki cuti tahunan</small><b>${al.rem}/${al.ent}</b><small>hari</small></div><div class="tile t-g go" data-tab="cuti"><small>Baki cuti sakit</small><b>${mc.rem}/${mc.ent}</b><small>hari</small></div>
      <div class="tile t-y go" data-tab="claim"><small>Tuntutan menunggu</small><b>${rm(cp.reduce((t, c) => t + +c.amount, 0))}</b><small>${cp.length} tuntutan${ca.length ? ` · ${ca.length} diluluskan` : ""}</small></div>
      <div class="tile t-b go" data-tab="advance"><small>Potongan advance ${esc(monthName(cur))}</small><b>${rm(advNow)}</b><small>${act.length} pelan aktif</small></div>
      <div class="tile t-p go" data-tab="gaji"><small>Gaji asas</small><b>${S.pay ? rm(S.pay.rate) : "–"}</b><small>${S.pay ? { daily: "sehari", hourly: "sejam", monthly: "sebulan" }[S.pay.pay_type] : "belum ditetapkan"} · lihat slip</small></div></div>
      <div class="row" style="margin-top:4px"><button class="btn pri" data-tab="cuti" data-new="1">+ Mohon cuti</button><button class="btn" data-tab="claim" data-new="1">+ Hantar tuntutan</button><button class="btn" data-tab="gaji">Slip gaji</button></div>
      <div class="sec"><h4>Aktiviti terkini</h4><div class="list2">${recent.map(r => `<div class="it row"><span class="grow">${esc(r.h)}</span>${chip(r.s)}</div>`).join("") || `<p class="note">Belum ada permohonan.</p>`}</div></div>`;
  }

  function vCuti() {
    const b = balances(), cls = { annual: "", mc: "t-g", hosp: "t-y", paternity: "t-b", maternity: "t-b", unpaid: "t-p", emergency: "" };
    return `<div class="sec"><h4>Baki cuti ${todayK().slice(0, 4)}</h4><div class="tiles" style="margin-top:8px">${b.map(x => tile(x, cls[x.k])).join("")}</div>
        ${!S.hr.join_date ? `<p class="note" style="margin-top:6px">Tarikh mula kerja belum diisi oleh Owner, jadi kelayakan dikira sebagai kurang 2 tahun.</p>` : ""}</div>
      <form class="sec" id="f-leave"><h4>Mohon cuti</h4><div class="mini" style="border:0;margin-top:4px;padding-top:0">
        <div><label>Jenis cuti</label><select class="field" name="kind">${Object.entries(LEAVE).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div>
        <div><label>Dari</label><input class="field" type="date" name="date_from" value="${todayK()}" required></div>
        <div><label>Hingga</label><input class="field" type="date" name="date_to" value="${todayK()}" required></div>
        <div><label>Hari</label><input class="field" type="number" name="days" min="0.5" step="0.5" value="1" required></div>
        <div class="full"><label class="cb"><input type="checkbox" name="half"> Separuh hari</label></div>
        <div class="full"><label>Sebab</label><input class="field" name="reason" required placeholder="cth: urusan keluarga"></div>
        <div class="full"><label>Lampiran (slip MC / dokumen, pilihan)</label><input class="field" type="file" name="file" accept="image/*,application/pdf"></div>
        <div class="full" id="lvwarn"></div><div class="full"><button class="btn pri" type="submit">Hantar permohonan</button></div></div></form>
      <div class="sec"><h4>Permohonan saya</h4><div class="list2">${(globalThis.adaPg?globalThis.adaPg.rows("me-leave",S.leaves,render):S.leaves).map(l => `<div class="it"><div class="row"><b class="grow">${LEAVE[l.kind]} · ${+l.days} hari</b>${chip(l.status)}</div>
        <div class="note">${dmy(l.date_from)}${l.date_to !== l.date_from ? " – " + dmy(l.date_to) : ""}${l.reason ? " · " + esc(l.reason) : ""}${fileLink(l.attachment_path)}${l.review_note ? `<br>Nota Owner: ${esc(l.review_note)}` : ""}</div>
        ${l.status === "pending" ? `<div class="row" style="margin-top:6px"><button class="btn sm bad" data-cancel="staff_leaves:${l.id}">Batal permohonan</button></div>` : ""}</div>`).join("") || `<p class="note">Belum ada permohonan cuti.</p>`}</div>${(globalThis.adaPg?globalThis.adaPg.nav("me-leave",S.leaves.length):"")}</div>`;
  }

  function vGaji() {
    const opts = []; for (let i = 0; i < 12; i++) opts.push(addM(ymNow(), -i));
    return `<div class="sec"><div class="row"><h4 class="grow">Slip gaji</h4><select class="field" id="month" style="max-width:200px">${opts.map(m => `<option value="${m}" ${m === S.month ? "selected" : ""}>${esc(monthName(m))}</option>`).join("")}</select>
      ${S.slip ? `<button class="btn sm pri" data-act="print">⎙ PDF</button>` : ""}</div>
      <div style="margin-top:10px">${S.slipBusy ? `<p class="note">Mengira…</p>` : S.slipErr ? `<p class="msg err">${esc(S.slipErr)}</p>` : S.slip ? slipHtml(S.slip) : `<button class="btn" data-act="slip">Kira slip</button>`}</div></div>`;
  }

  function vClaim() {
    const sum = s => S.claims.filter(c => c.status === s).reduce((t, c) => t + +c.amount, 0);
    return `<div class="tiles"><div class="tile t-y"><small>Menunggu</small><b>${rm(sum("pending"))}</b></div><div class="tile t-g"><small>Diluluskan (belum dibayar)</small><b>${rm(sum("approved"))}</b></div><div class="tile t-b"><small>Sudah dibayar</small><b>${rm(sum("paid"))}</b></div></div>
      <form class="sec" id="f-claim"><h4>Hantar tuntutan</h4><div class="mini" style="border:0;margin-top:4px;padding-top:0">
        <div><label>Tarikh</label><input class="field" type="date" name="claim_date" value="${todayK()}" max="${todayK()}" required></div>
        <div><label>Kategori</label><select class="field" name="category">${Object.entries(CLAIM).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div>
        <div><label>Jumlah (RM)</label><input class="field" type="number" name="amount" min="0.01" step="0.01" required></div>
        <div class="full"><label>Butiran</label><input class="field" name="description" required placeholder="cth: Minyak hantar kereta ke Puspakom"></div>
        <div class="full"><label>Resit (gambar / PDF)</label><input class="field" type="file" name="file" accept="image/*,application/pdf"></div>
        <div class="full"><button class="btn pri" type="submit">Hantar tuntutan</button></div></div></form>
      <div class="sec"><h4>Tuntutan saya</h4><div class="list2">${(globalThis.adaPg?globalThis.adaPg.rows("me-claim",S.claims,render):S.claims).map(c => `<div class="it"><div class="row"><b class="grow">${CLAIM[c.category]} · ${rm(c.amount)}</b>${chip(c.status)}</div>
        <div class="note">${dmy(c.claim_date)} · ${esc(c.description)}${fileLink(c.receipt_path)}${c.pay_month && c.status !== "rejected" ? `<br>Dibayar bersama gaji ${esc(monthName(c.pay_month))}` : ""}${c.review_note ? `<br>Nota Owner: ${esc(c.review_note)}` : ""}</div>
        ${c.status === "pending" ? `<div class="row" style="margin-top:6px"><button class="btn sm bad" data-cancel="staff_claims:${c.id}">Batal</button></div>` : ""}</div>`).join("") || `<p class="note">Belum ada tuntutan.</p>`}</div>${(globalThis.adaPg?globalThis.adaPg.nav("me-claim",S.claims.length):"")}</div>`;
  }

  function vAdv() {
    const cur = ymNow();
    return `<form class="sec" id="f-adv"><h4>Mohon advance gaji</h4><p class="note">Owner akan semak. Selepas diluluskan, potongan dibuat automatik dari gaji bulanan.</p><div class="mini" style="border:0;padding-top:0">
        <div><label>Jumlah (RM)</label><input class="field" type="number" name="amount" min="1" step="0.01" required></div>
        <div><label>Bilangan bulan</label><input class="field" type="number" name="months" min="1" max="36" value="1" required></div>
        <div><label>Mula potong</label><input class="field" type="month" name="start_month" value="${addM(cur, 1)}" min="${cur}" required></div>
        <div><label>Potongan sebulan</label><input class="field" name="monthly" readonly placeholder="auto"></div>
        <div class="full"><label>Sebab</label><input class="field" name="note" required placeholder="cth: kecemasan keluarga"></div>
        <div class="full"><button class="btn pri" type="submit">Hantar permohonan</button></div></div></form>
      <div class="sec"><h4>Advance saya</h4><div class="list2">${S.adv.map(a => { const done = Math.max(0, Math.min(a.months, mIdx(a.start_month, cur) + 1));
        return `<div class="it"><div class="row"><b class="grow">${rm(a.amount)} · ${a.months} × ${rm(a.monthly)}</b>${chip(a.status)}</div><div class="note">${esc(monthName(a.start_month))} – ${esc(monthName(addM(a.start_month, a.months - 1)))}${a.note ? " · " + esc(a.note) : ""}${a.review_note ? `<br>Nota Owner: ${esc(a.review_note)}` : ""}</div>
        ${a.status === "active" ? `<div class="bar"><i style="width:${Math.round(done / a.months * 100)}%"></i></div><div class="note">${done}/${a.months} bulan dipotong</div>` : ""}
        ${a.status === "requested" ? `<div class="row" style="margin-top:6px"><button class="btn sm bad" data-cancel="staff_advances:${a.id}">Batal</button></div>` : ""}</div>`; }).join("") || `<p class="note">Tiada advance.</p>`}</div></div>`;
  }

  function vInfo() {
    const h = S.hr, mask = v => v ? String(v).replace(/.(?=.{4})/g, "•") : "-";
    const kv = rows => `<div class="kv">${rows.map(([a, b]) => `<div><span>${a}</span><span>${esc(b == null || b === "" ? "-" : b)}</span></div>`).join("")}</div>`;
    const ed = S.editInfo;
    const inp = (k, l, t = "text") => `<div class="${t === "area" ? "full" : ""}"><label>${l}</label>${t === "area" ? `<textarea class="field" name="${k}" rows="2">${esc(h[k] || "")}</textarea>` : `<input class="field" name="${k}" type="${t}" value="${esc(h[k] ?? "")}">`}</div>`;
    return `<div class="sec"><div class="row"><h4 class="grow">Hubungan & waris</h4>${ed ? "" : `<button class="btn sm" data-act="edinfo">✎ Kemas kini</button>`}</div>
      ${ed ? `<form class="form" id="f-info" style="border:0;padding:0;background:none">${inp("phone", "Telefon", "tel")}${inp("email_alt", "Emel peribadi", "email")}${inp("address", "Alamat semasa", "area")}${inp("mailing_address", "Alamat surat-menyurat", "area")}
          <div><label>Status perkahwinan</label><select class="field" name="marital"><option value="">-</option>${[["single", "Bujang"], ["married", "Berkahwin"], ["divorced", "Bercerai"], ["widowed", "Balu / Duda"]].map(([k, t]) => `<option value="${k}" ${h.marital === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          ${inp("children", "Bilangan anak", "number")}${inp("dependents", "Bilangan tanggungan", "number")}${inp("emergency_name", "Waris kecemasan")}${inp("emergency_relation", "Hubungan")}${inp("emergency_phone", "Telefon waris", "tel")}${inp("emergency_phone2", "Telefon waris (2)", "tel")}
          <div class="full row"><button class="btn pri" type="submit">Simpan</button><button class="btn" type="button" data-act="noinfo">Batal</button></div></form>`
        : kv([["Telefon", h.phone], ["Emel peribadi", h.email_alt], ["Alamat", h.address], ["Alamat surat", h.mailing_address], ["Status perkahwinan", { single: "Bujang", married: "Berkahwin", divorced: "Bercerai", widowed: "Balu / Duda" }[h.marital]], ["Anak / tanggungan", `${h.children || 0} / ${h.dependents || 0}`], ["Waris kecemasan", h.emergency_name ? `${h.emergency_name}${h.emergency_relation ? " (" + h.emergency_relation + ")" : ""}` : ""], ["Telefon waris", [h.emergency_phone, h.emergency_phone2].filter(Boolean).join(" / ")]])}</div>
      <div class="sec"><h4>Peribadi</h4>${kv([["Nama", me.full_name], ["No. IC", h.ic_no], ["Tarikh lahir", dmy(h.dob)], ["Jantina", { male: "Lelaki", female: "Perempuan" }[h.gender]], ["Agama", h.religion], ["Bangsa", h.race], ["Warganegara", h.citizenship]])}</div>
      <div class="sec"><h4>Pekerjaan</h4>${kv([["Jawatan", h.position], ["Jabatan", h.department], ["Kategori", CATEGORY[h.category]], ["Jenis", EMP_TYPE[h.employment_type]], ["Tarikh mula", dmy(h.join_date)], ["Tarikh pengesahan", dmy(h.confirm_date)], ["Syif", h.shift], ["Lokasi", h.work_location]])}</div>
      <div class="sec"><h4>Bank & statutori</h4>${kv([["Bank", h.bank_name], ["No. akaun", mask(h.bank_account)], ["No. KWSP", h.epf_no], ["No. PERKESO", h.socso_no], ["No. SIP", h.sip_no], ["No. cukai", h.tax_no]])}
        <p class="note" style="margin-top:6px">Maklumat peribadi, pekerjaan dan bank hanya boleh diubah oleh Owner. Hubungi Owner jika ada kesilapan.</p></div>`;
  }

  function render() {
    if (!S.hr) { app.innerHTML = `<div class="empty">Memuatkan…</div>`; return; }
    const v = { home: vHome, cuti: vCuti, gaji: vGaji, claim: vClaim, advance: vAdv, info: vInfo }[S.tab]();
    app.innerHTML = `<div class="pf">${header()}${tabs()}${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ""}<p class="msg ${S.cls}" id="mmsg">${esc(S.msg)}</p>${v}</div>`;
    bind();
  }
  const run = async (btn, fn, ok) => { if (btn) btn.disabled = true; try { say("Sila tunggu…"); await fn(); S.msg = ok; S.cls = "ok"; await load(); } catch (e) { if (btn) btn.disabled = false; say(e?.message || String(e), "err"); } };

  function bind() {
    app.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; S.msg = ""; render(); if (S.tab === "gaji" && !S.slip && !S.slipBusy) loadSlip(); if (b.dataset.new) app.querySelector("form input,form select")?.focus(); });
    app.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === "slip") loadSlip();
      if (a === "edinfo") { S.editInfo = true; render(); }
      if (a === "noinfo") { S.editInfo = false; render(); }
      if (a === "print" && S.slip && !printSlip(S.slip, { name: me.full_name, month: S.month, ic: S.hr.ic_no, code: S.hr.staff_code, position: S.hr.position, bank: [S.hr.bank_name, S.hr.bank_account].filter(Boolean).join(" "), epf: S.hr.epf_no, socso: S.hr.socso_no })) say("Benarkan pop-up untuk cetak.", "err");
    });
    const mo = app.querySelector("#month"); if (mo) mo.onchange = () => { S.month = mo.value; S.slip = null; loadSlip(); };
    app.querySelectorAll("[data-cancel]").forEach(b => b.onclick = () => { const [t, id] = b.dataset.cancel.split(":"); if (!confirm("Batal permohonan ini?")) return;
      run(b, async () => { const { error } = await client.from(t).delete().eq("id", id).eq("staff_id", uid); if (error) throw error; }, "Permohonan dibatalkan."); });

    const fl = app.querySelector("#f-leave");
    if (fl) {
      const calc = () => { const a = fl.date_from.value, b = fl.date_to.value; if (fl.half.checked) { fl.date_to.value = a; fl.days.value = 0.5; } else if (a && b && b >= a) fl.days.value = Math.max(1, workdaysBetween(a, b));
        const bal = balances().find(x => x.k === fl.kind.value), w = app.querySelector("#lvwarn");
        w.innerHTML = bal && bal.rem != null && +fl.days.value > bal.rem ? `<div class="warn">Baki ${LEAVE[bal.k]} hanya ${bal.rem} hari. Permohonan masih boleh dihantar, Owner akan putuskan.</div>` : ""; };
      fl.date_from.onchange = () => { if (fl.date_to.value < fl.date_from.value) fl.date_to.value = fl.date_from.value; calc(); }; fl.date_to.onchange = fl.half.onchange = fl.kind.onchange = calc; calc();
      fl.onsubmit = ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(fl)), file = fl.file.files[0];
        run(fl.querySelector("[type=submit]"), async () => {
          if (d.date_to < d.date_from) throw new Error("Tarikh hingga sebelum tarikh dari.");
          const row = { staff_id: uid, kind: d.kind, date_from: d.date_from, date_to: d.date_to, days: +d.days, reason: String(d.reason).trim(), status: "pending" };
          if (file) row.attachment_path = await upload(file, "cuti");
          const { error } = await client.from("staff_leaves").insert(row); if (error) throw error;
        }, "Permohonan cuti dihantar. Tunggu kelulusan Owner."); };
    }
    const fc = app.querySelector("#f-claim");
    if (fc) fc.onsubmit = ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(fc)), file = fc.file.files[0];
      run(fc.querySelector("[type=submit]"), async () => {
        const row = { staff_id: uid, claim_date: d.claim_date, category: d.category, amount: +d.amount, description: String(d.description).trim(), status: "pending" };
        if (!(row.amount > 0)) throw new Error("Masukkan jumlah.");
        if (file) row.receipt_path = await upload(file, "resit");
        const { error } = await client.from("staff_claims").insert(row); if (error) throw error;
      }, "Tuntutan dihantar. Tunggu kelulusan Owner."); };
    const fa = app.querySelector("#f-adv");
    if (fa) { const c = () => { const a = +fa.amount.value, m = +fa.months.value; fa.monthly.value = a > 0 && m > 0 ? rm(a / m) : ""; }; fa.amount.oninput = fa.months.oninput = c;
      fa.onsubmit = ev => { ev.preventDefault(); const a = +fa.amount.value, m = +fa.months.value;
        run(fa.querySelector("[type=submit]"), async () => {
          const { error } = await client.from("staff_advances").insert({ staff_id: uid, amount: a, months: m, start_month: fa.start_month.value, monthly: +(a / m).toFixed(2), note: fa.note.value.trim(), status: "requested", created_by: uid }); if (error) throw error;
        }, "Permohonan advance dihantar."); }; }
    const fi = app.querySelector("#f-info");
    if (fi) fi.onsubmit = ev => { ev.preventDefault(); const p = Object.fromEntries(new FormData(fi));
      run(fi.querySelector("[type=submit]"), async () => { const { error } = await client.rpc("staff_update_self", { p }); if (error) throw error; S.editInfo = false; }, "Maklumat dikemas kini."); };
  }

  render(); load();
  window.__adaLive?.(host, ["staff_leaves","staff_claims","staff_advances","staff_hr","staff_pay"], load, () => !!S.editInfo);
}
