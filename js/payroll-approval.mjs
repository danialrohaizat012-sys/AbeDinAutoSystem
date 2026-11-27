const uuid = x => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const note = x => typeof x === 'string' && x.trim().length > 0 && x.trim().length <= 500;
async function call(client, name, args) {
  const {data,error}=await client.rpc(name,args);
  if(error) throw Error(error.message || 'Permintaan payroll gagal');
  return data;
}
export async function submitPayroll(client,payload,{previousId=null,reason=null}={}) {
  if(!uuid(payload?.staff_id)||!/^20\d\d-(0[1-9]|1[0-2])-01$/.test(payload?.pay_month)||!Array.isArray(payload.lines)) throw Error('Draf tidak sah');
  if(previousId===null ? reason!==null : !uuid(previousId)||!note(reason)) throw Error('Sebab pembetulan tidak sah');
  return call(client,'hr_submit_payroll',{p_payload:payload,p_expected_previous:previousId,p_correction_reason:reason===null?null:reason.trim()});
}
export async function decidePayroll(client,id,approve,decisionNote) {
  if(!uuid(id)||typeof approve!=='boolean'||!note(decisionNote)) throw Error('Keputusan tidak sah');
  return call(client,'hr_decide_payroll',{p_submission:id,p_approve:approve,p_note:decisionNote.trim()});
}
export async function setPayrollReviewer(client,staffId,enabled) {
  if(!uuid(staffId)||typeof enabled!=='boolean') throw Error('Penyemak tidak sah');
  return call(client,'hr_set_payroll_reviewer',{p_staff:staffId,p_enabled:enabled});
}
