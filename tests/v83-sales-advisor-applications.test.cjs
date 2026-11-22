const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../js/permohonan.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const sql=fs.readFileSync(path.resolve(__dirname,'../V83_SALES_ADVISOR_APPLICATIONS.sql'),'utf8');
test('Permohonan JavaScript syntax compiles',()=>assert.doesNotThrow(()=>new Function(src.replace(/^export /gm,''))));
test('Sales Advisor and other authorized staff can read and edit, with RLS checks',()=>{
 assert.match(sql,/p\.role in \('owner','operations','sales_advisor'\)/);
 assert.match(sql,/p\.enabled is true/);
 assert.match(sql,/p\.id = \(select auth\.uid\(\)\)/);
 assert.match(sql,/for select to authenticated/);
 assert.match(sql,/for update to authenticated/);
 assert.match(sql,/with check/);
 assert.match(sql,/grant select, update on public\.buyer_applications to authenticated/);
 assert.match(sql,/revoke delete on public\.buyer_applications from authenticated/);
});
test('application records preserve an archive trail and read tracking',()=>{
 for(const name of ['read_at','read_by','deleted_at','deleted_by'])assert.match(sql,new RegExp('add column if not exists '+name));
 assert.match(src,/\.is\('deleted_at',null\)/);
 assert.match(src,/deleted_at:stamp,deleted_by:ctx\.profile\?\.id/);
 assert.match(src,/read_at:readAt,read_by:readAt/);
 assert.match(src,/confirm\('Padam permohonan/);
 assert.match(src,/confirm\('Sahkan sekali lagi/);
});
test('each record offers all requested actions and WhatsApp link',()=>{
 for(const op of ['view','edit','copy','paste','read','delete'])assert.match(src,new RegExp('data-op="'+op+'"'));
 assert.match(src,/https:\/\/wa\.me\//);
 assert.match(src,/data-app-filter="unread"/);
 assert.match(src,/data-app-filter="read"/);
 assert.match(src,/Sudah Baca/);
 assert.match(src,/Belum Baca/);
});
test('Paste fills edit form without auto saving, and copy uses clipboard',()=>{
 assert.match(src,/navigator\.clipboard\.readText/);
 assert.match(src,/clipboardSnapshot=snapshot\(a\)/);
 assert.match(src,/await copy\(recordText\(a\),button\)/);
 assert.match(src,/form\.elements\.namedItem/);
 assert.match(src,/Data ditampal ke borang Edit/);
 assert.match(src,/app\.addEventListener\('submit'/);
});
test('updates use RLS-aware affected row counts and preserve applicant data',()=>{
 assert.match(src,/update\(patch,\{count:'exact'\}\)/);
 assert.doesNotMatch(src,/update\(patch\).*select\('id'\)/);
 assert.match(src,/updated\.nama=name;updated\.tel=phone;updated\.email=email;updated\.kereta=car/);
 assert.match(src,/applicant_name:name,applicant_phone:phone/);
});
test('Sales Advisor explicitly denied Permohonan is enabled without changing other permissions',()=>{
 assert.match(sql,/jsonb_set\(coalesce\(permissions,'\{\}'::jsonb\),'\{applications\}','true'::jsonb,true\)/);
 assert.match(sql,/where role='sales_advisor' and enabled is true/);
 assert.match(sql,/permissions->>'applications'='false'/);
});
test('module cache and incoming application form are preserved',()=>{
 assert.match(html,/import\('\.\/js\/permohonan\.js\?v=\d+(?:\.\d+)*'\)/);
 assert.match(src,/function formLink\(\)/);
 assert.match(src,/permohonan\.html/);
 assert.match(src,/loadApplications\(\)/);
});
