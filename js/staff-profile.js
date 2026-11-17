// Abe Din Auto – Profil HR staf penuh (dibuka dari Tetapan → Staf & Akses → Profil). Hanya Owner.
// Data: staff_hr, staff_pay, staff_work_history, staff_chronology, staff_advances, staff_leaves,
// dokumen dalam bucket peribadi "staff-docs" (lihat V73_STAFF_HR.sql).

export const PROFILE_CSS = `
.pf{display:flex;flex-direction:column;gap:12px}
.hd{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}
.av{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#3a2f0a;color:#ffd257;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:24px;flex:0 0 72px;border:2px solid #5a4a14}
.hd h2{margin:0;font-size:19px;font-weight:800;letter-spacing:.01em}
.hd .meta{color:var(--mute);font-size:13.5px;line-height:1.5}
.chips{margin-top:6px;display:flex;flex-wrap:wrap;gap:5px}
.c-blue{background:#12263a;color:#8cc4ff}.c-pur{background:#2a1a3a;color:#d6a8ff}.c-gry{background:#2c2a25;color:#cfc8b6}
.bar{height:7px;border-radius:99px;background:#2c2a25;overflow:hidden;margin-top:8px}.bar i{display:block;height:100%;background:var(--pri)}
.sec{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px}
.sec>.row:first-child{margin-bottom:8px}
.sec h4{margin:0;font-size:16px;font-weight:800}
.kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:18px}
@media(max-width:640px){.kv{grid-template-columns:1fr}}
.kv div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
.kv div span:first-child{color:var(--mute)}.kv div span:last-child{text-align:right;font-weight:600;word-break:break-word}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.tile{border:1px solid var(--line);border-radius:12px;padding:11px;background:var(--soft)}
.tile b{display:block;font-size:20px;margin-top:2px}.tile small{color:var(--mute);font-size:12px}
.t-g{background:#10261a;border-color:#1f4a31}.t-y{background:#2a2410;border-color:#4a3f14}.t-b{background:#101f2e;border-color:#1d3a57}.t-p{background:#1f1529;border-color:#3d2a52}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th{text-align:left;color:var(--mute);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:7px 6px;border-bottom:1px solid var(--line)}
td{padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}
.tw{overflow-x:auto}
.mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)}
.mini .full{grid-column:1/-1}
.cols{display:grid;grid-template-columns:minmax(240px,1fr) 2fr;gap:12px}@media(max-width:720px){.cols{grid-template-columns:1fr}}
.box{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--soft)}
.note{font-size:12.5px;color:var(--mute)}
.warn{background:#2a2410;border:1px solid #4a3f14;color:#ffd98a;border-radius:10px;padding:8px 10px;font-size:13px}
.docimg{max-width:260px;max-height:170px;border-radius:10px;border:1px solid var(--line);display:block;margin:6px 0}
.cb{display:flex;gap:8px;align-items:center;font-size:14px;text-transform:none;letter-spacing:0;color:var(--fg);font-weight:600}
.cb input{width:18px;height:18px}
`;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rm = n => "RM" + Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dmy = s => { if (!s) return "-"; const [y, m, d] = String(s).slice(0, 10).split("-"); return d ? `${d}/${m}/${y}` : "-"; };
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const ym = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const addMonths = (s, n) => { const [y, m] = s.split("-").map(Number); const t = y * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const monthName = s => { if (!s) return "-"; const [y, m] = s.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("ms-MY", { month: "long", year: "numeric" }); };

export const CATEGORY = { pengurusan: "Pengurusan", supervisor: "Supervisor", staff_biasa: "Staff Biasa", sales: "Sales", mekanik: "Mekanik / Teknikal", runner: "Runner / Driver", part_time: "Part-time", pelatih: "Pelatih / Intern" };
export const EMP_TYPE = { permanent: "Tetap", probation: "Percubaan", contract: "Kontrak", part_time: "Sambilan", intern: "Latihan Industri" };
export const CONTRACT = { active: "Aktif", notice: "Notis berhenti", resigned: "Letak jawatan", terminated: "Ditamatkan", ended: "Tamat kontrak" };
const GENDER = { male: "Lelaki", female: "Perempuan" };
const MARITAL = { single: "Bujang", married: "Berkahwin", divorced: "Bercerai", widowed: "Balu / Duda" };
const PAY = { daily: "Harian", hourly: "Sejam", monthly: "Bulanan" };
const SOCSO = { jenis1: "Jenis Pertama (Bencana + Ilat)", jenis2: "Jenis Kedua (Bencana sahaja, umur 60+)" };
const STAT = { default: "Auto / Lalai", custom: "Custom (pilih potongan)" };
const CHRONO = { lantikan: "Lantikan", pengesahan: "Pengesahan jawatan", kenaikan_gaji: "Kenaikan gaji", naik_pangkat: "Naik pangkat", tukar_jawatan: "Tukar jawatan", tukar_lokasi: "Tukar lokasi", amaran: "Surat amaran", disiplin: "Tindakan disiplin", penghargaan: "Penghargaan", berhenti: "Berhenti", lain: "Lain-lain" };
const LEAVE = { annual: "Cuti Tahunan", mc: "Cuti Sakit (MC)", hosp: "Hospitalisasi", unpaid: "Cuti Tanpa Gaji", paternity: "Cuti Paterniti", maternity: "Cuti Bersalin", emergency: "Cuti Kecemasan", other: "Lain-lain" };
const LSTAT = { approved: "Lulus", pending: "Menunggu", rejected: "Ditolak" };
const BANKS = ["Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank", "AmBank", "Bank Islam", "Bank Rakyat", "BSN", "Affin Bank", "Alliance Bank", "Bank Muamalat", "Agrobank", "OCBC Bank", "UOB", "HSBC", "Standard Chartered", "MBSB Bank", "Al Rajhi Bank", "Kuwait Finance House", "GXBank", "AEON Bank", "Boost Bank"];
const EDU = ["Tiada", "UPSR / PT3", "SPM", "SKM", "STPM", "Sijil", "Diploma", "Ijazah", "Master", "PhD"];
const PLEDGE = "Saya berikrar untuk melaksanakan tugas dengan jujur, amanah dan bertanggungjawab. Saya akan mematuhi semua peraturan syarikat dan menjaga nama baik syarikat pada setiap masa.";

// Medan setiap bahagian: [kunci, label, jenis, pilihan]
const F = {
  personal: [["staff_code", "Staff ID", "text"], ["ic_no", "No. IC", "ic"], ["company_id", "ID Syarikat", "text"], ["phone", "Telefon", "tel"], ["email_alt", "Emel peribadi", "email"],
    ["gender", "Jantina", "sel", GENDER], ["dob", "Tarikh lahir", "date"], ["birth_place", "Tempat lahir", "text"], ["marital", "Status perkahwinan", "sel", MARITAL],
    ["citizenship", "Warganegara", "text"], ["religion", "Agama", "list", ["Islam", "Buddha", "Kristian", "Hindu", "Lain-lain"]], ["race", "Bangsa", "list", ["Melayu", "Cina", "India", "Bumiputera Sabah", "Bumiputera Sarawak", "Lain-lain"]],
    ["children", "Bilangan anak", "num"], ["dependents", "Bilangan tanggungan", "num"], ["address", "Alamat semasa", "area"], ["mailing_address", "Alamat surat-menyurat", "area"],
    ["emergency_name", "Waris kecemasan (nama)", "text"], ["emergency_relation", "Hubungan", "list", ["Isteri", "Suami", "Ibu", "Bapa", "Adik-beradik", "Anak", "Saudara"]], ["emergency_phone", "Telefon waris", "tel"], ["emergency_phone2", "Telefon waris (2)", "tel"]],
  job: [["join_date", "Tarikh mula kerja", "date"], ["confirm_date", "Tarikh pengesahan", "date"], ["department", "Jabatan", "list", ["Pengurusan", "HR", "Jualan", "Operasi", "Servis / Bengkel", "Akaun", "Sewa Kereta"]],
    ["position", "Jawatan", "text"], ["category", "Kategori staf", "sel", CATEGORY], ["shift", "Syif", "text"], ["work_location", "Lokasi kerja", "text"]],
  contract: [["employment_type", "Jenis pekerjaan", "sel", EMP_TYPE], ["contract_status", "Status kontrak", "sel", CONTRACT], ["probation_months", "Tempoh percubaan (bulan)", "num"], ["contract_end", "Tarikh tamat kontrak", "date"]],
  payroll: [["pay_type", "Jenis gaji", "sel", PAY, "pay"], ["rate", "Kadar gaji (RM)", "money", null, "pay"], ["allowance", "Elaun tetap sebulan (RM)", "money", null, "pay"],
    ["bank_name", "Nama bank", "list", BANKS], ["bank_account", "No. akaun bank", "text"], ["epf_no", "No. KWSP", "text"], ["socso_no", "No. PERKESO", "text"], ["sip_no", "No. SIP / EIS", "text"], ["tax_no", "No. cukai (LHDN)", "text"],
    ["statutory_mode", "Potongan statutori", "sel", STAT], ["socso_type", "Jenis caruman PERKESO", "sel", SOCSO], ["deduct_epf", "Potong KWSP", "bool"], ["deduct_socso", "Potong PERKESO", "bool"], ["deduct_sip", "Potong SIP / EIS", "bool"]],
  leave: [["al_days", "Cuti tahunan asas (kosong = ikut Akta)", "dec"], ["al_extra", "Cuti tahunan tambahan", "dec"], ["al_carry", "Bawa ke hadapan (CF)", "dec"], ["mc_days", "Cuti sakit (kosong = ikut Akta)", "dec"],
    ["hosp_days", "Hospitalisasi (kosong = 60)", "dec"], ["paternity_days", "Paterniti (kosong = 7)", "dec"], ["maternity_days", "Bersalin (kosong = 98)", "dec"], ["unpaid_days", "Had cuti tanpa gaji", "dec"]],
  docs: [["education", "Pendidikan tertinggi", "list", EDU], ["pledge_signer", "Nama penandatangan ikrar", "text"], ["pledge_signer_ic", "IC penandatangan", "text"], ["notes", "Catatan dalaman", "area"]],
};
const TITLE = { personal: "Maklumat Peribadi & Hubungan", job: "Pekerjaan", contract: "Kontrak / Pekerjaan", payroll: "Gaji, Bank & Statutori", leave: "Kelayakan Cuti", docs: "Dokumen & Ikrar" };

function serviceYears(join) { if (!join) return 0; return (Date.now() - new Date(join + "T00:00:00").getTime()) / (365.25 * 864e5); }
function serviceText(join) {
  if (!join) return "-"; const s = new Date(join + "T00:00:00"), n = new Date(); let m = (n.getFullYear() - s.getFullYear()) * 12 + n.getMonth() - s.getMonth(); if (n.getDate() < s.getDate()) m--;
  if (m < 0) return "belum mula"; const y = Math.floor(m / 12), r = m % 12; return [y ? y + " thn" : "", r ? r + " bln" : "", !y && !r ? "< 1 bln" : ""].filter(Boolean).join(" ");
}
function age(dob) { if (!dob) return null; const b = new Date(dob + "T00:00:00"), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; }
// IC Malaysia YYMMDD-PB-###G → tarikh lahir & jantina
function fromIC(ic) {
  const d = String(ic || "").replace(/\D/g, ""); if (d.length !== 12) return null;
  const yy = +d.slice(0, 2), mm = +d.slice(2, 4), dd = +d.slice(4, 6); if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const cy = new Date().getFullYear() % 100, y = (yy > cy ? 1900 : 2000) + yy;
  return { dob: `${y}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`, gender: +d[11] % 2 ? "male" : "female" };
}
// Kelayakan cuti ikut Akta Kerja 1955 (seksyen 60E & 60F)
export function leaveEntitle(hr) {
  const y = serviceYears(hr.join_date);
  const al = hr.al_days != null ? +hr.al_days : (y < 2 ? 8 : y < 5 ? 12 : 16);
  const mc = hr.mc_days != null ? +hr.mc_days : (y < 2 ? 14 : y < 5 ? 18 : 22);
  return { annual: al + (+hr.al_extra || 0) + (+hr.al_carry || 0), al_base: al, mc, hosp: hr.hosp_days != null ? +hr.hosp_days : 60,
    paternity: hr.paternity_days != null ? +hr.paternity_days : 7, maternity: hr.maternity_days != null ? +hr.maternity_days : 98, unpaid: hr.unpaid_days != null ? +hr.unpaid_days : null };
}
const REQUIRED = [["ic_no", "No. IC"], ["phone", "Telefon"], ["address", "Alamat"], ["dob", "Tarikh lahir"], ["gender", "Jantina"], ["emergency_name", "Waris kecemasan"], ["emergency_phone", "Telefon waris"],
  ["join_date", "Tarikh mula"], ["position", "Jawatan"], ["department", "Jabatan"], ["bank_name", "Bank"], ["bank_account", "No. akaun"], ["epf_no", "No. KWSP"], ["socso_no", "No. PERKESO"], ["photo_path", "Gambar staf"], ["ic_photo_path", "Salinan IC"]];
export function completeness(hr) { hr = hr || {}; const miss = REQUIRED.filter(([k]) => hr[k] == null || String(hr[k]).trim() === ""); return { pct: Math.round((REQUIRED.length - miss.length) / REQUIRED.length * 100), miss: miss.map(([, t]) => t) }; }

async function shrink(file) {
  if (!/^image\//.test(file.type) || file.size < 600000) return file;
  const img = await createImageBitmap(file).catch(() => null); if (!img) return file;
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(b => r(b ? new File([b], "img.jpg", { type: "image/jpeg" }) : file), "image/jpeg", .85));
}

export function mountProfile(app, ctx, staff, onBack) {
  const client = ctx.client, me = ctx.profile || {}, id = staff.id;
  const P = { hr: null, pay: null, hist: [], chrono: [], adv: [], leaves: [], edit: null, msg: "", cls: "", urls: {}, err: "" };
  const say = (t, c) => { P.msg = t; P.cls = c || ""; const m = app.querySelector("#pmsg"); if (m) { m.textContent = t; m.className = "msg " + (c || ""); } };

  async function load() {
    const q = [client.from("staff_hr").select("*").eq("staff_id", id).maybeSingle(), client.from("staff_pay").select("*").eq("staff_id", id).maybeSingle(),
      client.from("staff_work_history").select("*").eq("staff_id", id).order("start_date", { ascending: false }),
      client.from("staff_chronology").select("*").eq("staff_id", id).order("event_date", { ascending: false }),
      client.from("staff_advances").select("*").eq("staff_id", id).order("created_at", { ascending: false }),
      client.from("staff_leaves").select("*").eq("staff_id", id).order("date_from", { ascending: false })];
    const [hr, pay, hist, chrono, adv, lv] = await Promise.all(q);
    const err = [hr, pay, hist, chrono, adv, lv].find(r => r.error)?.error;
    if (err) P.err = /does not exist|schema cache/i.test(err.message) ? "Jadual profil staf belum dipasang. Jalankan V73_STAFF_HR.sql." : "Gagal memuatkan profil: " + err.message;
    P.hr = hr.data || { staff_id: id, category: "staff_biasa", employment_type: "permanent", contract_status: "active", statutory_mode: "default", socso_type: "jenis1", deduct_epf: true, deduct_socso: true, deduct_sip: true, children: 0, dependents: 0, citizenship: "Malaysia", al_extra: 0, al_carry: 0 };
    P.pay = pay.data; P.hist = hist.data || []; P.chrono = chrono.data || []; P.adv = adv.data || []; P.leaves = lv.data || [];
    await signUrls(); render();
  }
  async function signUrls() {
    const paths = [P.hr.photo_path, P.hr.ic_photo_path, ...P.chrono.map(c => c.doc_path)].filter(p => p && !P.urls[p]);
    if (!paths.length) return;
    const { data } = await client.storage.from("staff-docs").createSignedUrls(paths, 3600);
    (data || []).forEach(d => { if (d.signedUrl) P.urls[d.path] = d.signedUrl; });
  }
  const val = (k, src) => { const v = (src === "pay" ? (P.pay || {}) : P.hr)[k]; return v; };
  function show(f) {
    const [k, , type, opt, src] = f, v = val(k, src);
    if (type === "bool") return v === false ? "Tidak" : "Ya";
    if (v == null || v === "") return "-";
    if (type === "sel") return opt[v] || v;
    if (type === "date") return dmy(v);
    if (type === "money") return rm(v);
    return String(v);
  }
  function input(f) {
    const [k, label, type, opt, src] = f; let v = val(k, src); if (v == null) v = "";
    const n = `name="${k}"`, cls = `class="field"`;
    let h;
    if (type === "sel") h = `<select ${cls} ${n}><option value="">-</option>${Object.entries(opt).map(([a, b]) => `<option value="${a}" ${v === a ? "selected" : ""}>${esc(b)}</option>`).join("")}</select>`;
    else if (type === "list") h = `<input ${cls} ${n} list="dl_${k}" value="${esc(v)}"><datalist id="dl_${k}">${opt.map(o => `<option value="${esc(o)}">`).join("")}</datalist>`;
    else if (type === "area") h = `<textarea ${cls} ${n} rows="2">${esc(v)}</textarea>`;
    else if (type === "bool") return `<label class="cb"><input type="checkbox" ${n} ${v !== false ? "checked" : ""}> ${esc(label)}</label>`;
    else {
      const t = { date: "date", num: "number", dec: "number", money: "number", tel: "tel", email: "email" }[type] || "text";
      const ex = type === "num" ? `min="0" step="1"` : type === "dec" ? `min="0" step="0.5"` : type === "money" ? `min="0" step="0.01"` : type === "ic" ? `inputmode="numeric" placeholder="cth 860108296019"` : "";
      h = `<input ${cls} ${n} type="${t}" ${ex} value="${esc(v)}">`;
    }
    return `<div class="${type === "area" ? "full" : ""}"><label>${esc(label)}</label>${h}</div>`;
  }
  function section(key, extraView = "", extraTop = "") {
    const f = F[key], editing = P.edit === key;
    const head = `<div class="row"><h4 class="grow">${TITLE[key]}</h4>${editing ? "" : `<button class="btn sm" data-ed="${key}">✎ Edit</button>`}</div>`;
    if (editing) return `<div class="sec">${head}<form class="form" data-sf="${key}" style="border:none;padding:0;background:none">${extraTop}${f.map(input).join("")}
      <div class="full row"><button class="btn pri" type="submit">Simpan</button><button class="btn" type="button" data-a="cancel">Batal</button></div></form></div>`;
    return `<div class="sec">${head}<div class="kv">${f.filter(x => x[2] !== "bool" || key !== "payroll" || P.hr.statutory_mode === "custom").map(x => `<div><span>${esc(x[1].replace(/ \(.*\)$/, ""))}</span><span>${esc(show(x))}</span></div>`).join("")}</div>${extraView}</div>`;
  }

  function header() {
    const h = P.hr, ini = (staff.full_name || "?").split(/\s+/).filter(w => !/^(bin|binti|bt|b)$/i.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const ph = h.photo_path && P.urls[h.photo_path], c = completeness(h), a = age(h.dob);
    const st = h.contract_status || "active", active = staff.enabled && st === "active";
    return `<div class="hd">${ph ? `<img class="av" src="${esc(ph)}" alt="">` : `<div class="av">${esc(ini || "?")}</div>`}
      <div class="grow" style="min-width:200px"><h2>${esc((staff.full_name || "").toUpperCase())}</h2>
        <div class="meta">IC: ${esc(h.ic_no || "-")}${a != null ? ` · ${a} tahun` : ""}<br>Staff ID: ${esc(h.staff_code || "-")} · ${esc(staff.email || "")}<br>Khidmat: ${esc(serviceText(h.join_date))}${h.join_date ? ` (sejak ${dmy(h.join_date)})` : ""}</div>
        <div class="chips"><span class="chip ${active ? "c-on" : "c-warn"}">● ${active ? "Aktif" : staff.enabled ? CONTRACT[st] : "Nyahaktif"}</span><span class="chip c-blue">${esc(h.position || "Tiada jawatan")}</span>
          <span class="chip c-pur">${esc(CATEGORY[h.category] || "-")}</span><span class="chip c-role">${esc(EMP_TYPE[h.employment_type] || "-")}</span><span class="chip c-gry">${P.pay ? "Gaji " + PAY[P.pay.pay_type] : "Gaji belum ditetapkan"}</span></div>
        <div class="bar" title="Kelengkapan profil"><i style="width:${c.pct}%"></i></div><div class="note" style="margin-top:4px">Profil lengkap ${c.pct}%${c.miss.length ? " · Belum isi: " + esc(c.miss.join(", ")) : " ✓"}</div></div>
      <div class="row" style="flex-direction:column;align-items:stretch"><button class="btn sm" data-a="back">← Senarai staf</button><button class="btn sm pri" data-a="pdf">⎙ PDF / Cetak</button></div></div>`;
  }

  function photoBox() {
    const h = P.hr, ph = h.photo_path && P.urls[h.photo_path];
    return `<div class="sec"><div class="row"><h4 class="grow">Gambar Staf</h4><label class="btn sm" style="margin:0;text-transform:none;letter-spacing:0;color:var(--fg)">Pilih<input type="file" accept="image/*" data-up="photo_path" hidden></label>${ph ? `<button class="btn sm bad" data-rm="photo_path">Buang</button>` : ""}</div>
      <p class="note">JPG/PNG. Gambar besar dikecilkan secara automatik.</p></div>`;
  }

  function leaveView() {
    const e = leaveEntitle(P.hr), yr = String(new Date().getFullYear()), g = P.hr.gender;
    const thisYr = P.leaves.filter(l => String(l.date_from).startsWith(yr));
    const sum = (k, s) => thisYr.filter(l => l.kind === k && l.status === s).reduce((a, l) => a + +l.days, 0);
    const tile = (k, cls, ent, sub) => { const used = sum(k, "approved"), pend = sum(k, "pending"), rem = ent == null ? null : ent - used - pend;
      return `<div class="tile ${cls}"><small>${LEAVE[k]}</small><b>${ent == null ? used : `${rem}/${ent}`}</b><small>${ent == null ? "hari diambil" : `Diambil ${used} · Menunggu ${pend}`}${sub ? "<br>" + sub : ""}</small></div>`; };
    const sy = serviceYears(P.hr.join_date);
    return `<div class="sec"><div class="row"><h4 class="grow">Cuti (Tahun ${yr})</h4><button class="btn sm" data-ed="leave">✎ Kelayakan</button></div>
      ${P.edit === "leave" ? `<form class="form" data-sf="leave" style="border:none;padding:0;background:none">${F.leave.map(input).join("")}<div class="full row"><button class="btn pri" type="submit">Simpan</button><button class="btn" type="button" data-a="cancel">Batal</button></div></form>` : ""}
      ${!P.hr.join_date ? `<div class="warn">Isi tarikh mula kerja (bahagian Pekerjaan) supaya kelayakan cuti dikira ikut tempoh khidmat.</div>` : ""}
      <div class="tiles" style="margin-top:8px">${tile("annual", "", e.annual, `Asas ${e.al_base} + Extra ${+P.hr.al_extra || 0} + CF ${+P.hr.al_carry || 0}`)}${tile("mc", "t-g", e.mc)}${tile("hosp", "t-y", e.hosp)}
        ${g !== "female" ? tile("paternity", "t-b", e.paternity) : ""}${g !== "male" ? tile("maternity", "t-b", e.maternity) : ""}${tile("unpaid", "t-p", e.unpaid)}${tile("emergency", "", null)}</div>
      <p class="note" style="margin-top:6px">Kelayakan lalai ikut Akta Kerja 1955 (khidmat ${sy < 2 ? "&lt; 2 tahun" : sy < 5 ? "2–5 tahun" : "≥ 5 tahun"}). Kitaran: 01/01/${yr} – 31/12/${yr}.</p>
      <form class="mini" data-add="leave"><div><label>Jenis</label><select class="field" name="kind">${Object.entries(LEAVE).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div>
        <div><label>Dari</label><input class="field" type="date" name="date_from" value="${today()}" required></div><div><label>Hingga</label><input class="field" type="date" name="date_to" value="${today()}" required></div>
        <div><label>Hari</label><input class="field" type="number" name="days" min="0.5" step="0.5" value="1" required></div><div><label>Status</label><select class="field" name="status"><option value="approved">Lulus</option><option value="pending">Menunggu</option></select></div>
        <div class="full"><label>Sebab</label><input class="field" name="reason"></div><div class="full"><button class="btn pri sm" type="submit">+ Rekod cuti</button></div></form>
      ${P.leaves.length ? `<div class="tw" style="margin-top:10px"><table><tr><th>Tarikh</th><th>Jenis</th><th>Hari</th><th>Status</th><th>Sebab</th><th></th></tr>${P.leaves.slice(0, 30).map(l => `<tr><td>${dmy(l.date_from)}${l.date_to !== l.date_from ? " – " + dmy(l.date_to) : ""}</td><td>${LEAVE[l.kind]}</td><td>${+l.days}</td>
        <td><span class="chip ${l.status === "approved" ? "c-on" : l.status === "pending" ? "c-role" : "c-warn"}">${LSTAT[l.status]}</span></td><td>${esc(l.reason || "")}</td>
        <td style="white-space:nowrap">${l.status === "pending" ? `<button class="btn sm" data-lv="approved:${l.id}">Lulus</button> <button class="btn sm" data-lv="rejected:${l.id}">Tolak</button> ` : ""}<button class="btn sm bad" data-del="staff_leaves:${l.id}">✕</button></td></tr>`).join("")}</table></div>` : ""}</div>`;
  }

  function advView() {
    const cur = ym(), active = P.adv.filter(a => a.status === "active");
    const thisMonth = active.reduce((s, a) => cur >= a.start_month && cur <= addMonths(a.start_month, a.months - 1) ? s + +a.monthly : s, 0);
    const owing = active.reduce((s, a) => { const paid = Math.max(0, Math.min(a.months, monthsBetween(a.start_month, cur))); return s + Math.max(0, +a.amount - paid * +a.monthly); }, 0);
    return `<div class="sec"><div class="row"><h4 class="grow">Advance Ansuran</h4><span class="note">Dipotong automatik dalam Kehadiran → Gaji ikut bulan.</span></div>
      <div class="cols"><form class="box" data-add="adv"><b>Tambah Plan</b><p class="note" style="margin:4px 0 0">Ansuran akhir dilaras supaya jumlah tepat.</p>
        <label style="margin-top:8px">Jumlah advance (RM)</label><input class="field" name="amount" type="number" min="1" step="0.01" placeholder="1200" required>
        <label style="margin-top:8px">Bilangan bulan</label><input class="field" name="months" type="number" min="1" max="36" value="1" required>
        <label style="margin-top:8px">Bulan mula potongan</label><input class="field" name="start_month" type="month" value="${cur}" required>
        <label style="margin-top:8px">Potongan bulanan (auto kira)</label><input class="field" name="monthly" readonly placeholder="Akan dikira automatik">
        <label style="margin-top:8px">Catatan</label><textarea class="field" name="note" rows="2" placeholder="Advance kecemasan"></textarea>
        <button class="btn pri" type="submit" style="margin-top:10px;width:100%">Simpan Plan</button></form>
      <div><div class="row"><b class="grow">Senarai Plan</b><span class="note">${P.adv.length} plan</span></div>
        ${active.length ? `<div class="tiles" style="margin:8px 0"><div class="tile t-y"><small>Potongan ${esc(monthName(cur))}</small><b>${rm(thisMonth)}</b></div><div class="tile"><small>Baki tertunggak</small><b>${rm(owing)}</b></div></div>` : ""}
        ${P.adv.length ? P.adv.map(a => { const end = addMonths(a.start_month, a.months - 1), done = Math.max(0, Math.min(a.months, monthsBetween(a.start_month, cur)));
          return `<div class="box" style="margin-top:8px"><div class="row"><b class="grow">${rm(a.amount)} · ${a.months} bulan × ${rm(a.monthly)}</b><span class="chip ${a.status === "active" ? "c-role" : a.status === "done" ? "c-on" : "c-gry"}">${{ active: "Aktif", done: "Selesai", cancelled: "Batal" }[a.status]}</span></div>
            <div class="note">${esc(monthName(a.start_month))} – ${esc(monthName(end))} · ${a.status === "active" ? `${done}/${a.months} bulan dipotong` : ""} ${a.note ? "· " + esc(a.note) : ""}</div>
            <div class="bar"><i style="width:${a.status === "done" ? 100 : Math.round(done / a.months * 100)}%"></i></div>
            <div class="row" style="margin-top:8px">${a.status === "active" ? `<button class="btn sm" data-adv="done:${a.id}">Tanda selesai</button><button class="btn sm" data-adv="cancelled:${a.id}">Batal</button>` : ""}<button class="btn sm bad" data-del="staff_advances:${a.id}">Padam</button></div></div>`; }).join("")
          : `<div class="box" style="margin-top:8px">Belum ada plan advance ansuran untuk staf ini.</div>`}</div></div></div>`;
  }
  const monthsBetween = (a, b) => { const [y1, m1] = a.split("-").map(Number), [y2, m2] = b.split("-").map(Number); return (y2 - y1) * 12 + (m2 - m1) + 1; };

  function histView() {
    return `<div class="sec"><div class="row"><h4 class="grow">Pengalaman Kerja</h4><button class="btn sm" data-tg="hist">+ Tambah</button></div>
      <div class="tw"><table><tr><th>Nama syarikat</th><th>Mula</th><th>Berhenti</th><th>Jawatan</th><th>Gaji (RM)</th><th>Sebab</th><th></th></tr>
      ${P.hist.map(h => `<tr><td>${esc(h.company)}</td><td>${dmy(h.start_date)}</td><td>${dmy(h.end_date)}</td><td>${esc(h.position || "-")}</td><td>${h.salary != null ? rm(h.salary) : "-"}</td><td>${esc(h.reason || "-")}</td><td><button class="btn sm bad" data-del="staff_work_history:${h.id}">✕</button></td></tr>`).join("") || `<tr><td colspan="7" class="note"><i>Tiada rekod pengalaman.</i></td></tr>`}</table></div>
      ${P.tg === "hist" ? `<form class="mini" data-add="hist"><div class="full"><label>Nama syarikat</label><input class="field" name="company" required></div><div><label>Mula</label><input class="field" type="date" name="start_date"></div><div><label>Berhenti</label><input class="field" type="date" name="end_date"></div>
        <div><label>Jawatan</label><input class="field" name="position"></div><div><label>Gaji (RM)</label><input class="field" type="number" min="0" step="0.01" name="salary"></div><div class="full"><label>Sebab berhenti</label><input class="field" name="reason"></div><div class="full"><button class="btn pri sm">Simpan</button></div></form>` : ""}</div>`;
  }
  function chronoView() {
    return `<div class="sec"><div class="row"><h4 class="grow">Kronologi</h4><button class="btn sm" data-tg="chrono">+ Tambah</button></div>
      <div class="tw"><table><tr><th>Tarikh</th><th>Jenis</th><th>Dari</th><th>Kepada</th><th>Sebab</th><th>Dokumen</th><th></th></tr>
      ${P.chrono.map(c => `<tr><td>${dmy(c.event_date)}</td><td>${esc(CHRONO[c.kind] || c.kind)}</td><td>${esc(c.from_val || "-")}</td><td>${esc(c.to_val || "-")}</td><td>${esc(c.reason || "-")}</td>
        <td>${c.doc_path && P.urls[c.doc_path] ? `<a href="${esc(P.urls[c.doc_path])}" target="_blank" style="color:var(--pri)">Buka</a>` : "-"}</td><td><button class="btn sm bad" data-del="staff_chronology:${c.id}">✕</button></td></tr>`).join("") || `<tr><td colspan="7" class="note"><i>Tiada rekod kronologi.</i></td></tr>`}</table></div>
      ${P.tg === "chrono" ? `<form class="mini" data-add="chrono"><div><label>Tarikh</label><input class="field" type="date" name="event_date" value="${today()}" required></div><div><label>Jenis</label><select class="field" name="kind">${Object.entries(CHRONO).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div>
        <div><label>Dari</label><input class="field" name="from_val" placeholder="cth RM1500 / Sales"></div><div><label>Kepada</label><input class="field" name="to_val" placeholder="cth RM1700 / Supervisor"></div><div class="full"><label>Sebab</label><input class="field" name="reason"></div>
        <div class="full"><label>Dokumen (pilihan)</label><input class="field" type="file" name="doc" accept="image/*,application/pdf"></div><div class="full"><button class="btn pri sm">Simpan</button></div></form>` : ""}</div>`;
  }
  function docsExtra() {
    const ic = P.hr.ic_photo_path && P.urls[P.hr.ic_photo_path];
    return `<div class="box" style="margin-top:10px"><b>Ikrar:</b> ${PLEDGE}${P.hr.pledge_signed_at ? `<div class="note" style="margin-top:4px">Ditandatangani ${dmy(P.hr.pledge_signed_at)} oleh ${esc(P.hr.pledge_signer || "-")}</div>` : `<div style="margin-top:6px"><button class="btn sm" data-a="pledge">Tandakan ikrar sudah ditandatangani</button></div>`}</div>
      <div class="box" style="margin-top:10px;text-align:center"><b>🪪 Salinan IC</b>${ic ? (/\.pdf$/i.test(P.hr.ic_photo_path) ? `<p><a href="${esc(ic)}" target="_blank" style="color:var(--pri)">Buka PDF</a></p>` : `<img class="docimg" style="margin:8px auto" src="${esc(ic)}" alt="IC">`) : `<p class="note">Belum dimuat naik.</p>`}
        <div class="row" style="justify-content:center"><label class="btn sm pri" style="margin:0;text-transform:none;letter-spacing:0;color:var(--pri-fg)">${ic ? "Muat naik semula IC" : "Muat naik IC"}<input type="file" accept="image/*,application/pdf" data-up="ic_photo_path" hidden></label></div></div>`;
  }

  function render() {
    if (!P.hr) { app.innerHTML = `<div class="empty">Memuatkan profil…</div>`; return; }
    const payNote = `<p class="note full" style="margin:0">Jenis gaji, kadar dan elaun dikongsi dengan modul Kehadiran (kiraan gaji).</p>`;
    app.innerHTML = `<div class="pf">${header()}${P.err ? `<p class="msg err">${esc(P.err)}</p>` : ""}<p class="msg ${P.cls}" id="pmsg">${esc(P.msg)}</p>
      ${photoBox()}${section("personal")}${section("job", `<div class="kv"><div><span>Peranan sistem</span><span>${esc({ owner: "Owner", operations: "Operations", sales_advisor: "Sales Advisor" }[staff.role] || staff.role)}</span></div><div><span>Tempoh khidmat</span><span>${esc(serviceText(P.hr.join_date))}</span></div></div>`)}
      ${section("contract")}${section("payroll", "", payNote)}${advView()}${leaveView()}${histView()}${chronoView()}${section("docs", docsExtra())}</div>`;
    bind();
  }

  async function saveHr(patch) {
    const row = { ...P.hr, ...patch, staff_id: id, updated_at: new Date().toISOString(), updated_by: me.id || null };
    const { data, error } = await client.from("staff_hr").upsert(row, { onConflict: "staff_id" }).select().single();
    if (error) throw error; P.hr = data;
  }
  async function upload(file, name) {
    file = await shrink(file); if (file.size > 5242880) throw new Error("Fail melebihi 5MB.");
    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/${name}-${Date.now()}.${ext}`;
    const { error } = await client.storage.from("staff-docs").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
    if (error) throw error; return path;
  }
  const run = async (fn, okMsg) => { try { say("Sila tunggu…"); await fn(); P.msg = okMsg; P.cls = "ok"; await signUrls(); render(); } catch (e) { say(e?.message || String(e), "err"); } };

  function bind() {
    app.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === "back") return onBack();
      if (a === "cancel") { P.edit = null; render(); }
      if (a === "pdf") printPdf();
      if (a === "pledge") run(() => saveHr({ pledge_signed_at: new Date().toISOString(), pledge_signer: P.hr.pledge_signer || staff.full_name, pledge_signer_ic: P.hr.pledge_signer_ic || P.hr.ic_no }), "Ikrar direkodkan.");
    });
    app.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { P.edit = b.dataset.ed; P.msg = ""; render(); app.querySelector(`[data-sf="${P.edit}"]`)?.scrollIntoView({ block: "nearest" }); });
    app.querySelectorAll("[data-tg]").forEach(b => b.onclick = () => { P.tg = P.tg === b.dataset.tg ? null : b.dataset.tg; render(); });
    const ic = app.querySelector('[data-sf="personal"] [name=ic_no]');
    if (ic) ic.onchange = () => { const r = fromIC(ic.value), f = ic.form; if (!r) return; if (!f.dob.value) f.dob.value = r.dob; if (!f.gender.value) f.gender.value = r.gender; };
    app.querySelectorAll("[data-sf]").forEach(f => f.onsubmit = ev => {
      ev.preventDefault(); const key = f.dataset.sf, hr = {}, pay = {};
      F[key].forEach(([k, , type, , src]) => { const el = f.elements[k]; if (!el) return; let v;
        if (type === "bool") v = el.checked; else if (["num", "dec", "money"].includes(type)) v = el.value === "" ? null : +el.value; else v = el.value.trim() === "" ? null : el.value.trim();
        if (k === "ic_no" && v) v = v.replace(/[^\dA-Za-z]/g, "");
        if (["children", "dependents", "al_extra", "al_carry"].includes(k) && v == null) v = 0;
        (src === "pay" ? pay : hr)[k] = v; });
      if (hr.category === null) hr.category = "staff_biasa"; if (hr.employment_type === null) hr.employment_type = "permanent"; if (hr.contract_status === null) hr.contract_status = "active";
      if (hr.statutory_mode === null) hr.statutory_mode = "default"; if (hr.socso_type === null) hr.socso_type = "jenis1";
      run(async () => {
        if (Object.keys(pay).length) {
          const base = P.pay || { pay_type: "monthly", rate: 0, ot_rate: 0, late_mode: "none", late_rate: 0, monthly_workdays: 26, allowance: 0 };
          const v = { ...base, staff_id: id, pay_type: pay.pay_type || base.pay_type, rate: pay.rate ?? 0, allowance: pay.allowance ?? 0, updated_at: new Date().toISOString() };
          const { data, error } = await client.from("staff_pay").upsert(v, { onConflict: "staff_id" }).select().single(); if (error) throw error; P.pay = data;
        }
        await saveHr(hr); P.edit = null;
      }, TITLE[key] + " disimpan.");
    });
    app.querySelectorAll("[data-up]").forEach(i => i.onchange = () => { const file = i.files[0]; if (!file) return; const k = i.dataset.up;
      run(async () => { const p = await upload(file, k === "photo_path" ? "photo" : "ic"); const old = P.hr[k]; await saveHr({ [k]: p }); if (old) client.storage.from("staff-docs").remove([old]).catch(() => {}); }, "Fail dimuat naik."); });
    app.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { const k = b.dataset.rm, old = P.hr[k]; if (!confirm("Buang gambar ini?")) return;
      run(async () => { await saveHr({ [k]: null }); if (old) await client.storage.from("staff-docs").remove([old]); }, "Gambar dibuang."); });
    app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { const [t, rid] = b.dataset.del.split(":"); if (!confirm("Padam rekod ini?")) return;
      run(async () => { const { error } = await client.from(t).delete().eq("id", rid); if (error) throw error; await reloadLists(); }, "Rekod dipadam."); });
    app.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { const [s, rid] = b.dataset.lv.split(":");
      run(async () => { const { error } = await client.from("staff_leaves").update({ status: s }).eq("id", rid); if (error) throw error; await reloadLists(); }, s === "approved" ? "Cuti diluluskan." : "Cuti ditolak."); });
    app.querySelectorAll("[data-adv]").forEach(b => b.onclick = () => { const [s, rid] = b.dataset.adv.split(":");
      run(async () => { const { error } = await client.from("staff_advances").update({ status: s }).eq("id", rid); if (error) throw error; await reloadLists(); }, "Plan dikemas kini."); });
    const af = app.querySelector('[data-add="adv"]');
    if (af) { const calc = () => { const a = +af.amount.value, m = +af.months.value; af.monthly.value = a > 0 && m > 0 ? (a / m).toFixed(2) : ""; }; af.amount.oninput = af.months.oninput = calc; }
    app.querySelectorAll("[data-add]").forEach(f => f.onsubmit = ev => {
      ev.preventDefault(); const k = f.dataset.add, d = Object.fromEntries(new FormData(f)); delete d.doc;
      Object.keys(d).forEach(x => { if (typeof d[x] === "string") d[x] = d[x].trim() || null; });
      run(async () => {
        let t, row = { ...d, staff_id: id };
        if (k === "adv") { const a = +d.amount, m = +d.months; if (!(a > 0 && m >= 1)) throw new Error("Masukkan jumlah advance."); t = "staff_advances"; row = { staff_id: id, amount: a, months: m, start_month: d.start_month, monthly: +(a / m).toFixed(2), note: d.note, created_by: me.id || null }; }
        if (k === "leave") { if (d.date_to < d.date_from) throw new Error("Tarikh hingga sebelum tarikh dari."); t = "staff_leaves"; row.days = +d.days; row.created_by = me.id || null; }
        if (k === "hist") { t = "staff_work_history"; row.salary = d.salary == null ? null : +d.salary; }
        if (k === "chrono") { t = "staff_chronology"; row.created_by = me.id || null; const file = f.elements.doc?.files?.[0]; if (file) row.doc_path = await upload(file, "kronologi"); }
        const { error } = await client.from(t).insert(row); if (error) throw error;
        if (k === "chrono" && d.kind === "kenaikan_gaji" && d.to_val && /^\s*(RM)?\s*[\d.,]+\s*$/i.test(d.to_val) && P.pay && confirm("Kemas kini kadar gaji kepada " + d.to_val + "?")) {
          const r = +d.to_val.replace(/[^\d.]/g, ""); const { data } = await client.from("staff_pay").update({ rate: r, updated_at: new Date().toISOString() }).eq("staff_id", id).select().single(); if (data) P.pay = data; }
        P.tg = null; await reloadLists();
      }, "Disimpan.");
    });
  }
  async function reloadLists() {
    const [h, c, a, l] = await Promise.all([client.from("staff_work_history").select("*").eq("staff_id", id).order("start_date", { ascending: false }),
      client.from("staff_chronology").select("*").eq("staff_id", id).order("event_date", { ascending: false }),
      client.from("staff_advances").select("*").eq("staff_id", id).order("created_at", { ascending: false }),
      client.from("staff_leaves").select("*").eq("staff_id", id).order("date_from", { ascending: false })]);
    P.hist = h.data || []; P.chrono = c.data || []; P.adv = a.data || []; P.leaves = l.data || [];
  }

  function printPdf() {
    const h = P.hr, ph = h.photo_path && P.urls[h.photo_path], e = leaveEntitle(h);
    const kv = key => `<h3>${TITLE[key]}</h3><table>${F[key].map(f => `<tr><th>${esc(f[1].replace(/ \(.*\)$/, ""))}</th><td>${esc(show(f))}</td></tr>`).join("")}</table>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Profil Staf - ${esc(staff.full_name)}</title><style>
      body{font:12px/1.45 -apple-system,Segoe UI,Arial,sans-serif;color:#111;margin:24px}h1{font-size:18px;margin:0}h3{font-size:13px;margin:16px 0 6px;border-bottom:2px solid #c99a06;padding-bottom:3px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 7px;text-align:left;vertical-align:top}th{background:#f6f3ea;width:38%;font-weight:600}
      .top{display:flex;gap:14px;align-items:center;border-bottom:3px solid #111;padding-bottom:10px}.top img{width:80px;height:80px;border-radius:8px;object-fit:cover}.m{color:#555}
      .two{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}@media print{body{margin:10mm}}</style></head><body>
      <div class="top">${ph ? `<img src="${esc(ph)}">` : ""}<div><div class="m">ABE DIN AUTO · PROFIL STAF</div><h1>${esc((staff.full_name || "").toUpperCase())}</h1>
      <div class="m">IC: ${esc(h.ic_no || "-")} · Staff ID: ${esc(h.staff_code || "-")} · ${esc(h.position || "")} · ${esc(CATEGORY[h.category] || "")} · ${esc(EMP_TYPE[h.employment_type] || "")}</div></div></div>
      <div class="two"><div>${kv("personal")}</div><div>${kv("job")}${kv("contract")}${kv("payroll")}</div></div>
      <h3>Cuti ${new Date().getFullYear()}</h3><table><tr><th>Tahunan</th><td>${e.annual} hari</td></tr><tr><th>Sakit (MC)</th><td>${e.mc} hari</td></tr><tr><th>Hospitalisasi</th><td>${e.hosp} hari</td></tr></table>
      <h3>Pengalaman Kerja</h3><table><tr><th>Syarikat</th><th>Tempoh</th><th>Jawatan</th><th>Sebab</th></tr>${P.hist.map(x => `<tr><td>${esc(x.company)}</td><td>${dmy(x.start_date)} – ${dmy(x.end_date)}</td><td>${esc(x.position || "")}</td><td>${esc(x.reason || "")}</td></tr>`).join("") || `<tr><td colspan="4">Tiada rekod</td></tr>`}</table>
      <h3>Kronologi</h3><table><tr><th>Tarikh</th><th>Jenis</th><th>Dari → Kepada</th><th>Sebab</th></tr>${P.chrono.map(x => `<tr><td>${dmy(x.event_date)}</td><td>${esc(CHRONO[x.kind])}</td><td>${esc(x.from_val || "-")} → ${esc(x.to_val || "-")}</td><td>${esc(x.reason || "")}</td></tr>`).join("") || `<tr><td colspan="4">Tiada rekod</td></tr>`}</table>
      ${kv("docs")}<p style="margin-top:10px"><b>Ikrar:</b> ${PLEDGE}</p><p class="m">Dicetak ${new Date().toLocaleString("ms-MY")}</p>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
    const w = window.open("", "_blank"); if (!w) return say("Benarkan pop-up untuk cetak PDF.", "err"); w.document.open(); w.document.write(html); w.document.close();
  }

  render(); load();
}
