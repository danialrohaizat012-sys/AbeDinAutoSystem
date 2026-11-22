import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const agent=read('agent.html'),owner=read('js/agent-admin-panel.js'),api=read('supabase/functions/agent-portal-admin/index.ts');
test('agent dashboard displays customer name, phone, vehicle and actions',()=>{
 assert.match(agent,/select\('id,vehicle_id,customer_name,customer_phone,status,lead_source,created_at'\)/);
 assert.match(agent,/function leadContact\(/);
 assert.match(agent,/WhatsApp Pelanggan/);
 assert.match(agent,/Hubungi Telefon/);
 assert.match(agent,/leadContact\(card,x,carMap\.get\(x\.vehicle_id\)\)/);
 assert.match(agent,/get_public_catalogue/);
});
test('the agent lead query is restricted to own agent ID',()=>{
 assert.match(agent,/supabase\.from\('agent_leads'\).*\.eq\('agent_id',agent\.id\)/);
 assert.match(agent,/if\(!me\?\.email_confirmed_at\|\|agent\?\.status!=='active'\)return/);
 assert.doesNotMatch(agent,/SUPABASE_SERVICE_ROLE_KEY/);
});
test('owner sees all agent contacts with context and direct buyer contact',()=>{
 assert.match(api,/payload\.action==="lead_contact_list"/);
 assert.match(api,/owner\?\.role!=="owner"/);
 assert.match(api,/lead_contact_list/);
 assert.match(api,/agent_code:byAgent\.get/);
 assert.match(owner,/request\('lead_contact_list'\)/);
 assert.match(owner,/contactControls\(r,a,car\)/);
 assert.match(agent,/ownerContactLeads/);
});
test('WhatsApp and telephone use safe Malaysian phone normalization',()=>{
 assert.match(agent,/^0\[1-9\]/m); // local Malaysian prefix pattern
 assert.match(agent,/wa\.me\/'\+phone/);
 assert.match(agent,/call\.href='tel:\+'\+phone/);
 assert.match(owner,/wa\.href='https:\/\/wa\.me\/'\+phone/);
 assert.match(owner,/call\.href='tel:\+'\+phone/);
});
test('browser and admin JavaScript parse',()=>{
 const script=agent.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
 const dir=mkdtempSync(join(tmpdir(),'agent-contact-'));
 try{
  const f=join(dir,'agent.mjs');writeFileSync(f,script);execFileSync(process.execPath,['--check',f]);
  execFileSync(process.execPath,['--check',new URL('../js/agent-admin-panel.js',import.meta.url).pathname]);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
