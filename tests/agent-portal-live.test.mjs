import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const html=readFileSync(new URL('../agent-live-v1.html',import.meta.url),'utf8');
test('agent portal module parses without JavaScript syntax errors',()=>{
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'Expected module script');
 const dir=mkdtempSync(join(tmpdir(),'agent-portal-'));
 try{const path=join(dir,'portal.mjs');writeFileSync(path,script);execFileSync(process.execPath,['--check',path]);}
 finally{rmSync(dir,{recursive:true,force:true});}
});
test('browser never contains service role and does not expose private cost',()=>{
 assert.doesNotMatch(html,/SUPABASE_SERVICE_ROLE_KEY|purchase_cost|bank_account|service_role/i);
 assert.match(html,/storageKey:'abe-agent-network-session'/);
 assert.match(html,/agent-portal-catalog/);
 assert.match(html,/agent-portal-admin/);
 assert.match(html,/createClient\(project,'sb_publishable_/);
});
test('customer lead requires opt-in and vehicle selection',()=>{
 assert.match(html,/name="consent" type="checkbox" required/);
 assert.match(html,/name="vehicle_id" id="leadVehicle" required/);
 assert.match(html,/vehicle_id:d.vehicle_id/);
});
test('browser never marks commission or payout paid directly',()=>{
 assert.doesNotMatch(html,/from\(['"]agent_(?:commissions|payouts)['"]\)\.update/);
 assert.match(html,/Tiada pembayaran automatik/);
});
