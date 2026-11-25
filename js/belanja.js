// Abe Din Auto – Perbelanjaan (V91): snap resit -> AI baca -> semak -> sahkan -> failkan automatik.
// Data & kebenaran: V91_PERBELANJAAN.sql. AI: Edge Function "scan-receipt".
// Semua staff aktif boleh snap (draf, nampak resit sendiri sahaja). Owner nampak semua, sahkan/tolak, laporan & eksport.
// Gambar disimpan dalam bucket peribadi staff-docs: <uid>/resit/<YYYY-MM>/<masa>.jpg
import { CSS } from "./staff.js?v=17";

// [label, jenis]. Jenis: inventori = kos melekat pada kereta stok; pembelian = belanja operasi harian; overhead = bil tetap setiap bulan.
export const CATS = {
  baiki: ["Baiki / Bengkel", "inventori"], alat_ganti: ["Alat Ganti", "inventori"], tayar_bateri: ["Tayar & Bateri", "inventori"],
  cat_body: ["Cat & Body", "inventori"], cuci_polish: ["Cuci & Polish", "inventori"], jpj_puspakom: ["JPJ / Puspakom / Roadtax", "inventori"],
  insurans: ["Insurans Kereta", "inventori"], transport_kereta: ["Transport / Tunda Kereta", "inventori"],
  sewa_premis: ["Sewa Premis", "overhead"], utiliti: ["Elektrik & Air", "overhead"], telefon_internet: ["Telefon & Internet", "overhead"],
  langganan: ["Langganan (Mudah, Carlist, sistem)", "overhead"], bank_caj: ["Caj Bank", "overhead"],
  minyak: ["Minyak", "pembelian"], tol_parking: ["Tol & Parking", "pembelian"], alat_tulis: ["Alat Tulis / Pejabat", "pembelian"],
  makan_entertain: ["Makan / Entertain", "pembelian"], iklan: ["Iklan Online (FB/TikTok)", "pembelian"], marketing_lain: ["Pemasaran Lain", "pembelian"],
  armada_sewa: ["Armada Sewa", "pembelian"], lain: ["Lain-lain", "pembelian"],
};
export const JENIS = { inventori: "Inventori (Kos Kereta)", pembelian: "Pembelian / Operasi", overhead: "Overhead Tetap Bulanan" };
const JENIS_ICO = { inventori: "🚗", pembelian: "🛒", overhead: "🏢" };
const JENIS_HINT = { inventori: "Kos yang ditambah pada kereta stok — pilih kereta supaya untung per unit tepat.", pembelian: "Belanja operasi harian yang tidak tetap.", overhead: "Bil tetap yang dibayar setiap bulan." };
const catJenis = k => (CATS[k] || CATS.lain)[1];
const UNIT = { jualan: "Jualan Kereta", sewa: "Kereta Sewa", umum: "Operasi Umum" };
const PAY = { tunai: "Tunai", transfer: "Transfer", kad: "Kad", ewallet: "e-Wallet", cek: "Cek", lain: "Lain" };
const ST = { draf: ["Belum disemak", "c-role"], disahkan: ["Disahkan", "c-on"], ditolak: ["Ditolak", "c-warn"] };

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const KL = 8 * 3600000;
const todayK = () => new Date(Date.now() + KL).toISOString().slice(0, 10);
const ymNow = () => todayK().slice(0, 7);
const rm = n => "RM" + Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dtm = s => { if (!s) return ""; const d = new Date(s); if (isNaN(d)) return ""; const o = { timeZone: "Asia/Kuala_Lumpur" }; return d.toLocaleDateString("en-GB", { ...o, day: "2-digit", month: "2-digit", year: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { ...o, hour: "numeric", minute: "2-digit", hour12: true }); };
const dmy = s => { if (!s) return "-"; const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
const MONTHS = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
const monthName = ym => { const [y, m] = ym.split("-"); return `${MONTHS[+m - 1]} ${y}`; };
const addM = (m, n) => { const [y, mo] = m.split("-").map(Number), t = y * 12 + mo - 1 + n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const normPlate = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const slug = s => String(s || "").normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "resit";
const catLabel = k => (CATS[k] || CATS.lain)[0];

const EXTRA_CSS = `.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.tabs button{white-space:nowrap;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer;color:var(--fg)}
.tabs button.on{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}.badge{background:#e0473f;color:#fff;border-radius:99px;font-size:11px;padding:1px 6px;margin-left:4px}
.snap{display:flex;flex-direction:column;align-items:center;gap:10px;border:2px dashed #5a4a14;border-radius:16px;padding:22px 14px;background:var(--card);text-align:center}
.snap .big{font-size:42px;line-height:1}.snap .btn{min-width:220px;padding:13px 16px;font-size:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px}
.rc{display:flex;gap:10px;align-items:flex-start}.rc img,.rc .ph{width:64px;height:84px;object-fit:cover;border-radius:8px;background:var(--soft);flex:0 0 64px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px}
.rc .grow{min-width:0}.rc b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rc small{color:var(--mute);font-size:12.5px;display:block}
.amt{font-weight:800;font-size:16px;white-space:nowrap}.warn{background:#3a1513;color:#ffaaa4;border-radius:10px;padding:8px 10px;font-size:13px}
.info{background:#12263a;color:#8cc4ff;border-radius:10px;padding:8px 10px;font-size:13px}
.edit{display:grid;grid-template-columns:1fr 1fr;gap:10px}.edit .full{grid-column:1/-1}@media(max-width:560px){.edit{grid-template-columns:1fr}}
.prev{width:100%;max-height:360px;object-fit:contain;border-radius:10px;background:#000;cursor:zoom-in}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px}.stat small{color:var(--mute);font-size:12px;display:block}.stat b{font-size:18px}
.bar{height:8px;border-radius:9px;background:#2c2a25;overflow:hidden;margin-top:4px}.bar i{display:block;height:100%;background:var(--pri)}
.tbl{width:100%;border-collapse:collapse;font-size:13.5px}.tbl td,.tbl th{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left}.tbl td.r,.tbl th.r{text-align:right}
.jn{display:flex;gap:6px;flex-wrap:wrap}.jn button{flex:1;min-width:110px;border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:9px 8px;font-weight:700;font-size:13px;cursor:pointer;color:var(--fg);text-align:center}.jn button.on{background:#3a2f0a;border-color:var(--pri);color:#ffd257}.jn button small{display:block;font-weight:600;color:var(--mute);font-size:12px;margin-top:2px}.jn button:disabled{opacity:.6}
.atbl{font-size:13px;white-space:nowrap}.atbl th,.atbl td{padding:7px 8px}.atbl .stk{position:sticky;left:0;background:var(--card);z-index:1;min-width:150px}.atbl tr.grp td{background:#211d14}.atbl tr.grp .stk{background:#211d14}.atbl tr.tot td{border-top:2px solid var(--line)}
.lnk{background:none;border:0;color:var(--fg);padding:0;font:inherit;cursor:pointer;text-align:left;text-decoration:underline dotted #9a958a;text-underline-offset:3px}
.filters{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.zoom{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;padding:10px}.zoom img{max-width:100%;max-height:100%;object-fit:contain}
.spin{display:inline-block;width:16px;height:16px;border:2px solid var(--mute);border-top-color:var(--pri);border-radius:50%;animation:sp 1s linear infinite;vertical-align:-3px;margin-right:6px}@keyframes sp{to{transform:rotate(360deg)}}`;

async function toJpeg(file, max = 2000) {
  const img = await createImageBitmap(file).catch(() => null);
  if (!img) return file;
  const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(b => r(b ? new File([b], "resit.jpg", { type: "image/jpeg" }) : file), "image/jpeg", .85));
}
const b64 = blob => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(",")[1]); f.onerror = rej; f.readAsDataURL(blob); });

