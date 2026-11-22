import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const agent=read('agent.html'),admin=read('js/agent-admin-panel.js');
const api=read('supabase/functions/agent-portal-admin/index.ts');
const catalog=read('supabase/functions/agent-portal-catalog/index.ts');
const sql=read('supabase/agent_lead_reads_vehicle_commission_v1.sql');
test('lead list compact by default; detail available on click with car link',()=>{
 assert.match(agent,/createElement\('details'\)/);
 assert.match(agent,/createElement\('summary'\)/);
 assert.match(agent,/leadCarLink\(panel/);
 assert.match(admin,/node\('details','ag-mini'\)/);
 assert.match(admin,/node\('summary','ag-mini-head'\)/);
 assert.match(admin,/url\.searchParams\.set\('car',car\.vehicle_id\)/);
});
test('agent and owner independent read flags persisted in database',()=>{
 assert.match(sql,/add column if not exists agent_read_at/);
 assert.match(sql,/add column if not exists owner_read_at/);
 assert.match(sql,/l\.agent_id and a\.user_id=v_user/);
 assert.match(sql,/grant execute on function public\.agent_mark_own_lead_read_v1\(uuid\) to authenticated/);
 assert.match(api,/action==="owner_lead_mark_read"/);
 assert.match(agent,/agent_mark_own_lead_read_v1/);
 assert.match(agent,/leadReadButton/);
 assert.match(admin,/Tandakan Sudah Baca/);
 assert.match(api,/owner\?\.role!=="owner"/);
});
test('admin displays agent names and per-car indicative commission settings',()=>{
 assert.match(api,/agent_name:byApplication\.get/);
 assert.match(admin,/agent_name/);
 assert.match(admin,/commission_vehicle_list/);
 assert.match(admin,/commission_offer_set/);
 assert.match(admin,/standard','Standard/);
 assert.match(admin,/premium','Premium/);
 assert.match(admin,/special','Khas/);
 assert.match(sql,/agent_vehicle_commission_offers/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.agent_vehicle_commission_offers/);
 assert.match(catalog,/agent\?\.status!=="active"/);
 assert.match(catalog,/indicative_commission/);
 assert.match(agent,/Komisen cadangan ejen/);
});
test('commission changes do not trigger payout or mark commission approved',()=>{
 assert.doesNotMatch(api,/action==="confirm_payout"/);
 assert.match(api,/Indicative only/);
 assert.match(admin,/Bukan komisen diluluskan/);
 assert.match(sql,/indicative_amount/);
});
test('modified agent and admin browser JS syntax valid',()=>{
 const js=agent.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert.ok(js);
 const d=mkdtempSync(join(tmpdir(),'ada-leads-'));
 try{const p=join(d,'agent.mjs');writeFileSync(p,js);execFileSync(process.execPath,['--check',p]);
 execFileSync(process.execPath,['--check',new URL('../js/agent-admin-panel.js',import.meta.url).pathname]);}
 finally{rmSync(d,{recursive:true,force:true})}
});
