import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/agent_sale_attribution_v1.sql',import.meta.url),'utf8');

test('requires enabled owner authorization at database boundary',()=>{
 assert.match(sql,/p\.enabled is true and p\.role::text='owner'/i);
 assert.match(sql,/security definer set search_path=''/i);
 assert.match(sql,/from public,anon,authenticated/i);
 assert.match(sql,/to service_role/i);
});
test('existing sale and lead are read and locked, not changed',()=>{
 assert.match(sql,/from public\.agent_leads where id=p_lead for update/i);
 assert.match(sql,/from public\.sales where id=p_sale for share/i);
 assert.doesNotMatch(sql,/\bupdate public\.(sales|customers|vehicles|payments)\b/i);
 assert.doesNotMatch(sql,/\bdelete from public\.(sales|customers|vehicles|payments)\b/i);
});
test('prevents double lead attribution and multiple agent commissions per sale',()=>{
 assert.match(sql,/create unique index if not exists agent_commissions_one_agent_per_sale_v1/i);
 assert.match(sql,/on public\.agent_commissions\(sale_id\)/i);
 assert.match(sql,/where l\.linked_sale_id=p_sale and l\.id<>p_lead/i);
 assert.match(sql,/v_lead\.linked_sale_id is not null/i);
});
test('requires matching vehicle, verified customer phone and audit trail',()=>{
 assert.match(sql,/v_lead\.vehicle_id<>v_sale\.vehicle_id/i);
 assert.match(sql,/v_customer_phone <> v_lead_phone/i);
 assert.match(sql,/p_evidence_reason/i);
 assert.match(sql,/insert into public\.agent_audit_events/i);
});
test('exposes only service-role callable gateway',()=>{
 assert.match(sql,/revoke all on function public\.agent_link_lead_gateway_v1[\s\S]*from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.agent_link_lead_gateway_v1[\s\S]*to service_role/i);
});
