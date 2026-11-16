// Abe Din Auto – Urus Staf (Tetapan → Staf). Hanya Owner.
// Cipta akaun log masuk baharu melalui Supabase Auth (klien sementara, sesi Owner tidak terjejas),
// kemudian aktifkan profil melalui RPC staff_save. Senarai melalui RPC staff_list (lihat V66_STAFF_MIGRATION.sql).
// UI dalam Shadow DOM supaya tidak bercampur dengan CSS sistem sedia ada.
const CSS = `
:host{display:block;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;--pri:#e8b10b;--pri-fg:#141000;
  --ok:#3fae6b;--bad:#e0473f;--f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f);background:#0a0a09;border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;margin-top:14px}
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
`;
const ROLES = { operations: "Operations (staf)", sales_advisor: "Sales Advisor", owner: "Owner" };
const ROLE_HINT = { operations: "Lalai: semua menu kecuali Jualan, Pelanggan dan Laporan. Boleh ubah di bawah.", sales_advisor: "Lalai: semua menu kecuali Runner. Boleh ubah di bawah.", owner: "Akses penuh termasuk sahkan pemeriksaan, modal dan urus staf." };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => { if (!s) return "belum pernah"; const d = new Date(s); return isNaN(d) ? "-" : d.toLocaleString("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
const MENUS = [["inventory","Inventori"],["suppliers","Pembekal"],["pemeriksaan","Pemeriksaan"],["runner","Runner"],["sales","Jualan"],["customers","Pelanggan"],["applications","Permohonan"],["sewa","Sewa"],["reports","Laporan"]];
function defPerm(role, page) { if (role === "owner") return true; if (role === "operations" && ["sales", "customers", "reports"].includes(page)) return false; if (page === "runner" && role !== "operations") return false; return true; }
function canPage(u, page) { if (u.role === "owner") return true; const v = u.permissions && typeof u.permissions === "object" ? u.permissions[page] : undefined; return typeof v === "boolean" ? v : defPerm(u.role, page); }
const SUPA_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export function mountStaff(host, ctx) {
  const client = ctx.client, me = ctx.profile || {};
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><section class="shell" id="app"></section>`;
  const app = root.getElementById("app");
  const S = { rows: null, err: "", mode: null, edit: null, msg: "", msgCls: "", share: "" };
  const $ = s => root.querySelector(s);

  async function load() {
    const { data, error } = await client.rpc("staff_list");
    if (error) {
      S.rows = [];
      S.err = /staff_list|function/i.test(error.message) && /not find|does not exist|schema cache/i.test(error.message)
        ? "Fungsi staf belum dipasang. Jalankan V66_STAFF_MIGRATION.sql dalam Supabase SQL Editor."
        : "Gagal memuatkan staf: " + error.message;
    } else { S.rows = data || []; S.err = ""; }
    render();
  }

  function render() {
    const rows = S.rows;
    app.innerHTML = `<div class="row"><div class="grow"><div class="kick">TETAPAN</div><h3>Staf &amp; Akses</h3></div>
        ${S.mode ? "" : `<button class="btn pri" data-a="new">+ Tambah staf</button>`}</div>
      <p class="mute">Setiap staf log masuk dengan emel dan kata laluan sendiri. Pautan kerja: <b>abedinauto.my/app.html?page=pemeriksaan</b></p>
      ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ""}
      ${S.mode ? formView() : ""}
      ${S.share ? `<div class="share" id="share">${esc(S.share)}</div><div class="row"><button class="btn sm" data-a="copy">Salin untuk WhatsApp</button><button class="btn sm" data-a="hide">Tutup</button></div>` : ""}
      <p class="msg ${S.msgCls}" id="msg">${esc(S.msg)}</p>
      <div class="list">${rows === null ? `<div class="empty">Memuatkan…</div>` : rows.map(item).join("") || `<div class="empty">Tiada akaun.</div>`}</div>`;
    bind();
  }

  function item(u) {
    const self = u.id === me.id;
    return `<div class="item"><div class="who"><b>${esc(u.full_name || "(tiada nama)")}</b>${self ? ` <span class="mute">· anda</span>` : ""}
        <small>${esc(u.email || "-")}</small>
        <div style="margin-top:5px"><span class="chip ${u.enabled ? "c-on" : "c-off"}">${u.enabled ? "Aktif" : "Nyahaktif"}</span><span class="chip c-role">${esc(ROLES[u.role] || u.role || "-")}</span>${u.email_confirmed === false ? `<span class="chip c-warn">Emel belum disahkan</span>` : ""}</div>
        <div class="mods">${u.role === "owner" ? "<b>Semua menu</b>" : "Menu: <b>" + (MENUS.filter(([k]) => canPage(u, k)).map(([, t]) => t).join(", ") || "Dashboard sahaja") + "</b>"}</div>
        <small>Log masuk terakhir: ${fmt(u.last_sign_in_at)}</small></div>
      ${self ? "" : `<div class="row"><button class="btn sm" data-edit="${esc(u.id)}">Edit</button><button class="btn sm ${u.enabled ? "bad" : "pri"}" data-tog="${esc(u.id)}">${u.enabled ? "Nyahaktif" : "Aktifkan"}</button></div>`}</div>`;
  }

  function formView() {
    const e = S.edit || {}, isNew = S.mode === "new", link = S.mode === "link";
    return `<form class="form" id="f">
      <div class="full"><b>${isNew ? "Tambah staf baharu" : link ? "Sambung akaun sedia ada" : "Edit staf"}</b>
        <p class="mute">${isNew ? "Akaun log masuk dicipta terus. Beri emel dan kata laluan ini kepada staf." : link ? "Untuk akaun yang sudah dicipta dalam Supabase Auth atau sudah daftar sendiri." : ""}</p></div>
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
      <p class="mute" style="margin-top:6px">Dashboard dan Tetapan sentiasa boleh dibuka. Menu yang ditutup disorok daripada staf ini.</p>`;
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
        S.share = `Akaun Abe Din Auto anda:\nPautan: https://abedinauto.my/app.html?page=pemeriksaan\nEmel: ${email}\nKata laluan: ${pw}\n${needConfirm ? "\nSila sahkan emel anda dahulu (semak inbox/spam) sebelum log masuk.\n" : ""}Tukar kata laluan selepas log masuk pertama jika perlu.`;
        S.mode = null; say(`Akaun ${nama} dicipta${needConfirm ? ". Staf perlu sahkan emel dahulu (Supabase hantar emel pengesahan)." : " dan diaktifkan."}`, "ok");
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
}
