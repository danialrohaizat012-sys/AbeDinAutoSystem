import { STATUTORY, preparePayroll, getReviewedPayroll, openDayWarning } from './payroll-review.mjs?v=2';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rm = s => 'RM ' + (s/100).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
export function validateSnapshot(record,staffId,month) {
  if(!record || record.staff_id!==staffId || record.pay_month!==month+'-01' || record.calculation_version!=='hr-review-v1') throw Error('Rekod payroll tidak sepadan');
  if(record.id && (!Number.isSafeInteger(record.revision) || record.revision<1 || (record.revision===1?record.supersedes_id!==null:typeof record.supersedes_id!=='string'||!record.supersedes_id))) throw Error('Versi payroll tidak sah');
  if(!Array.isArray(record.lines) || record.lines.length<5 || record.lines.length>500) throw Error('Butiran payroll tidak sah');
  let credit=0,deduction=0;
  for(const l of record.lines) {
    if(!l || typeof l.label!=='string' || !l.label.trim() || !Number.isSafeInteger(l.amount_sen) || Math.abs(l.amount_sen)>1e10) throw Error('Baris payroll tidak sah');
    credit+=Math.max(0,l.amount_sen); deduction+=Math.max(0,-l.amount_sen);
  }
  for(const key of STATUTORY) {
    const found=record.lines.filter(l=>l.label.trim().toUpperCase()===key);
    if(found.length!==1 || found[0].amount_sen>0 || typeof found[0].detail!=='string' || !found[0].detail.trim()) throw Error('Caruman '+key+' tidak sah');
  }
  const net=credit-deduction;
  if(net<0 || credit!==record.credits_sen || deduction!==record.deductions_sen || net!==record.net_sen) throw Error('Jumlah payroll tidak sepadan');
  return record;
}
// Existing computeSlip uses shared mutable state. Serialize reads through this adapter.
let queue=Promise.resolve();
const serial=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;};
export async function loadPayrollSlip({client,profile,staffId,month,computeSlip}) {
  if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(month)) throw Error('Bulan tidak sah');
  // Fail closed on authorization/network errors: do not treat them as absent payroll.
  const record=await getReviewedPayroll(client,staffId,month);
  if(record) return {kind:'recorded',month,record:validateSnapshot(record,staffId,month)};
  const slip=await serial(()=>computeSlip(client,profile,staffId,month));
  return {kind:'estimate',month,slip};
}
export function recordHtml(record, { preview=false }={}) {
  validateSnapshot(record,record.staff_id,record.pay_month.slice(0,7));
  const rows=record.lines.map(l=>`<tr><td>${esc(l.label)}</td><td style="text-align:right;white-space:nowrap">${l.amount_sen<0?'−':''}${rm(Math.abs(l.amount_sen))}</td></tr>`).join('');
  return `<div class="sec" style="padding:12px;border:1px solid var(--line,#ddd);border-radius:12px"><b>${preview?'DRAF SEMAKAN · BELUM DISAHKAN':'REKOD GAJI DISAHKAN · BUKAN BUKTI PEMBAYARAN'}</b><p class="note">Bulan ${esc(record.pay_month.slice(0,7))}${preview?"":` · Versi ${esc(record.revision)}`}</p><div class="tw"><table style="width:100%">${rows}<tr><th>Jumlah pendapatan</th><th style="text-align:right">${rm(record.credits_sen)}</th></tr><tr><th>Jumlah potongan</th><th style="text-align:right">${rm(record.deductions_sen)}</th></tr><tr><th>Gaji bersih</th><th style="text-align:right">${rm(record.net_sen)}</th></tr></table></div><p class="note">${preview?'Pratonton sahaja. Tiada rekod disimpan.':'Amaun berdasarkan rekod bulanan yang disimpan, bukan kiraan semula.'}</p></div>`;
}
export function recordPrintDocument(record,info) {
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Rekod gaji ${esc(record.pay_month.slice(0,7))}</title><style>body{font:14px/1.5 Arial,sans-serif;margin:24px;color:#111}h1{font-size:22px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}th{background:#eee}@media print{body{margin:10mm}}</style></head><body><h1>ABE DIN AUTO</h1><p>Nama staf (profil semasa): ${esc(info.name)}</p>${recordHtml(record)}<p>Rekod: ${esc(record.id)} · Direkodkan: ${esc(record.recorded_at)}</p><p>Bukan resit atau bukti gaji telah dibayar.</p></body></html>`;
}
export function printRecordedPayroll(record,info,openWindow=()=>window.open('','_blank')) {
  const w=openWindow(); if(!w) return false;
  w.opener=null; w.document.open(); w.document.write(recordPrintDocument(record,info)); w.document.close(); w.focus(); w.print(); return true;
}
// Explicit Owner preview; no write on form submission. A separate handoff action follows.
export function reviewFormHtml(slip){const blocked=openDayWarning(slip);if(blocked)return `<p class="warn" role="alert">${esc(blocked)}</p>`;return `<form data-payroll-review class="sec" style="margin-top:10px"><h4>Semakan HR · Pratonton</h4><p class="note">Masukkan amaun potongan pekerja daripada rujukan rasmi. RM0 juga memerlukan rujukan. Jangan masukkan IC, nombor akaun atau maklumat sulit dalam rujukan.</p>${STATUTORY.map(k=>`<div style="display:grid;grid-template-columns:minmax(85px,1fr) 1fr;gap:6px;margin:8px 0"><label>${k} (RM)<input class="field" name="${k}_amount" type="number" min="0" step="0.01" required style="width:100%"></label><label>Rujukan<input class="field" name="${k}_ref" required maxlength="200" style="width:100%"></label></div>`).join('')}<label><input type="checkbox" name="attendance" required> Kehadiran, cuti dan OT disemak</label><br><label><input type="checkbox" name="deductions" required> Potongan disemak dan dibenarkan</label><br><label><input type="checkbox" name="statutory" required> Caruman dan PCB disemak</label><br><label>Rujukan semakan<input class="field" name="reference" required maxlength="200" style="width:100%"></label><button class="btn pri" type="submit">Pratonton rekod gaji</button><div data-review-output aria-live="polite"></div></form>`;}
export function prepareFromForm({staffId,month,slip,formData}) {
  const get=k=>formData.get(k);
  const statutory=Object.fromEntries(STATUTORY.map(k=>{const raw=get(k+'_amount');if(raw==null || String(raw).trim()==='') throw Error('Isi amaun '+k);return [k,{amount:Number(raw),reference:get(k+'_ref')}];}));
  return preparePayroll({staffId,month,slip,statutory,review:{attendance:get('attendance')==='on',deductions:get('deductions')==='on',statutory:get('statutory')==='on',reference:get('reference')}});
}
export function bindReviewForm(host,{staffId,month,slip,onPreview}) {
  const f=host.querySelector('[data-payroll-review]');if(!f)return;
  f.onsubmit=async e=>{e.preventDefault();const out=f.querySelector('[data-review-output]');const inner=document.createElement('div');out.replaceChildren(inner);try{const p=prepareFromForm({staffId,month,slip,formData:new FormData(f)});inner.innerHTML=recordHtml(p,{preview:true});if(onPreview)await onPreview(inner,p);}catch(err){inner.textContent=err.message||String(err);}};
  f.oninput=e=>{if(!e.target.closest('[data-review-output]'))f.querySelector('[data-review-output]').textContent='';};
}
