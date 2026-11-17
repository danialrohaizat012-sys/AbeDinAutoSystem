// Abe Din Auto – paparan & cetakan slip gaji (dikongsi oleh Profil Saya dan Profil staf Owner).
// Data dari computeSlip() dalam kehadiran.js.
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const rm = n => "RM" + (Math.round((+n || 0) * 100) / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const monthName = s => { if (!s) return "-"; const [y, m] = s.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("ms-MY", { month: "long", year: "numeric" }); };

export function slipHtml(slip, opts = {}) {
  const { c, lines, rows, stats } = slip;
  if (!c.hasPay) return `<div class="warn">Tetapan gaji belum dibuat oleh Owner.</div>`;
  const earn = lines.filter(l => l[2] >= 0), ded = lines.filter(l => l[2] < 0);
  const tot = a => a.reduce((t, l) => t + l[2], 0);
  const row = l => `<tr><td>${esc(l[0])}${l[1] ? `<div class="note">${esc(l[1])}</div>` : ""}</td><td style="text-align:right;white-space:nowrap">${l[2] < 0 ? "−" + rm(-l[2]) : rm(l[2])}</td></tr>`;
  return `<div class="tiles"><div class="tile"><small>Hadir</small><b>${stats.present} hari</b></div><div class="tile"><small>Jam kerja</small><b>${esc(stats.worked)}</b></div>
      <div class="tile ${stats.absent ? "t-p" : ""}"><small>Tidak hadir</small><b>${stats.absent} hari</b></div><div class="tile ${stats.late ? "t-y" : ""}"><small>Lewat</small><b>${stats.late} kali</b><small>${esc(stats.lateMin)}</small></div>
      <div class="tile t-b"><small>OT</small><b>${esc(stats.ot)}</b></div><div class="tile t-g"><small>Cuti</small><b>${stats.paidLeave + stats.unpaidLeave} hari</b><small>${stats.unpaidLeave ? stats.unpaidLeave + " tanpa gaji" : "berbayar"}</small></div></div>
    <div class="cols" style="margin-top:10px;grid-template-columns:1fr 1fr"><div class="box"><b>Pendapatan</b><table>${earn.map(row).join("")}<tr><th>Jumlah</th><th style="text-align:right">${rm(tot(earn))}</th></tr></table></div>
      <div class="box"><b>Potongan</b><table>${ded.map(row).join("") || `<tr><td class="note">Tiada potongan</td><td></td></tr>`}<tr><th>Jumlah</th><th style="text-align:right">−${rm(-tot(ded))}</th></tr></table></div></div>
    <div class="box" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:18px"><b>Gaji bersih</b><b style="color:var(--pri)">${rm(c.net)}</b></div>
    <p class="note" style="margin-top:6px">Anggaran dari rekod kehadiran. KWSP, PERKESO dan PCB belum ditolak dalam kiraan ini. Jumlah muktamad disahkan oleh Owner.</p>
    ${opts.days === false ? "" : `<details style="margin-top:8px"><summary style="cursor:pointer;color:var(--pri);font-weight:700">Butiran harian (${rows.length})</summary><div class="tw"><table><tr><th>Hari</th><th>Masuk</th><th>Balik</th><th>Jam</th><th>Catatan</th></tr>
      ${rows.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(r.in)}</td><td>${esc(r.out)}</td><td>${esc(r.worked)}</td><td>${esc(r.note)}</td></tr>`).join("")}</table></div></details>`}`;
}

export function printSlip(slip, info) {
  const { c, lines, rows, stats } = slip, earn = lines.filter(l => l[2] >= 0), ded = lines.filter(l => l[2] < 0);
  const tr = l => `<tr><td>${esc(l[0])}${l[1] ? `<br><small>${esc(l[1])}</small>` : ""}</td><td class="n">${rm(Math.abs(l[2]))}</td></tr>`;
  const sum = a => rm(Math.abs(a.reduce((t, l) => t + l[2], 0)));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Slip Gaji ${esc(info.name)} ${esc(info.month)}</title><style>
    body{font:12px/1.45 -apple-system,Segoe UI,Arial,sans-serif;color:#111;margin:24px}h1{font-size:17px;margin:0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:5px 7px;text-align:left;vertical-align:top}
    th{background:#f6f3ea}.n{text-align:right;white-space:nowrap}small{color:#666}.top{display:flex;justify-content:space-between;border-bottom:3px solid #111;padding-bottom:8px;margin-bottom:10px}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}.net{font-size:16px;font-weight:800;border:2px solid #c99a06;padding:8px 10px;display:flex;justify-content:space-between}@media print{body{margin:10mm}}</style></head><body>
    <div class="top"><div><h1>ABE DIN AUTO</h1><small>926-D Kg Kenali, Kubang Kerian, 16150 Kota Bharu, Kelantan</small></div><div style="text-align:right"><b>SLIP GAJI</b><br>${esc(monthName(info.month))}</div></div>
    <table><tr><th>Nama</th><td>${esc(info.name)}</td><th>No. IC</th><td>${esc(info.ic || "-")}</td></tr><tr><th>Staff ID</th><td>${esc(info.code || "-")}</td><th>Jawatan</th><td>${esc(info.position || "-")}</td></tr>
      <tr><th>Bank</th><td>${esc(info.bank || "-")}</td><th>No. KWSP / PERKESO</th><td>${esc(info.epf || "-")} / ${esc(info.socso || "-")}</td></tr>
      <tr><th>Hadir</th><td>${stats.present} hari · ${esc(stats.worked)}</td><th>Tidak hadir / Cuti</th><td>${stats.absent} hari / ${stats.paidLeave + stats.unpaidLeave} hari</td></tr></table>
    <div class="two"><table><tr><th>Pendapatan</th><th class="n">RM</th></tr>${earn.map(tr).join("")}<tr><th>Jumlah pendapatan</th><th class="n">${sum(earn)}</th></tr></table>
      <table><tr><th>Potongan</th><th class="n">RM</th></tr>${ded.map(tr).join("") || "<tr><td>Tiada</td><td></td></tr>"}<tr><th>Jumlah potongan</th><th class="n">${sum(ded)}</th></tr></table></div>
    <div class="net"><span>GAJI BERSIH</span><span>${rm(c.net)}</span></div>
    <p><small>Dijana oleh sistem Abe Din Auto pada ${new Date().toLocaleString("ms-MY")}. KWSP, PERKESO dan PCB belum ditolak dalam kiraan ini.</small></p>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
  const w = window.open("", "_blank"); if (!w) return false; w.document.open(); w.document.write(html); w.document.close(); return true;
}
