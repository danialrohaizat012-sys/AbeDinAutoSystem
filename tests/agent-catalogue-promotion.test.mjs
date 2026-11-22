import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const portal=read('agent.html');
const catalogue=read('app.html');
const api=read('supabase/functions/agent-portal-catalog/index.ts');

test('agent inventory is derived from same published public-catalogue RPC',()=>{
 assert.match(api,/rpc\("get_public_catalogue",\{p_vehicle_id:null\}\)/);
 assert.match(api,/status\|\|""/);
 assert.match(api,/==="available"/);
 assert.match(api,/public_vehicle_id:v\.vehicle_id/);
 assert.match(api,/id:v\.id/);
 assert.doesNotMatch(api,/purchase_cost|cost_transfer|consign_phone|supplier_id/);
});
test('agent promotion contains share and lead actions',()=>{
 assert.match(portal,/agentPromo/);
 assert.match(portal,/promoCars/);
 assert.match(portal,/Kongsi WhatsApp/);
 assert.match(portal,/Salin Link/);
 assert.match(portal,/Daftar Lead/);
 assert.match(portal,/u\.searchParams\.set\('car',car\.public_vehicle_id\)/);
 assert.match(portal,/u\.searchParams\.set\('ref',agent\.agent_code\)/);
 assert.match(portal,/op\.value=v\.id/);
 assert.match(portal,/agent\?\.status!=='active'/);
});
test('public catalogue keeps safe referral code on detail and WhatsApp',()=>{
 assert.match(catalogue,/const agentReferralCode=/);
 assert.match(catalogue,/\/\^\[A-Za-z0-9_-\]\{2,40\}\$\//);
 assert.match(catalogue,/u\.searchParams\.set\('ref',agentReferralCode\)/);
 assert.match(catalogue,/const carLink=v=>[\s\S]*?agentReferralSuffix\(\)/);
 assert.match(catalogue,/Kod rujukan ejen:/);
 assert.match(catalogue,/history\.replaceState\(null,'','\/\?car='\+encodeURIComponent\(params\.get\('car'\)\)\+agentReferralSuffix\(\)\)/);
});
