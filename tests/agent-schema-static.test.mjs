import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = name => readFileSync(new URL('../supabase/' + name,import.meta.url),'utf8');
test('agent application integrity verifies auth identity server-side',()=>{
 const s=sql('agent_application_integrity_v1.sql');
 assert.match(s,/from auth\.users/i);
 assert.match(s,/email_confirmed_at/i);
 assert.match(s,/lower\(btrim\(new\.email\)\) <> lower\(v_email\)/i);
 assert.match(s,/before insert on public\.agent_applications/i);
});
test('payout status guard forbids mutable financial amount and paid record edits',()=>{
 const s=sql('agent_payout_invariants_v1.sql');
 assert.match(s,/new\.amount is distinct from old\.amount/i);
 assert.match(s,/old\.status = 'paid'/i);
 assert.match(s,/New payout must begin as a clean draft/i);
 assert.match(s,/before insert or update on public\.agent_payouts/i);
});
test('ledger guards prevent cross-agent mixing and rewrite of paid commissions',()=>{
 const combined=sql('agent_payout_invariants_v1.sql')+sql('agent_ledger_guards_v1.sql');
 assert.match(combined,/v_payout\.agent_id <> v_commission\.agent_id/i);
 assert.match(combined,/Commission snapshot is immutable/i);
 assert.match(combined,/Paid commission is immutable/i);
 assert.match(combined,/Finalized payout items are immutable/i);
});
test('migrations never alter original business tables',()=>{
 for(const name of ['agent_network_v1.sql','agent_application_integrity_v1.sql','agent_admin_review_v1.sql','agent_admin_gateway_v1.sql','agent_payout_invariants_v1.sql','agent_ledger_guards_v1.sql']){
  const s=sql(name).replace(/--[^\n]*/g,'');
  assert.doesNotMatch(s,/\b(?:alter|drop|truncate|update|delete\s+from|insert\s+into)\s+(?:table\s+)?(?:public\.)?(?:vehicles|sales|payments|customers|profiles|inspections|sewa_\w+)\b/i,name);
 }
});