export function mountBelanja(host, ctx) {
  const client = ctx.client, me = ctx.profile || {}, uid = me.id, owner = me.role === "owner";
  const vehicles = ctx.vehicles || [];
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}${EXTRA_CSS}</style><section class="shell" id="app"></section>`;
  const app = root.getElementById("app");
  const TABS = owner ? [["snap", "📷 Snap Resit"], ["list", "Senarai"], ["ana", "📊 Analisa"], ["report", "Laporan"], ["export", "Eksport"], ["ai", "Tetapan AI"]] : [["snap", "📷 Snap Resit"], ["list", "Resit Saya"]];
  const S = { dups: {}, tab: "snap", rows: [], names: {}, urls: {}, err: "", msg: "", cls: "", queue: [], editId: null, ai: null,
    f: { month: "recent", rmonth: ymNow(), cat: "", status: "", q: "", unit: "", jenis: "" }, prev: [], payMonth: ymNow(), busy: false, insp: {} };

  const say = (t, c) => { S.msg = t; S.cls = c || ""; const m = app.querySelector("#bmsg"); if (m) { m.textContent = t; m.className = "msg " + (c || ""); } };
  const vName = id => { const v = vehicles.find(x => x.id === id); return v ? `${v.make || ""} ${v.model || ""} · ${v.plate || "-"}`.trim() : ""; };
  const matchPlate = p => { const n = normPlate(p); if (n.length < 3) return null; return vehicles.find(v => normPlate(v.plate) === n) || null; };

  const RECENT_DAYS = 30;
  const cutoff = () => new Date(Date.now() - RECENT_DAYS * 864e5).toISOString().slice(0, 10);
  const range = m => `and(receipt_date.gte.${m}-01,receipt_date.lt.${addM(m, 1)}-01)`;
  // Senarai: "recent" = semua resit yang DIMASUKKAN 30 hari lepas (apa pun tarikh pada resit), atau ikut bulan tarikh resit.
  const inList = x => S.f.month === "all" || (S.f.month === "recent" ? (String(x.created_at).slice(0, 10) >= cutoff() || x.status === "draf") : String(x.receipt_date).startsWith(S.f.month));
  const inReport = x => S.f.rmonth === "all" || String(x.receipt_date).startsWith(S.f.rmonth);

  async function load() {
    let q = client.from("expenses").select("*").order("created_at", { ascending: false }).limit(3000);
    if (S.f.month !== "all" && S.f.rmonth !== "all") {
      const c = [`created_at.gte.${cutoff()}`, "status.eq.draf", range(S.f.rmonth)];
      if (S.f.month !== "recent") c.push(range(S.f.month));
      q = q.or(c.join(","));
    }
    const r = await q;
    if (r.error) { S.err = /does not exist|schema cache/i.test(r.error.message) ? "Pangkalan data Perbelanjaan belum dipasang (V91)." : r.error.message; S.rows = []; }
    else { S.err = ""; S.rows = r.data || []; localDups(); }
    if (owner) {
      const ids = [...new Set(S.rows.map(x => x.created_by).filter(id => id && !S.names[id]))];
      if (ids.length) { const p = await client.from("profiles").select("id,full_name").in("id", ids); (p.data || []).forEach(x => S.names[x.id] = x.full_name); }
      if (!S.ai) { const a = await client.rpc("ai_config_status"); S.ai = a.data || { has_key: false }; }
      // Overhead 3 bulan sebelum -> senarai bil tetap yang dijangka setiap bulan
      const m0 = S.f.rmonth === "all" ? ymNow() : S.f.rmonth;
      const pv = await client.from("expenses").select("id,category,vendor,amount,receipt_date").eq("jenis", "overhead").eq("status", "disahkan")
        .gte("receipt_date", `${addM(m0, -3)}-01`).lt("receipt_date", `${m0}-01`).order("receipt_date", { ascending: false });
      S.prev = pv.data || [];
    }
    await sign(S.rows.map(x => x.image_path));
    render();
  }
  async function sign(paths) {
    paths = [...new Set(paths.filter(p => p && !S.urls[p]))];
    for (let i = 0; i < paths.length; i += 100) {
      const { data } = await client.storage.from("staff-docs").createSignedUrls(paths.slice(i, i + 100), 3600);
      (data || []).forEach(d => { if (d.signedUrl) S.urls[d.path] = d.signedUrl; });
    }
  }

  // ---------- Snap & AI ----------
  async function handleFiles(files) {
    files = [...files]; if (!files.length) return;
    for (const f of files) S.queue.push({ id: Math.random().toString(36).slice(2), name: f.name, state: "Memproses…", file: f });
    render();
    for (const job of S.queue.filter(j => j.file)) {
      const f = job.file; job.file = null;
      try {
        const isPdf = f.type === "application/pdf";
        const blob = isPdf ? f : await toJpeg(f);
        if (blob.size > 5242880) throw new Error("Fail melebihi 5MB.");
        job.state = "Memuat naik…"; render();
        const path = `${uid}/resit/${ymNow()}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${isPdf ? "pdf" : "jpg"}`;
        const up = await client.storage.from("staff-docs").upload(path, blob, { contentType: isPdf ? "application/pdf" : "image/jpeg" });
        if (up.error) throw up.error;
        let d = {}, aiNote = "";
        if (!isPdf) {
          job.state = "AI sedang baca resit…"; render();
          try {
            const res = await client.functions.invoke("scan-receipt", { body: { image: await b64(blob), mime: "image/jpeg" } });
            if (res.error) { let m = res.error.message; try { const j = await res.error.context?.json?.(); if (j?.error) m = j.error; } catch (_) {} throw new Error(m); }
            d = res.data?.data || {};
            if (d.is_receipt === false) aiNote = "AI: gambar ini mungkin bukan resit.";
          } catch (e) { aiNote = "AI tidak dapat baca: " + (e?.message || e) + " — sila isi sendiri."; }
        } else aiNote = "PDF — sila isi maklumat sendiri.";
        const v = matchPlate(d.plate);
        if (d.receipt_date && d.receipt_date > todayK()) { const [yy, mm, dd] = d.receipt_date.split("-"); const sw = `${yy}-${dd}-${mm}`; if (+dd <= 12 && sw <= todayK()) d.receipt_date = sw; }
        const row = {
          receipt_date: d.receipt_date || todayK(), vendor: d.vendor || null, receipt_no: d.receipt_no || null,
          amount: Math.max(0, Number(d.amount) || 0), tax_amount: Math.max(0, Number(d.tax_amount) || 0),
          category: CATS[d.category] ? d.category : "lain", jenis: catJenis(CATS[d.category] ? d.category : "lain"), unit: UNIT[d.unit] ? d.unit : (v ? "jualan" : "umum"),
          vehicle_id: v?.id || null, payment_method: PAY[d.payment_method] ? d.payment_method : "tunai",
          paid_by: "syarikat", items: Array.isArray(d.items) ? d.items.slice(0, 60) : [], notes: d.summary || null,
          image_path: path, ai_raw: Object.keys(d).length ? d : null, status: "draf", created_by: uid,
        };
        const ins = await client.from("expenses").insert(row).select().single();
        if (ins.error) throw ins.error;
        S.rows.unshift(ins.data); await sign([path]);
        const dd = await checkDup(ins.data), di = dateIssue(ins.data);
        job.state = "done"; job.expId = ins.data.id; job.note = [aiNote, dd.length ? "⚠️ Mungkin resit berganda" : "", di ? "⚠️ " + di : ""].filter(Boolean).join(" · ");
        if (!S.editId) S.editId = ins.data.id;
      } catch (e) { job.state = "Gagal: " + (e?.message || e); }
      render();
    }
  }

  // Semakan berganda terus dari pangkalan data (semua bulan, semua staff yang boleh dilihat)
  const sameVendor = (a, b) => !a || !b || normPlate(a).slice(0, 6) === normPlate(b).slice(0, 6);
  function dupOf(x) { return (S.dups[x.id] || []).filter(o => S.rows.find(r => r.id === o.id)?.status !== "ditolak"); }
  async function checkDup(x) {
    if (!x || !(+x.amount > 0)) { S.dups[x?.id] = []; return []; }
    let q = client.from("expenses").select("id,vendor,receipt_date,amount,status,receipt_no").neq("id", x.id).neq("status", "ditolak").eq("amount", x.amount).limit(20);
    const { data } = await q;
    const d = (data || []).filter(o => (x.receipt_no && o.receipt_no && normPlate(o.receipt_no) === normPlate(x.receipt_no)) || (o.receipt_date === x.receipt_date && sameVendor(o.vendor, x.vendor)));
    S.dups[x.id] = d; return d;
  }
  function localDups() {
    const live = S.rows.filter(x => x.status !== "ditolak" && +x.amount > 0);
    for (const x of live) S.dups[x.id] = live.filter(o => o.id !== x.id && +o.amount === +x.amount &&
      ((x.receipt_no && o.receipt_no && normPlate(o.receipt_no) === normPlate(x.receipt_no)) || (o.receipt_date === x.receipt_date && sameVendor(o.vendor, x.vendor))));
  }
  // Tarikh pelik: masa hadapan, atau jauh lebih lama daripada tarikh resit dimasukkan
  function dateIssue(x) {
    const d = String(x.receipt_date || ""), made = String(x.created_at || todayK()).slice(0, 10);
    if (d > todayK()) return "Tarikh resit di masa hadapan — sila betulkan";
    if (Date.parse(made) - Date.parse(d) > 120 * 864e5) return "Tarikh resit lebih 4 bulan sebelum dimasukkan — sila semak tahun/bulan";
    return "";
  }

  const catOptions = (jn, cur) => Object.entries(CATS).filter(([, c]) => c[1] === jn).map(([k, c]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${c[0]}</option>`).join("");

  // ---------- Render ----------
  function render() {
    const drafts = S.rows.filter(x => x.status === "draf").length;
    app.innerHTML = `<div class="row"><div class="grow"><div class="kick">PERBELANJAAN</div><h3>Resit & Perbelanjaan</h3></div></div>
      <div class="tabs">${TABS.map(([k, t]) => `<button data-tab="${k}" class="${S.tab === k ? "on" : ""}">${t}${k === "list" && drafts ? `<span class="badge">${drafts}</span>` : ""}</button>`).join("")}</div>
      ${S.err ? `<div class="warn">${esc(S.err)}</div>` : ""}
      <div id="bmsg" class="msg ${S.cls}">${esc(S.msg)}</div>
      ${S.editId ? editor(S.rows.find(x => x.id === S.editId)) : ""}
      ${S.tab === "snap" ? snapView() : S.tab === "list" ? listView() : S.tab === "ana" ? anaView() : S.tab === "report" ? reportView() : S.tab === "export" ? exportView() : aiView()}`;
  }

  function snapView() {
    const aiWarn = owner && S.ai && !S.ai.has_key ? `<div class="warn">AI belum disambung — resit masih boleh disimpan tetapi perlu diisi sendiri. Pergi ke tab <b>Tetapan AI</b>.</div>` : "";
    return `${aiWarn}<div class="snap"><div class="big">🧾</div><b>Snap resit, sistem rekod sendiri</b>
      <p class="mute">Ambil gambar resit dengan jelas, rata dan cukup cahaya. Boleh pilih banyak resit sekali gus.</p>
      <label class="btn pri" style="text-transform:none;letter-spacing:0;font-size:16px;color:var(--pri-fg)">📷 Snap Resit<input id="cam" type="file" accept="image/*" capture="environment" hidden></label>
      <label class="btn" style="text-transform:none;letter-spacing:0;font-size:15px;color:var(--fg)">🖼 Pilih dari galeri / PDF<input id="gal" type="file" accept="image/*,application/pdf" multiple hidden></label></div>
      ${S.queue.length ? `<div class="list">${S.queue.slice().reverse().map(j => `<div class="card row"><div class="grow"><b>${esc(j.name || "Resit")}</b><small class="mute">${j.state === "done" ? "✅ Disimpan — tunggu semakan" + (j.note ? " · " + esc(j.note) : "") : (/^Gagal/.test(j.state) ? "❌ " : '<span class="spin"></span>') + esc(j.state)}</small></div>${j.expId ? `<button class="btn sm" data-edit="${j.expId}">Semak</button>` : ""}</div>`).join("")}</div>` : ""}
      ${recent()}`;
  }
  function recent() {
    const mine = S.rows.filter(x => x.created_by === uid).slice(0, 5);
    return mine.length ? `<div><div class="kick" style="margin:6px 0">TERKINI</div><div class="list">${mine.map(card).join("")}</div></div>` : "";
  }
  function card(x) {
    const u = S.urls[x.image_path], pdf = /\.pdf$/i.test(x.image_path || "");
    return `<div class="card rc">${u && !pdf ? `<img src="${esc(u)}" data-zoom="${esc(u)}" alt="resit" loading="lazy">` : `<a class="ph" ${u ? `href="${esc(u)}" target="_blank"` : ""}>${pdf ? "📄" : "🧾"}</a>`}
      <div class="grow"><b>${esc(x.vendor || "(tiada nama kedai)")}</b>
      <small>${JENIS_ICO[x.jenis] || ""} ${dmy(x.receipt_date)} · ${esc(catLabel(x.category))}${x.vehicle_id ? " · 🚗 " + esc(vName(x.vehicle_id)) : ""}</small>
      <small>${ST[x.status] ? `<span class="chip ${ST[x.status][1]}">${ST[x.status][0]}</span>` : ""}${x.paid_by === "staf" ? '<span class="chip c-blue">Tuntutan staff</span>' : ""}${owner && S.names[x.created_by] ? esc(S.names[x.created_by]) : ""}</small>
      <small class="tm">🕒 Dimasukkan ${esc(dtm(x.created_at))}${x.verified_at ? ` · ✅ Disahkan ${esc(dtm(x.verified_at))}` : ""}</small>
      ${dateIssue(x) ? `<small style="color:#ffaaa4">⚠️ ${esc(dateIssue(x))}</small>` : ""}${S.dups[x.id]?.length ? `<small style="color:#ffaaa4">⚠️ Mungkin berganda</small>` : ""}
      ${x.status === "ditolak" && x.review_note ? `<small style="color:#ffaaa4">Sebab: ${esc(x.review_note)}</small>` : ""}</div>
      <div style="text-align:right"><div class="amt">${rm(x.amount)}</div>${(owner || x.status === "draf") ? `<button class="btn sm" data-edit="${x.id}" style="margin-top:6px">${x.status === "draf" ? "Semak" : "Buka"}</button>` : ""}</div></div>`;
  }

  // V124: pautan resit → barang dalam Pemeriksaan (kos kereta sama)
  function inspOpts(x) {
    const I = S.insp[x.vehicle_id], cur = x.insp_mode === "part" || (x.inspection_part_id && !String(x.inspection_part_id).startsWith("exp-")) ? "part:" + x.inspection_part_id : (x.insp_mode || "auto");
    const used = new Set(S.rows.filter(r => r.id !== x.id && r.status !== "ditolak" && r.inspection_part_id).map(r => r.inspection_part_id));
    const parts = (I?.parts || []).filter(p => p.id && !String(p.id).startsWith("exp-") && (!used.has(p.id) || "part:" + p.id === cur));
    const tot = p => (+p.qty || 1) * (+p.harga || 0) + (+p.upah || 0);
    return `<option value="auto" ${cur === "auto" || cur === "new" ? "selected" : ""}>➕ Tambah sebagai barang baru dalam Pemeriksaan</option>`
      + (parts.length ? `<optgroup label="Atau ganti barang sedia ada (barang yang sama sahaja)">${parts.map(p => `<option value="part:${esc(p.id)}" ${cur === "part:" + p.id ? "selected" : ""}>${esc(p.nama || "Barang")} — anggaran ${rm(tot(p))}</option>`).join("")}</optgroup>` : "")
      + `<option value="none" ${cur === "none" ? "selected" : ""}>🚫 Jangan masukkan ke Pemeriksaan</option>`;
  }
  function inspHint(x) {
    if (!x.vehicle_id) return "";
    const I = S.insp[x.vehicle_id];
    if (I === undefined) return "Memuatkan senarai barang pemeriksaan…";
    const p = x.inspection_id && I && x.inspection_part_id ? (I.parts || []).find(q => q.id === x.inspection_part_id) : null;
    if (p) return `✅ Sudah dimasukkan ke Pemeriksaan: <b>${esc(p.nama || "")}</b> = ${rm((+p.qty || 1) * (+p.harga || 0) + (+p.upah || 0))}. Kos pemeriksaan kereta: ${rm(I.kos)}.`;
    return I ? `Kos pemeriksaan sekarang: ${rm(I.kos)}. Selepas simpan, resit ini ditambah sebagai barang baru. Pilih barang sedia ada hanya jika resit ini untuk barang yang sama — harganya akan ditukar kepada jumlah resit.` : "Kereta ini belum ada rekod pemeriksaan — rekod baru akan dicipta automatik.";
  }
  async function loadInsp(vid, force) {
    if (!vid || (!force && S.insp[vid] !== undefined)) return;
    const r = await client.from("checklist_inspections").select("id,kos,status,data,updated_at").eq("vehicle_id", vid).order("updated_at", { ascending: false }).limit(50);
    const rows = r.data || [], c = rows.find(x => x.status === "lulus") || rows[0];
    S.insp[vid] = c ? { id: c.id, kos: +c.kos || 0, parts: c.data?.parts || [] } : null;
    const f = app.querySelector("#ed"), x = S.rows.find(q => q.id === S.editId);
    if (f && x && f.elements.vehicle_id?.value === vid) { const sel = f.elements.insp_link, v = sel?.value; const tmp = { ...x, vehicle_id: vid }; if (sel) { sel.innerHTML = inspOpts(tmp); if ([...sel.options].some(o => o.value === v)) sel.value = v; } const h = app.querySelector("#insphint"); if (h) h.innerHTML = inspHint(tmp); }
  }
  function editor(x) {
    if (x?.vehicle_id && S.insp[x.vehicle_id] === undefined) setTimeout(() => loadInsp(x.vehicle_id), 0);
    if (!x) return "";
    const lock = x.status !== "draf" && !owner, u = S.urls[x.image_path], pdf = /\.pdf$/i.test(x.image_path || "");
    const dups = dupOf(x), dis = lock ? "disabled" : "";
    const opt = (o, v) => Object.entries(o).map(([k, t]) => `<option value="${k}" ${k === v ? "selected" : ""}>${esc(Array.isArray(t) ? t[0] : t)}</option>`).join("");
    const jn = JENIS[x.jenis] ? x.jenis : catJenis(x.category);
    const catOpts = catOptions(jn, x.category);
    const vOpts = `<option value="">— Tiada / bukan kos kereta —</option>` + vehicles.slice().sort((a, b) => String(a.plate).localeCompare(String(b.plate))).map(v => `<option value="${v.id}" ${v.id === x.vehicle_id ? "selected" : ""}>${esc(v.plate || "-")} · ${esc(v.make || "")} ${esc(v.model || "")}${v.status === "sold" ? " (sold)" : ""}</option>`).join("");
    const items = Array.isArray(x.items) ? x.items : [];
    return `<form id="ed" class="card" style="border-color:#5a4a14;display:flex;flex-direction:column;gap:10px">
      <div class="row"><b class="grow">${x.status === "draf" ? "Semak resit" : "Butiran resit"}</b>${ST[x.status] ? `<span class="chip ${ST[x.status][1]}">${ST[x.status][0]}</span>` : ""}<button type="button" class="btn sm" data-close>✕</button></div>
      ${u ? (pdf ? `<a class="btn" href="${esc(u)}" target="_blank">📄 Buka PDF resit</a>` : `<img class="prev" src="${esc(u)}" data-zoom="${esc(u)}" alt="resit">`) : ""}
      ${dateIssue(x) ? `<div class="warn">📅 ${esc(dateIssue(x))}. AI baca: ${dmy(x.receipt_date)}.</div>` : ""}
      ${dups.length ? `<div class="warn">⚠️ Mungkin resit berganda: ${dups.map(d => `${esc(d.vendor || "-")} ${dmy(d.receipt_date)} ${rm(d.amount)} (${ST[d.status]?.[0] || d.status})`).join("; ")}</div>` : ""}
      ${x.ai_raw && x.status === "draf" ? `<div class="info">🤖 Diisi oleh AI${x.ai_raw.confidence != null ? ` (keyakinan ${Math.round(x.ai_raw.confidence * 100)}%)` : ""}. Sila semak jumlah & tarikh.</div>` : ""}
      <div class="edit">
        <div class="full"><label>Kedai / Pembekal</label><input class="field" name="vendor" value="${esc(x.vendor || "")}" ${dis}></div>
        <div><label>Tarikh resit</label><input class="field" type="date" name="receipt_date" value="${esc(x.receipt_date)}" ${dis} required></div>
        <div><label>Jumlah (RM)</label><input class="field" type="number" step="0.01" min="0" inputmode="decimal" name="amount" value="${esc(x.amount)}" ${dis} required></div>
        <div class="full"><label>Jenis perbelanjaan</label><div class="jn">${Object.entries(JENIS).map(([k, t]) => `<button type="button" class="${k === jn ? "on" : ""}" data-jenis="${k}" ${dis}>${JENIS_ICO[k]} ${t}</button>`).join("")}</div><input type="hidden" name="jenis" value="${jn}"><small class="mute" id="jnhint">${JENIS_HINT[jn]}</small></div>
        <div><label>Kategori</label><select class="field" name="category" ${dis}>${catOpts}</select></div>
        <div><label>Bahagian</label><select class="field" name="unit" ${dis}>${opt(UNIT, x.unit)}</select></div>
        <div class="full"><label>Kereta (untuk kira kos & untung per unit)</label><select class="field" name="vehicle_id" ${dis}>${vOpts}</select></div>
        <div class="full inspbox" ${x.vehicle_id ? "" : "hidden"}><label>🔧 Masuk ke kos Pemeriksaan kereta ini</label><select class="field" name="insp_link" ${dis}>${inspOpts(x)}</select><small class="mute" id="insphint">${inspHint(x)}</small></div>
        <div><label>Cara bayar</label><select class="field" name="payment_method" ${dis}>${opt(PAY, x.payment_method)}</select></div>
        <div><label>Siapa bayar?</label><select class="field" name="paid_by" ${dis}><option value="syarikat" ${x.paid_by === "syarikat" ? "selected" : ""}>Duit syarikat</option><option value="staf" ${x.paid_by === "staf" ? "selected" : ""}>Saya bayar dulu (tuntut)</option></select></div>
        <div><label>No. resit</label><input class="field" name="receipt_no" value="${esc(x.receipt_no || "")}" ${dis}></div>
        <div><label>SST / cukai (RM)</label><input class="field" type="number" step="0.01" min="0" name="tax_amount" value="${esc(x.tax_amount || 0)}" ${dis}></div>
        <div class="full"><label>Catatan</label><input class="field" name="notes" value="${esc(x.notes || "")}" ${dis} placeholder="cth: tukar brake pad Myvi"></div>
      </div>
      ${jn === "inventori" && !x.vehicle_id && x.status === "draf" ? `<div class="warn" id="novh">Kos inventori patut dikaitkan dengan kereta — pilih kereta di atas.</div>` : ""}
      ${items.length ? `<details><summary class="mute" style="cursor:pointer">Senarai item (${items.length})</summary><table class="tbl">${items.map(i => `<tr><td>${esc(i.name)}</td><td class="r">${i.qty ?? ""}</td><td class="r">${i.price != null ? rm(i.price) : ""}</td></tr>`).join("")}</table></details>` : ""}
      ${owner && x.status === "draf" && (x.paid_by === "staf") ? `<div><label>Bulan gaji untuk bayar balik tuntutan</label><input class="field" type="month" id="paym" value="${esc(S.payMonth)}"></div>` : ""}
      ${x.claim_id ? `<div class="info">Tuntutan staff telah dicipta & masuk kiraan gaji.</div>` : ""}
      <div class="row">
        ${!lock ? `<button class="btn ${owner ? "" : "pri"}" type="submit">Simpan</button>` : ""}
        ${owner && x.status === "draf" ? `<button class="btn pri" type="button" data-verify="${x.id}">✓ Simpan & Sahkan</button><button class="btn bad" type="button" data-reject="${x.id}">Tolak</button>` : ""}
        ${owner && x.status !== "draf" && !x.claim_id ? `<button class="btn" type="button" data-reopen="${x.id}">Buka semula</button>` : ""}
        ${(x.status === "draf" || (owner && !x.claim_id)) ? `<button class="btn bad" type="button" data-del="${x.id}">Padam</button>` : ""}
      </div></form>`;
  }

  function filtered() {
    const q = S.f.q.trim().toLowerCase();
    return S.rows.filter(x => inList(x) && (!S.f.jenis || x.jenis === S.f.jenis) && (!S.f.cat || x.category === S.f.cat) && (!S.f.status || x.status === S.f.status) && (!S.f.unit || x.unit === S.f.unit) &&
      (!q || [x.vendor, x.receipt_no, x.notes, vName(x.vehicle_id), S.names[x.created_by]].join(" ").toLowerCase().includes(q)));
  }
  function monthSel(key = "rmonth") {
    const ms = Array.from({ length: 24 }, (_, i) => addM(ymNow(), -i)), cur = S.f[key];
    return `<select class="field" data-f="${key}">${key === "month" ? `<option value="recent" ${cur === "recent" ? "selected" : ""}>Baru dimasukkan (30 hari)</option>` : ""}<option value="all" ${cur === "all" ? "selected" : ""}>Semua bulan</option>${ms.map(m => `<option value="${m}" ${m === cur ? "selected" : ""}>${key === "month" ? "Tarikh resit: " : ""}${monthName(m)}</option>`).join("")}</select>`;
  }
  function listView() {
    const L = filtered(), tot = L.filter(x => x.status !== "ditolak").reduce((a, x) => a + +x.amount, 0);
    const base = S.rows.filter(x => inList(x) && x.status !== "ditolak"), jt = k => base.filter(x => !k || x.jenis === k).reduce((a, x) => a + +x.amount, 0);
    return `<div class="jn">${[["", "Semua"], ...Object.entries(JENIS)].map(([k, t]) => `<button type="button" data-fj="${k}" class="${S.f.jenis === k ? "on" : ""}">${JENIS_ICO[k] || ""} ${t.replace(/ \(.*\)/, "")}<small>${rm(jt(k))}</small></button>`).join("")}</div>
      <div class="filters">${monthSel("month")}
      <select class="field" data-f="status"><option value="">Semua status</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${k === S.f.status ? "selected" : ""}>${v[0]}</option>`).join("")}</select>
      <select class="field" data-f="cat"><option value="">Semua kategori</option>${Object.entries(CATS).filter(([, c]) => !S.f.jenis || c[1] === S.f.jenis).map(([k, c]) => `<option value="${k}" ${k === S.f.cat ? "selected" : ""}>${c[0]}</option>`).join("")}</select>
      <input class="field" data-f="q" placeholder="Cari kedai, plat, staff…" value="${esc(S.f.q)}"></div>
      <div class="row"><span class="mute grow">${L.length} resit</span><b>${rm(tot)}</b></div>
      <div class="list">${(globalThis.adaPg?globalThis.adaPg.rows("blj",L,render):L).map(card).join("") || '<div class="empty">Tiada resit untuk tapisan ini.</div>'}</div>${(globalThis.adaPg?globalThis.adaPg.nav("blj",L.length):"")}`;
  }

  function reportView() {
    const L = S.rows.filter(x => x.status === "disahkan" && inReport(x));
    const sum = a => a.reduce((s, x) => s + +x.amount, 0), total = sum(L);
    const by = (key) => { const m = {}; L.forEach(x => { const k = key(x); m[k] = (m[k] || 0) + +x.amount; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const bars = (rows, lab) => rows.map(([k, v]) => `<div style="margin-bottom:8px"><div class="row"><span class="grow">${esc(lab(k))}</span><b>${rm(v)}</b></div><div class="bar"><i style="width:${total ? Math.round(v / total * 100) : 0}%"></i></div></div>`).join("") || '<p class="mute">Tiada data.</p>';
    const perCar = by(x => x.vehicle_id || "").filter(([k]) => k);
    const jen = k => L.filter(x => x.jenis === k);
    const pending = S.rows.filter(x => x.status === "draf");
    return `<div class="filters">${monthSel()}</div>
      <div class="stats"><div class="stat"><small>Jumlah disahkan</small><b>${rm(total)}</b></div><div class="stat"><small>Bil. resit</small><b>${L.length}</b></div>
      <div class="stat"><small>Kos kereta</small><b>${rm(sum(L.filter(x => x.vehicle_id)))}</b></div><div class="stat"><small>Belum disemak</small><b>${pending.length} · ${rm(sum(pending))}</b></div>
      <div class="stat"><small>SST dibayar</small><b>${rm(L.reduce((s, x) => s + +x.tax_amount, 0))}</b></div><div class="stat"><small>Tuntutan staff</small><b>${rm(sum(L.filter(x => x.paid_by === "staf")))}</b></div></div>
      <div class="stats">${Object.entries(JENIS).map(([k, t]) => `<div class="stat"><small>${JENIS_ICO[k]} ${t}</small><b>${rm(sum(jen(k)))}</b><small>${jen(k).length} resit · ${total ? Math.round(sum(jen(k)) / total * 100) : 0}%</small></div>`).join("")}</div>
      ${S.f.rmonth !== "all" ? overheadCheck(L) : ""}
      ${Object.entries(JENIS).map(([k, t]) => { const J = jen(k), m = {}; J.forEach(x => m[x.category] = (m[x.category] || 0) + +x.amount); const rows = Object.entries(m).sort((a, b) => b[1] - a[1]), jt = sum(J);
        return `<div class="card"><div class="row" style="margin-bottom:8px"><div class="kick grow">${JENIS_ICO[k]} ${t.toUpperCase()}</div><b>${rm(jt)}</b></div>${rows.map(([c, v]) => `<div style="margin-bottom:8px"><div class="row"><span class="grow">${esc(catLabel(c))}</span><b>${rm(v)}</b></div><div class="bar"><i style="width:${jt ? Math.round(v / jt * 100) : 0}%"></i></div></div>`).join("") || '<p class="mute">Tiada data.</p>'}</div>`; }).join("")}
      <div class="card"><div class="kick" style="margin-bottom:8px">IKUT BAHAGIAN</div>${bars(by(x => x.unit), k => UNIT[k] || k)}</div>
      <div class="card"><div class="kick" style="margin-bottom:8px">KOS TAMBAHAN PER KERETA (dari resit)</div>${perCar.length ? `<table class="tbl"><tr><th>Kereta</th><th class="r">Resit</th><th class="r">Kos</th></tr>${perCar.map(([id, v]) => `<tr><td>${esc(vName(id) || "Kereta dipadam")}</td><td class="r">${L.filter(x => x.vehicle_id === id).length}</td><td class="r"><b>${rm(v)}</b></td></tr>`).join("")}</table>` : '<p class="mute">Belum ada resit dikaitkan dengan kereta.</p>'}</div>`;
  }

  // Senarai semak bil overhead: apa yang dibayar 3 bulan lepas tapi belum ada resit bulan ini
  function overheadCheck(L) {
    const key = x => x.category + "|" + normPlate(x.vendor).slice(0, 8);
    const now = {}; L.filter(x => x.jenis === "overhead").forEach(x => { const k = key(x); (now[k] ||= { c: x.category, v: x.vendor, a: 0 }).a += +x.amount; });
    const exp = {}; S.prev.forEach(x => { const k = key(x); if (!exp[k]) exp[k] = { c: x.category, v: x.vendor, a: +x.amount, d: x.receipt_date }; });
    const keys = [...new Set([...Object.keys(exp), ...Object.keys(now)])];
    if (!keys.length) return `<div class="card"><div class="kick" style="margin-bottom:6px">🏢 SEMAKAN BIL OVERHEAD ${monthName(S.f.rmonth).toUpperCase()}</div><p class="mute">Belum ada sejarah overhead. Bila resit sewa, TNB, internet dan langganan disahkan, sistem akan ingatkan bil yang belum dibayar setiap bulan.</p></div>`;
    const done = keys.filter(k => now[k]).length;
    return `<div class="card"><div class="row" style="margin-bottom:8px"><div class="kick grow">🏢 SEMAKAN BIL OVERHEAD ${monthName(S.f.rmonth).toUpperCase()}</div><b>${done}/${keys.length}</b></div>
      <table class="tbl">${keys.sort((a, b) => !!now[a] - !!now[b]).map(k => { const n = now[k], e = exp[k], o = n || e;
        return `<tr><td>${n ? "✅" : "⏳"} <b>${esc(catLabel(o.c))}</b><br><small class="mute">${esc(o.v || "-")}</small></td><td class="r">${n ? rm(n.a) : `<span class="mute">Belum ada resit</span><br><small class="mute">lepas: ${rm(e.a)} (${dmy(e.d)})</small>`}</td></tr>`; }).join("")}</table></div>`;
  }

  // ---------- Analisa harian / mingguan / bulanan ikut kategori ----------
  const A = { mode: "bulanan", jenis: "", draf: false, rows: [], key: "", busy: false };
  const JCOL = { inventori: "#e9b949", pembelian: "#5aa9e6", overhead: "#a68af0" };
  const PAL = ["#e9b949", "#5aa9e6", "#a68af0", "#4fc48a", "#f08a5d", "#e05d8a", "#3fc1c9", "#c7b35a", "#8fa3b8", "#d98ee6", "#7bc96f", "#f2c46d"];
  const dAdd = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const monday = d => { const t = new Date(d + "T00:00:00Z"), w = (t.getUTCDay() + 6) % 7; return dAdd(d, -w); };
  const MODE = {
    harian: { n: 30, show: 14, cur: "Hari ini", prev: "semalam", unit: "hari", key: d => d, start: () => dAdd(todayK(), -29),
      list: () => Array.from({ length: 30 }, (_, i) => dAdd(todayK(), i - 29)), lab: k => k.slice(8) + "/" + k.slice(5, 7) },
    mingguan: { n: 12, show: 12, cur: "Minggu ini", prev: "minggu lepas", unit: "minggu", key: monday, start: () => dAdd(monday(todayK()), -77),
      list: () => Array.from({ length: 12 }, (_, i) => dAdd(monday(todayK()), (i - 11) * 7)), lab: k => { const e = dAdd(k, 6); return `${+k.slice(8)}/${+k.slice(5, 7)}–${+e.slice(8)}/${+e.slice(5, 7)}`; } },
    bulanan: { n: 12, show: 12, cur: "Bulan ini", prev: "bulan lepas", unit: "bulan", key: d => d.slice(0, 7), start: () => addM(ymNow(), -11) + "-01",
      list: () => Array.from({ length: 12 }, (_, i) => addM(ymNow(), i - 11)), lab: k => MONTHS[+k.slice(5) - 1] + " " + k.slice(2, 4) },
  };
  async function loadAna() {
    const M = MODE[A.mode], k = A.mode + "|" + A.draf + "|" + todayK();
    A.busy = true; render();
    if (A.key !== k) {
      let q = client.from("expenses").select("id,receipt_date,vendor,amount,tax_amount,category,jenis,status,vehicle_id,paid_by")
        .gte("receipt_date", M.start()).lte("receipt_date", todayK()).neq("status", "ditolak").limit(10000);
      if (!A.draf) q = q.eq("status", "disahkan");
      const r = await q; A.rows = r.data || []; A.key = k; if (r.error) say("Gagal muat analisa: " + r.error.message, "err");
    }
    A.busy = false; render();
  }
  function anaView() {
    const M = MODE[A.mode], keys = M.list(), rows = A.rows.filter(x => !A.jenis || x.jenis === A.jenis);
    const by = {}; keys.forEach(k => by[k] = { t: 0, n: 0, c: {}, j: {} });
    for (const x of rows) { const k = M.key(String(x.receipt_date)), b = by[k]; if (!b) continue; const a = +x.amount; b.t += a; b.n++; b.c[x.category] = (b.c[x.category] || 0) + a; b.j[x.jenis] = (b.j[x.jenis] || 0) + a; }
    const total = rows.reduce((s, x) => s + +x.amount, 0), curK = keys[keys.length - 1], prevK = keys[keys.length - 2], cur = by[curK], prev = by[prevK];
    // purata dikira dari tempoh pertama yang ada data (bukan bulan sebelum sistem digunakan)
    const first = keys.findIndex(k => by[k].t > 0), past = first < 0 ? [] : keys.slice(first, -1).map(k => by[k].t), avg = past.length ? past.reduce((a, b) => a + b, 0) / past.length : 0;
    const peakK = keys.reduce((a, k) => by[k].t > by[a].t ? k : a, keys[0]);
    const chg = prev.t ? (cur.t - prev.t) / prev.t * 100 : null;
    const topCat = Object.entries(cur.c).sort((a, b) => b[1] - a[1])[0];
    // kategori yang wujud dalam julat, ikut susunan jenis
    const catTot = {}; rows.forEach(x => catTot[x.category] = (catTot[x.category] || 0) + +x.amount);
    const cats = Object.keys(CATS).filter(c => catTot[c]).sort((a, b) => Object.keys(JENIS).indexOf(catJenis(a)) - Object.keys(JENIS).indexOf(catJenis(b)) || catTot[b] - catTot[a]);
    // Graf bertindan: ikut jenis (Semua) atau ikut kategori (jenis dipilih)
    const series = A.jenis ? cats.map((c, i) => ({ k: c, l: catLabel(c), col: PAL[i % PAL.length], v: k => by[k].c[c] || 0 }))
                           : Object.keys(JENIS).map(j => ({ k: j, l: JENIS[j], col: JCOL[j], v: k => by[k].j[j] || 0 }));
    const W = 760, H = 230, pl = 46, pb = 26, pt = 10, cw = (W - pl - 6) / keys.length, mx = Math.max(1, ...keys.map(k => by[k].t));
    const nice = (() => { const r = mx / 4, p = Math.pow(10, Math.floor(Math.log10(r))), m = [1, 2, 2.5, 5, 10].find(m => m * p >= r) * p; return m; })();
    const top = Math.max(nice * 4, mx), y = v => pt + (H - pt - pb) * (1 - v / top);
    const grid = [0, 1, 2, 3, 4].map(i => { const v = nice * i; return v > top ? "" : `<line x1="${pl}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff14"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#9a958a">${v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + "k" : v}</text>`; }).join("");
    const bars = keys.map((k, i) => { let acc = 0; const x0 = pl + i * cw + cw * .14, bw = cw * .72;
      const seg = series.map(s => { const v = s.v(k); if (!v) return ""; const y1 = y(acc + v), y0 = y(acc); acc += v; return `<rect x="${x0}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1)}" fill="${s.col}" rx="1.5"><title>${esc(M.lab(k))} · ${esc(s.l)}: ${rm(v)}</title></rect>`; }).join("");
      const lbl = (keys.length <= 14 || i % 2 === (keys.length - 1) % 2) ? `<text x="${x0 + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="${keys.length > 14 ? 9 : 10}" fill="${k === curK ? "#ffd257" : "#9a958a"}">${esc(A.mode === "mingguan" ? M.lab(k).split("–")[0] : M.lab(k))}</text>` : "";
      return seg + lbl; }).join("");
    const avgLine = avg ? `<line x1="${pl}" x2="${W - 4}" y1="${y(avg)}" y2="${y(avg)}" stroke="#ffd257" stroke-dasharray="4 4" opacity=".7"/><text x="${W - 6}" y="${y(avg) - 4}" text-anchor="end" font-size="10" fill="#ffd257">purata ${rm(avg)}</text>` : "";
    // Jadual kategori x tempoh
    const tk = keys.slice(-M.show).reverse(), cellMax = Math.max(1, ...cats.flatMap(c => tk.map(k => by[k].c[c] || 0)));
    const heat = v => v ? `background:rgba(233,185,73,${(.08 + .5 * v / cellMax).toFixed(2)})` : "";
    const table = cats.length ? `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="tbl atbl"><thead><tr><th class="stk">Kategori</th><th class="r">Jumlah</th>${tk.map(k => `<th class="r" style="${k === curK ? "color:#ffd257" : ""}">${esc(M.lab(k))}</th>`).join("")}</tr></thead><tbody>
      ${Object.keys(JENIS).filter(j => cats.some(c => catJenis(c) === j)).map(j => {
        const cs = cats.filter(c => catJenis(c) === j), jt = cs.reduce((a, c) => a + catTot[c], 0);
        return `<tr class="grp"><td class="stk">${JENIS_ICO[j]} <b>${esc(JENIS[j])}</b></td><td class="r"><b>${rm(jt)}</b></td>${tk.map(k => `<td class="r"><b>${by[k].j[j] ? rm(by[k].j[j]) : "–"}</b></td>`).join("")}</tr>` +
          cs.map(c => `<tr><td class="stk"><button class="lnk" data-acat="${c}" title="Lihat resit">${esc(catLabel(c))}</button></td><td class="r">${rm(catTot[c])}</td>${tk.map(k => { const v = by[k].c[c] || 0; return `<td class="r" style="${heat(v)}">${v ? rm(v) : '<span class="mute">–</span>'}</td>`; }).join("")}</tr>`).join("");
      }).join("")}
      <tr class="tot"><td class="stk"><b>JUMLAH</b></td><td class="r"><b>${rm(total)}</b></td>${tk.map(k => `<td class="r"><b>${by[k].t ? rm(by[k].t) : "–"}</b></td>`).join("")}</tr></tbody></table></div>` : '<p class="mute">Tiada perbelanjaan dalam tempoh ini.</p>';
    // Kedai utama
    const ven = {}; rows.forEach(x => { const v = (x.vendor || "(tiada nama)").trim(); (ven[v] ||= { a: 0, n: 0 }); ven[v].a += +x.amount; ven[v].n++; });
    const topV = Object.entries(ven).sort((a, b) => b[1].a - a[1].a).slice(0, 8);
    // Pecahan jenis untuk tempoh semasa
    const jRows = Object.keys(JENIS).map(j => [j, rows.filter(x => x.jenis === j).reduce((a, x) => a + +x.amount, 0)]);
    const insight = [
      cur.t ? `${M.cur}: <b>${rm(cur.t)}</b> (${cur.n} resit)${chg === null ? "" : `, <b style="color:${chg > 0 ? "#ffaaa4" : "#7fd8a6"}">${chg > 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(0)}%</b> berbanding ${M.prev}`}.` : `${M.cur}: belum ada perbelanjaan${A.draf ? "" : " disahkan"}.`,
      topCat ? `Kategori terbesar ${M.cur.toLowerCase()}: <b>${esc(catLabel(topCat[0]))}</b> ${rm(topCat[1])} (${Math.round(topCat[1] / cur.t * 100)}%).` : "",
      avg ? `Purata ${M.unit}an (${past.length} ${M.unit} sebelum): <b>${rm(avg)}</b>${cur.t > avg * 1.3 ? " — tempoh semasa <b>melebihi purata</b>." : "."}` : "",
      by[peakK].t ? `Tertinggi: <b>${esc(M.lab(peakK))}</b> ${rm(by[peakK].t)}.` : "",
    ].filter(Boolean);
    return `<div class="jn">${[["harian", "Harian", "30 hari"], ["mingguan", "Mingguan", "12 minggu"], ["bulanan", "Bulanan", "12 bulan"]].map(([k, t, d]) => `<button data-amode="${k}" class="${A.mode === k ? "on" : ""}">${t}<small>${d}</small></button>`).join("")}</div>
      <div class="jn">${[["", "Semua"], ...Object.entries(JENIS)].map(([k, t]) => `<button data-ajenis="${k}" class="${A.jenis === k ? "on" : ""}">${JENIS_ICO[k] || ""} ${t.replace(/ \(.*\)| Tetap Bulanan| \/ Operasi/g, "")}</button>`).join("")}</div>
      <label class="mute" style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="adraf" ${A.draf ? "checked" : ""}> Termasuk resit belum disemak</label>
      ${A.busy ? '<p class="mute"><span class="spin"></span>Memuatkan analisa…</p>' : ""}
      <div class="stats">
        <div class="stat"><small>${M.cur}</small><b>${rm(cur.t)}</b><small>${chg === null ? "&nbsp;" : `<span style="color:${chg > 0 ? "#ffaaa4" : "#7fd8a6"}">${chg > 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(0)}%</span> vs ${M.prev}`}</small></div>
        <div class="stat"><small>${M.prev[0].toUpperCase() + M.prev.slice(1)}</small><b>${rm(prev.t)}</b><small>${prev.n} resit</small></div>
        <div class="stat"><small>Purata se${M.unit}</small><b>${rm(avg)}</b><small>${past.length} ${M.unit} lepas</small></div>
        <div class="stat"><small>Jumlah ${keys.length} ${M.unit}</small><b>${rm(total)}</b><small>${rows.length} resit</small></div>
      </div>
      <div class="card info" style="background:#12263a;border:0"><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:3px">${insight.map(t => `<li>${t}</li>`).join("")}</ul></div>
      <div class="card"><div class="row" style="margin-bottom:6px"><div class="kick grow">TREND ${M.unit.toUpperCase()}AN ${A.jenis ? "· " + esc(JENIS[A.jenis]).toUpperCase() : ""}</div></div>
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Graf perbelanjaan ${M.unit}an">${grid}${bars}${avgLine}</svg>
        <div class="row" style="flex-wrap:wrap;gap:10px;margin-top:6px">${series.filter(sr => keys.some(k => sr.v(k))).map(sr => `<span style="font-size:12.5px;display:inline-flex;align-items:center;gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:${sr.col};display:inline-block"></i>${esc(sr.l)}</span>`).join("")}</div></div>
      ${!A.jenis ? `<div class="stats">${jRows.map(([j, v]) => `<div class="stat" style="border-left:4px solid ${JCOL[j]}"><small>${JENIS_ICO[j]} ${JENIS[j]}</small><b>${rm(v)}</b><small>${total ? Math.round(v / total * 100) : 0}% · ${keys.length} ${M.unit}</small></div>`).join("")}</div>` : ""}
      <div class="card"><div class="row" style="margin-bottom:8px"><div class="kick grow">IKUT KATEGORI · ${M.unit.toUpperCase()}AN</div><small class="mute">tekan kategori untuk lihat resit</small></div>${table}</div>
      <div class="card"><div class="kick" style="margin-bottom:8px">KEDAI / PEMBEKAL UTAMA (${keys.length} ${M.unit})</div>${topV.length ? `<table class="tbl">${topV.map(([v, o]) => `<tr><td>${esc(v)}</td><td class="r mute">${o.n} resit</td><td class="r"><b>${rm(o.a)}</b></td></tr>`).join("")}</table>` : '<p class="mute">Tiada data.</p>'}</div>`;
  }

  function exportView() {
    const L = S.rows.filter(x => x.status === "disahkan" && inReport(x));
    return `<div class="filters">${monthSel()}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><b>Fail untuk akauntan / LHDN</b>
      <p class="mute">${L.length} resit disahkan · ${rm(L.reduce((s, x) => s + +x.amount, 0))}. ZIP mengandungi semua gambar resit yang dinamakan & disusun ikut kategori, serta ringkasan Excel (CSV).</p>
      <p class="mute">Susunan: <code>${esc(S.f.rmonth === "all" ? "YYYY-MM" : S.f.rmonth)}/Jenis/Kategori/tarikh_kedai_RMjumlah.jpg</code></p>
      <div class="row"><button class="btn pri" data-zip ${L.length ? "" : "disabled"}>⬇ Muat turun ZIP (resit + ringkasan)</button><button class="btn" data-csv ${L.length ? "" : "disabled"}>⬇ Ringkasan sahaja (CSV)</button></div>
      <p class="mute">Simpan rekod perniagaan sekurang-kurangnya 7 tahun. Semua resit kekal dalam cloud sistem.</p></div>`;
  }

  function aiView() {
    const a = S.ai || {};
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><b>Sambungan AI pembaca resit</b>
      <p>${a.has_key ? `<span class="chip c-on">Aktif</span> Kunci ${esc(a.hint || "")} · model ${esc(a.model || "")}` : '<span class="chip c-warn">Belum disambung</span>'}</p>
      <p class="mute">Sistem guna Claude (Anthropic) untuk baca resit. Daftar di <b>console.anthropic.com</b> → API Keys → Create Key, tambah kredit (anggaran kos sangat rendah, kira-kira beberapa sen sahaja setiap resit), kemudian tampal kunci di sini. Kunci disimpan selamat di server dan tidak dipaparkan semula.</p>
      <form id="aif" class="edit"><div class="full"><label>Kunci API (sk-ant-…)</label><input class="field" name="key" type="password" autocomplete="off" placeholder="${a.has_key ? "Biarkan kosong untuk kekalkan kunci sedia ada" : "sk-ant-..."}"></div>
      <div class="full"><label>Model</label><input class="field" name="model" value="${esc(a.model || "claude-haiku-4-5")}"></div>
      <div class="full"><button class="btn pri" type="submit">Simpan</button></div></form></div>`;
  }

  // ---------- Actions ----------
  function formData() {
    const f = app.querySelector("#ed"); if (!f) return null; const g = n => f.elements[n]?.value;
    return { vendor: g("vendor")?.trim() || null, receipt_date: g("receipt_date"), amount: Math.max(0, Number(g("amount")) || 0),
      category: g("category"), jenis: g("jenis"), unit: g("unit"), vehicle_id: g("vehicle_id") || null, payment_method: g("payment_method"),
      paid_by: g("paid_by"), receipt_no: g("receipt_no")?.trim() || null, tax_amount: Math.max(0, Number(g("tax_amount")) || 0), notes: g("notes")?.trim() || null,
      ...(() => { const v = g("insp_link") || "auto"; return v.startsWith("part:") ? { insp_mode: "part", inspection_part_id: v.slice(5) } : { insp_mode: v }; })() };
  }
  async function save(id, quiet) {
    const p = formData(); if (!p) return true;
    if (!p.receipt_date) { say("Isi tarikh resit.", "err"); return false; }
    const r = await client.from("expenses").update(p).eq("id", id).select().single();
    if (r.error) { say("Gagal simpan: " + r.error.message, "err"); return false; }
    S.rows = S.rows.map(x => x.id === id ? r.data : x); localDups(); await checkDup(r.data);
    if (r.data.vehicle_id) { delete S.insp[r.data.vehicle_id]; loadInsp(r.data.vehicle_id); }
    if (!quiet) { S.editId = null; say(r.data.inspection_id ? "Resit disimpan & kos dimasukkan ke Pemeriksaan kereta." : "Resit disimpan.", "ok"); render(); }
    return true;
  }
  async function exportCsv(L, asBlob) {
    const head = ["Tarikh", "Kedai", "No Resit", "Kategori", "Jenis", "Bahagian", "Kereta", "Cara Bayar", "Dibayar Oleh", "Staff", "SST", "Jumlah", "Catatan", "Nama Fail"];
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [head.map(q).join(",")].concat(L.map(x => [dmy(x.receipt_date), x.vendor, x.receipt_no, catLabel(x.category), JENIS[x.jenis] || "", UNIT[x.unit], vName(x.vehicle_id), PAY[x.payment_method],
      x.paid_by === "staf" ? "Staff (tuntutan)" : "Syarikat", S.names[x.created_by] || "", (+x.tax_amount).toFixed(2), (+x.amount).toFixed(2), x.notes, fileName(x)].map(q).join(",")));
    lines.push(["", "", "", "", "", "", "", "", "", "JUMLAH", L.reduce((s, x) => s + +x.tax_amount, 0).toFixed(2), L.reduce((s, x) => s + +x.amount, 0).toFixed(2), "", ""].map(q).join(","));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    if (asBlob) return blob; download(blob, `Perbelanjaan-AbeDinAuto-${S.f.rmonth}.csv`);
  }
  const fileName = x => `${String(x.receipt_date).slice(0, 7)}/${{ inventori: "1-Inventori", pembelian: "2-Pembelian", overhead: "3-Overhead" }[x.jenis] || "2-Pembelian"}/${slug(catLabel(x.category))}/${x.receipt_date}_${slug(x.vendor)}_RM${(+x.amount).toFixed(2)}_${x.id.slice(0, 4)}.${/\.pdf$/i.test(x.image_path || "") ? "pdf" : "jpg"}`;
  function download(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  async function exportZip(L) {
    say("Menyediakan ZIP… (jangan tutup halaman)");
    const { default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");
    const zip = new JSZip(); let n = 0;
    for (const x of L) {
      if (!x.image_path) continue;
      const d = await client.storage.from("staff-docs").download(x.image_path);
      if (d.data) zip.file(fileName(x), d.data);
      say(`Menyediakan ZIP… ${++n}/${L.length}`);
    }
    zip.file("Ringkasan.csv", await exportCsv(L, true));
    download(await zip.generateAsync({ type: "blob" }), `Resit-AbeDinAuto-${S.f.rmonth}.zip`);
    say("ZIP siap dimuat turun.", "ok");
  }

  app.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "cam" || t.id === "gal") { handleFiles(t.files); t.value = ""; return; }
    if (t.dataset.f) { S.f[t.dataset.f] = t.value; if (t.dataset.f === "month" || t.dataset.f === "rmonth") load(); else render(); }
    if (t.id === "paym") S.payMonth = t.value;
    if (t.id === "adraf") { A.draf = t.checked; loadAna(); }
    if (t.name === "vehicle_id" && t.value) { const u = app.querySelector("[name=unit]"); if (u && u.value === "umum") u.value = "jualan"; }
    if (t.name === "vehicle_id") { const b = app.querySelector(".inspbox"); if (b) b.hidden = !t.value; if (t.value) { const sel = app.querySelector("[name=insp_link]"); if (sel) sel.value = "auto"; const h = app.querySelector("#insphint"); if (h) h.textContent = "Memuatkan senarai barang pemeriksaan…"; loadInsp(t.value, true); } }
  });
  app.addEventListener("input", e => { if (e.target.dataset.f === "q") { S.f.q = e.target.value; clearTimeout(S.qt); S.qt = setTimeout(() => { const pos = e.target.selectionStart; render(); const n = app.querySelector("[data-f=q]"); n?.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} }, 250); } });
  app.addEventListener("submit", async e => {
    e.preventDefault();
    if (e.target.id === "ed") await save(S.editId);
    if (e.target.id === "aif") {
      const r = await client.rpc("ai_config_set", { p_key: e.target.elements.key.value, p_model: e.target.elements.model.value });
      if (r.error) return say("Gagal: " + r.error.message, "err");
      const a = await client.rpc("ai_config_status"); S.ai = a.data; say("Tetapan AI disimpan.", "ok"); render();
    }
  });
  app.addEventListener("click", async e => {
    const b = e.target.closest("button,img[data-zoom]"); if (!b) return;
    if (b.dataset.zoom) { const z = document.createElement("div"); z.className = "zoom"; z.innerHTML = `<img src="${esc(b.dataset.zoom)}">`; z.onclick = () => z.remove(); root.append(z); return; }
    if (b.dataset.jenis !== undefined && b.dataset.jenis) {
      const f = app.querySelector("#ed"); if (!f) return; const jn = b.dataset.jenis;
      f.elements.jenis.value = jn; f.querySelectorAll("[data-jenis]").forEach(x => x.classList.toggle("on", x.dataset.jenis === jn));
      const sel = f.elements.category; if (catJenis(sel.value) !== jn) sel.innerHTML = catOptions(jn, ""); 
      const h = f.querySelector("#jnhint"); if (h) h.textContent = JENIS_HINT[jn];
      if (jn === "inventori" && f.elements.unit.value === "umum") f.elements.unit.value = "jualan";
      if (jn === "overhead") f.elements.unit.value = "umum";
      return;
    }
    if (b.dataset.fj !== undefined) { S.f.jenis = b.dataset.fj; S.f.cat = ""; render(); return; }
    if (b.dataset.tab) { S.tab = b.dataset.tab; S.editId = null; say(""); render(); if (S.tab === "ana") loadAna(); return; }
    if (b.dataset.amode) { A.mode = b.dataset.amode; loadAna(); return; }
    if (b.dataset.ajenis !== undefined) { A.jenis = b.dataset.ajenis; render(); return; }
    if (b.dataset.acat) { S.tab = "list"; S.f.month = "all"; S.f.jenis = ""; S.f.cat = b.dataset.acat; S.f.status = ""; load(); return; }
    if (b.dataset.edit) { S.editId = b.dataset.edit; const ex = S.rows.find(r => r.id === S.editId); if (ex && !S.dups[ex.id]) checkDup(ex).then(() => { if (S.editId === ex.id) render(); }); render(); app.querySelector("#ed")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (b.hasAttribute("data-close")) { S.editId = null; render(); return; }
    if (b.dataset.verify) {
      b.disabled = true; if (!(await save(b.dataset.verify, true))) { b.disabled = false; return; }
      const x = S.rows.find(r => r.id === b.dataset.verify);
      if (!(+x.amount > 0)) { b.disabled = false; return say("Jumlah mesti lebih daripada 0.", "err"); }
      const r = await client.rpc("expense_verify", { p_id: x.id, p_pay_month: x.paid_by === "staf" ? S.payMonth : null });
      if (r.error) { b.disabled = false; return say("Gagal sahkan: " + r.error.message, "err"); }
      const next = S.rows.find(o => o.status === "draf" && o.id !== x.id);
      await load(); S.editId = next?.id || null; say(x.paid_by === "staf" ? "Disahkan & tuntutan staff dicipta." : "Resit disahkan.", "ok"); render(); return;
    }
    if (b.dataset.reject) {
      const why = prompt("Sebab tolak resit ini?"); if (why == null) return;
      const r = await client.from("expenses").update({ status: "ditolak", review_note: why.trim() || null, verified_by: uid, verified_at: new Date().toISOString() }).eq("id", b.dataset.reject).select().single();
      if (r.error) return say("Gagal: " + r.error.message, "err");
      S.rows = S.rows.map(x => x.id === r.data.id ? r.data : x); S.editId = null; say("Resit ditolak.", "ok"); render(); return;
    }
    if (b.dataset.reopen) {
      const r = await client.from("expenses").update({ status: "draf", verified_by: null, verified_at: null }).eq("id", b.dataset.reopen).select().single();
      if (r.error) return say("Gagal: " + r.error.message, "err");
      S.rows = S.rows.map(x => x.id === r.data.id ? r.data : x); render(); return;
    }
    if (b.dataset.del) {
      if (!confirm("Padam resit ini?")) return;
      const x = S.rows.find(r => r.id === b.dataset.del);
      const r = await client.from("expenses").delete().eq("id", x.id);
      if (r.error) return say("Gagal padam: " + r.error.message, "err");
      if (x.image_path && !x.claim_id) await client.storage.from("staff-docs").remove([x.image_path]).catch(() => {});
      S.rows = S.rows.filter(r => r.id !== x.id); S.editId = null; say("Resit dipadam.", "ok"); render(); return;
    }
    const L = S.rows.filter(x => x.status === "disahkan" && inReport(x));
    if (b.hasAttribute("data-csv")) { exportCsv(L); return; }
    if (b.hasAttribute("data-zip")) { b.disabled = true; try { await exportZip(L); } catch (er) { say("Gagal ZIP: " + (er?.message || er), "err"); } b.disabled = false; return; }
  });

  // Dibuka dari notifikasi resit -> terus buka resit berkenaan
  const want = window.__adaOpenResit; window.__adaOpenResit = null;
  if (want) { S.tab = "list"; S.f.month = "all"; S.editId = want; }
  render();
  load().then(() => { if (want && !S.rows.some(r => r.id === want)) { S.editId = null; say("Resit tidak dijumpai atau telah dipadam.", "err"); render(); } });
}
