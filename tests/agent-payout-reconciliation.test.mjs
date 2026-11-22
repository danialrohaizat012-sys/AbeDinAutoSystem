import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = n => readFileSync(new URL('../supabase/'+n,import.meta.url),'utf8');

test('payout finalization is privileged and atomic',()=>{
 const sql=read('agent_confirm_payout_v1.sql');
 assert.match(sql,/create or replace function agent_internal\.confirm_agent_payout_v1/i);
 assert.match(sql,/security definer set search_path=''/i);
 assert.match(sql,/where id=p_payout for update/i);
 assert.match(sql,/order by c\.id\s+for update of c/i);
 assert.match(sql,/v_payout\.status <> 'approved'/i);
 assert.match(sql,/v_payout\.approved_by = p_actor/i);
 assert.match(sql,/v_commission\.agent_id <> v_payout\.agent_id/i);
 assert.match(sql,/v_commission\.status <> 'approved'/i);
 assert.match(sql,/v_count=0 or v_total <> v_payout\.amount/i);
 assert.match(sql,/update public\.agent_payouts\s+set status='paid'/i);
 assert.match(sql,/update public\.agent_commissions c\s+set status='paid'/i);
 assert.match(sql,/insert into public\.agent_audit_events/i);
 assert.match(sql,/grant execute on function public\.agent_confirm_payout_gateway_v1[\s\S]+to service_role/i);
 assert.match(sql,/revoke all on function public\.agent_confirm_payout_gateway_v1[\s\S]+from public,anon,authenticated/i);
});
test('paid commissions require paid payout',()=>{
 const sql=read('agent_ledger_guards_v1.sql');
 assert.match(sql,/old\.status='approved' and new\.status='paid'/i);
 assert.match(sql,/p\.status='paid'/i);
});
test('only enabled owner can approve payout',()=>{
 const sql=read('agent_payout_invariants_v1.sql');
 assert.match(sql,/owner_check\.enabled is true/i);
 assert.match(sql,/owner_check\.role::text='owner'/i);
});
test('new payout SQL cannot mutate operational data',()=>{
 for(const n of ['agent_confirm_payout_v1.sql','agent_payout_invariants_v1.sql','agent_ledger_guards_v1.sql']){
 const sql=read(n).replace(/--[^\n]*/g,'');
 assert.doesNotMatch(sql,/\b(?:alter|drop|truncate|update|delete\s+from|insert\s+into)\s+(?:table\s+)?(?:public\.)?(?:sales|payments|vehicles|customers|profiles|inspections|sewa_\w+)\b/i,n);
 }
});
