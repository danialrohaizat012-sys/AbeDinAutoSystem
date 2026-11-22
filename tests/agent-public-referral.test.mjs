import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const portal=read('agent.html');
const catalogue=read('app.html');
const inquiry=read('agent-inquiry.html');
const edge=read('supabase/functions/agent-public-inquiry/index.ts');
const migration=read('supabase/agent_public_referral_intake_v1.sql');
test('Every agent gets individual catalogue and per-car enquiry links',()=>{
 assert.match(portal,/agentCatalogueLink\(\)/);
 assert.match(portal,/u\.searchParams\.set\('ref',shareToken\)/);
 assert.match(portal,/myAgentLink/);
 assert.match(portal,/agent-inquiry\.html/);
 assert.match(portal,/lead_source==='public_referral'/);
});
test('Public car details offer an explicit referral enquiry form',()=>{
 assert.match(catalogue,/agentReferralCode/);
 assert.match(catalogue,/agent-inquiry\.html/);
 assert.match(catalogue,/Daftar Minat/);
 assert.match(catalogue,/inquiry\.searchParams\.set\('car',String\(vehicleId\)\)/);
 assert.match(catalogue,/inquiry\.searchParams\.set\('ref',agentReferralCode\)/);
});
test('Public customer form requires consent and never sends credentials or financial data',()=>{
 assert.match(inquiry,/name="consent" type="checkbox" required/);
 assert.match(inquiry,/customer_phone/);
 assert.match(inquiry,/agent-public-inquiry/);
 assert.match(inquiry,/company_website/);
 assert.doesNotMatch(inquiry,/SUPABASE_SERVICE_ROLE_KEY|purchase_cost|supplier_id/);
});
test('Backend validates authenticated agent record and published car before inserting',()=>{
 assert.match(migration,/agent_code=p_referral_code and status='active'/);
 assert.match(migration,/is_published=true/);
 assert.match(migration,/catalogue_status='available'/);
 assert.match(migration,/lead_source,referral_code_snapshot/);
 assert.match(migration,/v_duplicate is not null/);
 assert.match(migration,/pg_advisory_xact_lock/);
 assert.match(migration,/rate_limited/);
 assert.match(migration,/grant execute .*service_role/s);
 assert.match(edge,/client\.rpc\(ref\?"agent_submit_public_inquiry_gateway_v1":"agent_submit_direct_inquiry_gateway_v1"/);
 assert.match(edge,/data\.consent!==true/);
 assert.match(edge,/req\.headers\.get\("origin"\)/);
 assert.match(edge,/Terlalu banyak permintaan/);
});
test('Customer form parses in browser JavaScript',()=>{
 const match=inquiry.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match);
 const dir=mkdtempSync(join(tmpdir(),'agent-public-'));
 try{
  const path=join(dir,'inquiry.js');
  writeFileSync(path,match[1]);
  execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
