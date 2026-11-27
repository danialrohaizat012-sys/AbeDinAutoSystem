// Adapter for AbeDinAutoSystem js/kehadiran.js computeSlip().
// No statutory rates are assumed. Values must be reviewed by an authorized human.
export const STATUTORY = ['KWSP', 'PERKESO', 'SIP', 'PCB'];
function sen(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e8 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) throw new Error(`Amaun tidak sah: ${name}`);
  return Math.round(value * 100);
}
// Hari tanpa punch balik dikira penuh oleh computeSlip(), jadi draf ditahan sehingga rekod dibetulkan.
export function openDayWarning(slip) {
  const count = slip?.c?.openCount || 0;
  if (!count) return '';
  const dates = (slip.c.openDays || []).map(k => k.split('-').reverse().join('/')).join(', ');
  return `Draf gaji ditahan: ${count} hari tiada punch balik${dates ? ` (${dates})` : ''}. Betulkan rekod di Kehadiran, kemudian muat semula slip.`;
}
export function preparePayroll({ staffId, month, slip, statutory, review }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId || '')) throw new Error('ID staf tidak sah');
  if (!/^20\d\d-(0[1-9]|1[0-2])$/.test(month || '')) throw new Error('Bulan tidak sah');
  if (!slip?.c?.hasPay || !Array.isArray(slip.lines) || !slip.lines.length) throw new Error('Gaji belum ditetapkan atau pengiraan belum tersedia');
  const blocked = openDayWarning(slip);
  if (blocked) throw new Error(blocked);
  if (review?.attendance !== true || review?.deductions !== true || review?.statutory !== true || typeof review.reference !== 'string' || !review.reference.trim()) throw new Error('Semakan HR dan rujukan diperlukan');
  const lines = slip.lines.map((l) => {
    if (!Array.isArray(l) || typeof l[0] !== 'string' || !l[0].trim()) throw new Error('Baris gaji tidak sah');
    if (STATUTORY.some(k => l[0].trim().toUpperCase() === k)) throw new Error('Elakkan potongan statutori berganda');
    // Existing computeSlip can produce fractions of a sen: round each displayed item once.
    if (typeof l[2] !== 'number' || !Number.isFinite(l[2]) || Math.abs(l[2]) > 1e8) throw new Error('Amaun sumber tidak sah');
    return { label: l[0], detail: String(l[1] ?? ''), amount_sen: Math.sign(l[2]) * Math.round(Math.abs(l[2]) * 100 + 1e-8) };
  });
  for (const key of STATUTORY) {
    const item = statutory?.[key];
    const amount = sen(item?.amount, key);
    if (amount < 0 || typeof item.reference !== 'string' || !item.reference.trim()) throw new Error(`Semak caruman ${key}; amaun dan rujukan diperlukan, termasuk RM0`);
    lines.push({ label:key, detail:item.reference.trim(), amount_sen:-amount });
  }
  const credits_sen = lines.reduce((a,l)=>a+Math.max(0,l.amount_sen),0);
  const deductions_sen = lines.reduce((a,l)=>a+Math.max(0,-l.amount_sen),0);
  const net_sen = credits_sen-deductions_sen;
  if (net_sen < 0) throw new Error('Gaji bersih negatif; semak secara manual');
  return { staff_id:staffId, pay_month:month+'-01', lines, credits_sen, deductions_sen, net_sen, review_reference:review.reference.trim(), calculation_version:'hr-review-v1' };
}
// Explicit action only; never call during render or auto-refresh.
export async function saveReviewedPayroll(client, payload, {previousId=null,reason=null}={}) {
  if(previousId!==null && (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(previousId) || typeof reason!=='string' || !reason.trim() || reason.trim().length>500)) throw Error('ID dan sebab pembetulan diperlukan');
  if(previousId===null && reason!==null) throw Error('Sebab hanya untuk pembetulan');
  const {data,error}=await client.rpc('hr_record_reviewed_payroll', {p_payload:payload,p_expected_previous:previousId,p_correction_reason:reason===null?null:reason.trim()});
  if(error) throw new Error(error.message || 'Gagal menyimpan rekod');
  return data;
}
export async function getReviewedPayroll(client,staffId,month) {
  const {data,error}=await client.from('staff_payroll_records').select('id,staff_id,pay_month,lines,credits_sen,deductions_sen,net_sen,calculation_version,recorded_at,revision,supersedes_id').eq('staff_id',staffId).eq('pay_month',month+'-01').order('revision',{ascending:false}).limit(1).maybeSingle();
  if(error) throw new Error(error.message || 'Gagal membaca rekod');
  return data;
}
