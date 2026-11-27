const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
for(const width of [390,1280])test('Delegation switch and approval '+width,async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='hr-delegate.invalid')return route.abort();if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="owner"></div><div id="staff"></div>'});if(!['/js/hr-delegate.mjs','/js/hr-letters.mjs'].includes(u.pathname))return route.abort();return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,u.pathname.slice(1)),'utf8')});});
 await page.goto('https://hr-delegate.invalid/');
 await page.evaluate(async()=>{
 const {mountHROwnerAccess,mountHRDelegate}=await import('/js/hr-delegate.mjs');
 const owner={id:'owner',role:'owner',enabled:true,full_name:'Demo Owner'},staff={id:'delegate',role:'operations',enabled:true,full_name:'Demo HR'},other={id:'worker',role:'operations',enabled:true,full_name:'Demo Worker'};
 window.state={on:false,requests:[],calls:[]};
 const s=window.state;
 function mock(actor){return {from(table){let filters={};const rows=()=>{if(table==='hr_delegate_access')return [{staff_id:staff.id,enabled:s.on,revision:1}].filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));if(table==='hr_delegate_requests')return s.requests.filter(r=>actor.role==='owner'||s.on&&r.requester===actor.id);throw Error('Unexpected table '+table)};const q={select(){return q},eq(k,v){filters[k]=v;return q},order(){return q},limit:async()=>({data:rows()}),maybeSingle:async()=>({data:rows()[0]||null}),then(resolve){return Promise.resolve({data:rows()}).then(resolve)}};return q;},async rpc(name,p){s.calls.push(name);if(name==='hr_set_delegate'&&actor.role==='owner'){s.on=p.p_enabled;return {data:null}}if(name==='hr_delegate_directory'&&s.on&&actor.id===staff.id)return {data:[other]};if(name==='hr_delegate_submit'&&s.on&&actor.id===staff.id){s.requests.push({id:'req',requester:actor.id,staff_id:p.p_staff,category:p.p_category,payload:p.p_payload,state:'pending',created_at:new Date().toISOString()});return {data:'req'}}if(name==='hr_delegate_decide'&&actor.role==='owner'){s.requests.find(r=>r.id===p.p_request).state=p.p_approve?'approved':'rejected';return {data:'doc'}}return {error:{message:'Permission denied'}}}}}
 mountHROwnerAccess(document.querySelector('#owner'),{profile:owner,client:mock(owner)},[owner,staff,other]);mountHRDelegate(document.querySelector('#staff'),{profile:staff,client:mock(staff)});
 });
 const owner=page.locator('#owner'),staff=page.locator('#staff'),sw=owner.getByRole('switch',{name:'Akses HR Demo HR'});
 await staff.getByText('Akses HR tidak aktif. Hubungi Owner.').waitFor();
 await sw.click();await sw.getAttribute('aria-checked');await owner.getByText('Akses HR aktif',{exact:true}).waitFor();
 await staff.getByRole('button',{name:'Muat semula'}).click();
 await staff.locator('select[name=staff]').selectOption('worker');
 await staff.locator('select[name=kind]').selectOption('warning');
 await staff.locator('textarea[name=body]').fill('Draf amaran demo untuk semakan sahaja.');
 await staff.locator('input[name=reason]').fill('Demo test');
 await staff.getByRole('button',{name:'Hantar kepada Owner'}).click();
 await staff.getByText('Permohonan dihantar kepada Owner.').waitFor();
 await owner.getByRole('button',{name:'Muat semula'}).click();
 await owner.getByText('Draf surat · Demo Worker · Menunggu Owner',{exact:true}).click();
 await owner.locator('input[name=note]').fill('Semakan demo');
 await owner.getByRole('button',{name:'Lulus',exact:true}).click();
 await owner.getByText('Permohonan diluluskan.').waitFor();
 await staff.getByRole('button',{name:'Muat semula'}).click();
 await staff.getByText('Draf surat · Demo Worker · Diluluskan',{exact:true}).waitFor();
 await sw.click();await owner.getByText('Akses HR dikemas kini.').waitFor();
 await staff.getByRole('button',{name:'Muat semula'}).click();
 await staff.getByText('Akses HR tidak aktif. Hubungi Owner.').waitFor();
 assert.equal(await staff.locator('form').count(),0);
 assert.deepEqual(await page.evaluate(()=>window.state.calls.filter(n=>n!=='hr_delegate_directory')),['hr_set_delegate','hr_delegate_submit','hr_delegate_decide','hr_set_delegate']);
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
