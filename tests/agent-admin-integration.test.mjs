import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('app.html'),nav=read('js/admin-menu.js'),moduleCode=read('js/agent-admin-panel.js');
test('Admin has desktop and mobile Agent Network entries',()=>{
 assert.equal((app.match(/data-cloud-page="agents"/g)||[]).length,2);
 assert.match(nav,/agents:'Pengurusan Ejen'/);
 assert.match(nav,/pages:\['applications','agents','sewa'/);
});
test('Agent module is owner-only and cannot bypass backend authorization',()=>{
 assert.match(app,/if\(page==='agents'\)return p\.role==='owner'&&p\.enabled===true/);
 assert.match(moduleCode,/profile\?\.role!=='owner'\|\|profile\?\.enabled!==true/);
 assert.match(moduleCode,/client\.auth\.getSession\(\)/);
 assert.match(moduleCode,/authorization:'Bearer '\+token/);
 assert.match(moduleCode,/send\(data\.session\.access_token\)/);
 assert.match(moduleCode,/agent-portal-admin/);
 assert.doesNotMatch(moduleCode,/SUPABASE_SERVICE_ROLE_KEY|service_role/i);
});
test('Current admin dashboard renders integrated module',()=>{
 assert.match(app,/current==='agents'/);
 assert.match(app,/ada-agent-admin-host/);
 assert.match(app,/import\('\.\/js\/agent-admin-panel\.js\?v=\d+'\)/);
 assert.match(app,/'sewa','agents','reports'/);
});
test('Admin panel includes operational tasks and buyer segregation',()=>{
 for(const marker of ['Permohonan Ejen','Lead daripada Ejen','Pertanyaan Pembeli Terus','Komisen & Payout','direct_inquiry_list','lead_list','finance_list','review'])
  assert.ok(moduleCode.includes(marker),'Missing '+marker);
 assert.match(moduleCode,/request\('review',\{application_id:a\.id,decision:'approve'\}\)/);
 assert.match(moduleCode,/request\('review',\{application_id:a\.id,decision:'reject',reason:reason\.trim\(\)\}\)/);
});
test('JavaScript admin module parses',()=>{
 execFileSync(process.execPath,['--check',new URL('../js/agent-admin-panel.js',import.meta.url).pathname],{stdio:'pipe'});
 execFileSync(process.execPath,['--check',new URL('../js/admin-menu.js',import.meta.url).pathname],{stdio:'pipe'});
});
