// Abe Din Auto – Pendaftaran Staf (Tetapan, Owner sahaja).
// Link pendaftaran (buka/tutup, tukar kod) dan senarai permohonan untuk diluluskan. Lihat V74_DAFTAR_STAF.sql.
const CSS = `
:host{display:block;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;--pri:#e8b10b;--pri-fg:#141000;
  --f:Inter,-apple-system,"Segoe UI",system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 var(--f);background:#0a0a09;border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px;margin-top:14px}
h3{margin:0;font-size:18px;font-weight:800}h4{margin:0;font-size:15px}
.kick{font-size:11px;letter-spacing:.14em;color:var(--pri);font-weight:700}
p{margin:0}.mute{color:var(--mute);font-size:13.5px}
button,input,select{font:inherit;color:inherit}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.grow{flex:1;min-width:0}
.btn{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:9px 13px;font-weight:700;font-size:14px;cursor:pointer;text-decoration:none;color:var(--fg);display:inline-block}
.btn.pri{background:var(--pri);border-color:var(--pri);color:var(--pri-fg)}.btn.bad{color:#ffaaa4;border-color:#6b2420}.btn.wa{background:#1f7a45;border-color:#1f7a45;color:#fff}
.btn:disabled{opacity:.5}
.link{background:var(--soft);border:1px dashed #5a4a14;border-radius:10px;padding:10px 12px;font-size:14px;word-break:break-all;font-family:ui-monospace,Menlo,monospace}
.chip{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:700}
.c-on{background:#12321f;color:#8ce3ad}.c-off{background:#2c2a25;color:#cfc8b6}.c-new{background:#3a2f0a;color:#ffd257}.c-bad{background:#3a1513;color:#ffaaa4}
.item{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px}
.top{display:flex;gap:12px;align-items:center}
.ava{width:52px;height:52px;border-radius:50%;object-fit:cover;background:#3a2f0a;color:#ffd257;display:flex;align-items:center;justify-content:center;font-weight:800;flex:0 0 52px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}.kv span:nth-child(odd){color:var(--mute)}
.docs{display:flex;gap:10px;flex-wrap:wrap}.docs img{width:120px;height:90px;object-fit:cover;border-radius:10px;border:1px solid var(--line);cursor:zoom-in;background:#222}
.field{border:1px solid var(--line);background:var(--soft);border-radius:10px;padding:9px 11px;font-size:15px;color:var(--fg)}
.tabs{display:flex;gap:6px;flex-wrap:wrap}.tab{border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer}
.tab.on{background:var(--pri);color:var(--pri-fg);border-color:var(--pri)}
.msg{font-size:14px}.msg.err{color:#ffaaa4}.msg.ok{color:#8ce3ad}
.lb{position:fixed;inset:0;background:#000d;z-index:60;display:flex;align-items:center;justify-content:center;padding:16px}.lb img{max-width:100%;max-height:100%;border-radius:12px}
`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = s => s ? new Date(s).toLocaleString("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
const fmtD = s => s ? new Date(s + "T00:00:00").toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" }) : "-";
const ROLES = { operations: "Operations (staf)", sales_advisor: "Sales Advisor", owner: "Owner" };
const BASE = "https://abedinauto.my/daftar-staf.html?k=";

export function mountStaffReg(host, ctx) {
  const client = ctx.client;
  const root = host.shadowRoot || host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>${CSS}</style><div class="shell" id="app"></div>`;
  const app = root.getElementById("app");
  const S = { link: null, rows: [], urls: {}, tab: "pending", err: "", msg: "", busy: false };

  async function load() {
    try {
      const [l, r] = await Promise.all([
        client.from("staff_reg_link").select("*").eq("id", 1).maybeSingle(),
        client.from("staff_registrations").select("*").order("created_at", { ascending: false }).limit(300),
      ]);
      if (l.error) throw l.error; if (r.error) throw r.error;
      S.link = l.data; S.rows = r.data || []; S.err = "";
      const paths = S.rows.flatMap(x => [x.photo_path, x.ic_photo_path]).filter(p => p && !S.urls[p]);
      if (paths.length) { const { data } = await client.storage.from("staff-docs").createSignedUrls(paths, 3600); (data || []).forEach(d => { if (d.signedUrl) S.urls[d.path] = d.signedUrl; }); }
    } catch (e) { S.err = /staff_reg|does not exist|schema cache/i.test(e.message || "") ? "Pangkalan data pendaftaran belum dipasang (V74)." : (e.message || String(e)); }
    render();
  }
  const url = () => S.link ? BASE + S.link.token : "";
  const waText = () => `Assalamualaikum. Sila daftar sebagai staf Abe Din Auto melalui link ini:\n${url()}\n\nIsi maklumat dan cipta kata laluan sendiri. Akaun boleh digunakan selepas diluluskan.`;

  function card(x) {
    const ini = (x.full_name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const st = x.status === "pending" ? `<span class="chip c-new">Menunggu</span>` : x.status === "approved" ? `<span class="chip c-on">Diluluskan</span>` : `<span class="chip c-bad">Ditolak</span>`;
    const kv = [["Emel", x.email], ["Telefon", x.phone], ["No. IC", x.ic_no], ["Jantina", x.gender === "male" ? "Lelaki" : x.gender === "female" ? "Perempuan" : "-"], ["Tarikh lahir", fmtD(x.dob)],
      ["Alamat", x.address], ["Jawatan dipohon", x.position_applied], ["Pendidikan", x.education], ["Waris", [x.emergency_name, x.emergency_relation && `(${x.emergency_relation})`, x.emergency_phone].filter(Boolean).join(" ")],
      ["Bank", [x.bank_name, x.bank_account].filter(Boolean).join(" · ")], ["KWSP / PERKESO", [x.epf_no, x.socso_no].filter(Boolean).join(" / ")]];
    return `<div class="item"><div class="top">${x.photo_path && S.urls[x.photo_path] ? `<img class="ava" src="${esc(S.urls[x.photo_path])}" alt="">` : `<span class="ava">${esc(ini)}</span>`}
      <div class="grow"><h4>${esc(x.full_name)}</h4><span class="mute">Daftar ${fmt(x.created_at)}</span></div>${st}</div>
      <div class="kv">${kv.map(([k, v]) => `<span>${k}</span><span>${esc(v || "-")}</span>`).join("")}</div>
      ${x.photo_path || x.ic_photo_path ? `<div class="docs">${[x.photo_path, x.ic_photo_path].filter(Boolean).map(p => `<img src="${esc(S.urls[p] || "")}" data-zoom="${esc(p)}" alt="Dokumen">`).join("")}</div>` : `<span class="mute">Tiada gambar / IC dimuat naik.</span>`}
      ${x.review_note ? `<span class="mute">Catatan: ${esc(x.review_note)}</span>` : ""}
      ${x.status === "pending" ? `<div class="row"><select class="field" data-role="${esc(x.id)}">${Object.entries(ROLES).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
        <button class="btn pri" data-ok="${esc(x.id)}">✓ Luluskan</button><button class="btn bad" data-no="${esc(x.id)}">Tolak</button></div>` : ""}
      ${x.status === "rejected" ? `<div><button class="btn" data-ok="${esc(x.id)}">Luluskan juga</button></div>` : ""}</div>`;
  }
  function render() {
    const pend = S.rows.filter(x => x.status === "pending");
    const list = S.tab === "pending" ? pend : S.rows.filter(x => x.status !== "pending");
    app.innerHTML = `<div><div class="kick">STAF BAHARU</div><h3>Pendaftaran Staf ${pend.length ? `<span class="chip c-new">${pend.length} menunggu</span>` : ""}</h3></div>
      ${S.err ? `<p class="msg err">${esc(S.err)}</p>` : ""}
      ${S.link ? `<p class="mute">Hantar link ini kepada staf baru. Mereka cipta akaun sendiri dan isi maklumat peribadi; maklumat masuk terus ke Profil HR selepas anda luluskan.</p>
      <div class="row"><span class="chip ${S.link.enabled ? "c-on" : "c-off"}">${S.link.enabled ? "Link dibuka" : "Link ditutup"}</span></div>
      ${S.link.enabled ? `<div class="link">${esc(url())}</div>
      <div class="row"><button class="btn pri" data-act="copy">Salin link</button><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText())}">Kongsi WhatsApp</a><a class="btn" target="_blank" rel="noopener" href="${esc(url())}">Buka</a></div>` : ""}
      <div class="row"><button class="btn" data-act="toggle">${S.link.enabled ? "Tutup link" : "Buka link"}</button><button class="btn" data-act="newtoken">Tukar kod link</button></div>` : ""}
      <p class="msg ${S.msg.startsWith("!") ? "err" : "ok"}">${esc(S.msg.replace(/^!/, ""))}</p>
      <div class="tabs"><button class="tab ${S.tab === "pending" ? "on" : ""}" data-tab="pending">Menunggu (${pend.length})</button><button class="tab ${S.tab === "done" ? "on" : ""}" data-tab="done">Selesai (${S.rows.length - pend.length})</button></div>
      ${list.map(card).join("") || `<p class="mute" style="text-align:center;padding:12px">${S.tab === "pending" ? "Tiada pendaftaran baharu." : "Belum ada rekod."}</p>`}`;
  }
  async function run(fn, ok) { if (S.busy) return; S.busy = true; S.msg = ""; try { await fn(); S.msg = ok || ""; } catch (e) { S.msg = "!" + (e.message || String(e)); } S.busy = false; await load(); }

  app.addEventListener("click", async e => {
    const t = e.target.closest("button,[data-zoom]"); if (!t) return;
    if (t.dataset.zoom) { const d = document.createElement("div"); d.className = "lb"; d.innerHTML = `<img src="${esc(S.urls[t.dataset.zoom] || "")}" alt="">`; d.onclick = () => d.remove(); root.appendChild(d); return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; render(); return; }
    const a = t.dataset.act;
    if (a === "copy") { try { await navigator.clipboard.writeText(url()); S.msg = "Link disalin."; } catch (_) { S.msg = "!Salin manual: " + url(); } render(); return; }
    if (a === "toggle") return run(async () => { const { error } = await client.rpc("staff_reg_link_set", { p_enabled: !S.link.enabled, p_new_token: false }); if (error) throw error; }, S.link.enabled ? "Link ditutup. Link lama tidak boleh digunakan." : "Link dibuka.");
    if (a === "newtoken") { if (!confirm("Tukar kod link? Link lama akan terus tidak sah.")) return; return run(async () => { const { error } = await client.rpc("staff_reg_link_set", { p_enabled: true, p_new_token: true }); if (error) throw error; }, "Kod link ditukar. Kongsi link baharu."); }
    if (t.dataset.ok) {
      const id = t.dataset.ok, x = S.rows.find(r => r.id === id), sel = root.querySelector(`[data-role="${id}"]`);
      const role = sel ? sel.value : (prompt("Peranan: operations / sales_advisor / owner", "operations") || "").trim();
      if (!ROLES[role]) return;
      if (!confirm(`Luluskan ${x?.full_name} sebagai ${ROLES[role]}? Akaun terus boleh log masuk.`)) return;
      return run(async () => { const { error } = await client.rpc("staff_reg_decide", { p_id: id, p_approve: true, p_role: role, p_note: null }); if (error) throw error; },
        `${x?.full_name} diluluskan. Maklumat disalin ke Profil HR; tetapkan akses menu dan gaji di bawah jika perlu.`);
    }
    if (t.dataset.no) {
      const x = S.rows.find(r => r.id === t.dataset.no); const note = prompt(`Sebab tolak ${x?.full_name}? (pilihan)`, ""); if (note === null) return;
      return run(async () => { const { error } = await client.rpc("staff_reg_decide", { p_id: t.dataset.no, p_approve: false, p_role: null, p_note: note || null }); if (error) throw error; }, "Pendaftaran ditolak.");
    }
  });
  render(); load();
}
