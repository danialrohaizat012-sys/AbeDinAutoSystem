const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const modules=new Set(['staff.js','staff-profile.js','hr-dashboard.mjs','hr-assistant.mjs','hr-kpi.mjs','staff-me.js']);
for(const width of [390,1280])test('Real owner staff module HR workflow '+width+'px',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width,height:844}});const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='hr-demo.invalid')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="owner"></div><div id="staff"></div><div id="personal"></div>'});
  const name=u.pathname.slice(4);if(!u.pathname.startsWith('/js/')||!modules.has(name))return route.abort();
  return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'js',name),'utf8')});
 });
 await page.goto('https://hr-demo.invalid/');
 await page.evaluate(async()=>{
  const {mountStaff}=await import('/js/staff.js');
  const me={id:'00000000-0000-0000-0000-000000000001',role:'owner',enabled:true,full_name:'Demo Owner',email:'demo@example.invalid'};
  window.calls=[]; window.kpiRows=[];
  function mock(){return {rpc:async name=>({data:name==='staff_list'?[me]:[],error:null}),from(table){window.calls.push(table);const filters={}; const q={select(){return q},eq(k,v){filters[k]=v;return q},in(){return q},gte(){return q},lt(){return q},lte(){return q},order(){return q},range:async()=>({data:table==='hr_kpi_targets'?window.kpiRows.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)):[],error:null}),insert:async row=>{if(table!=='hr_kpi_targets')throw Error('Unexpected write');window.kpiRows.push({...row,id:'00000000-0000-0000-0000-000000000010'});return {error:null}},maybeSingle:async()=>({data:table==='profiles'?me:null,error:null}),then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}};return q;}}}
  mountStaff(document.querySelector('#owner'),{client:mock(),profile:me});
  mountStaff(document.querySelector('#staff'),{client:mock(),profile:{id:'00000000-0000-0000-0000-000000000002',role:'operations',enabled:true}});
  const {mountStaffMe}=await import('/js/staff-me.js');
  mountStaffMe(document.querySelector('#personal'),{client:mock(),profile:{...me,role:'operations'}});
 });
 const owner=page.locator('#owner'),staff=page.locator('#staff');
 await owner.getByRole('button',{name:'Muat KPI'}).waitFor();
 assert.equal(await staff.locator('#hr-dashboard').count(),0);
 assert.equal(await staff.locator('#hr-assistant-wrap').count(),0);
 assert.equal(await page.evaluate(()=>window.calls.includes('sales')),false,'no automatic KPI reads');
 await owner.getByRole('button',{name:'Muat KPI'}).click();
 await owner.getByText('Kiraan aktiviti sahaja.',{exact:false}).waitFor();
 await owner.locator('#hr-assistant-wrap summary').click();
 await owner.getByRole('button',{name:'Jana laporan'}).click();
 await owner.locator('textarea[readonly]').waitFor();
 assert.match(await owner.locator('textarea[readonly]').inputValue(),/Ringkasan HR AbeDin Auto/);
 await owner.locator('#hr-kpi-wrap summary').click();
 const kpi=owner.locator('#hr-kpi');
 await kpi.getByRole('button',{name:'Muat',exact:true}).click();
 await kpi.locator('input[name=target]').fill('5');
 await kpi.locator('textarea[name=reason]').fill('Demo target');
 await kpi.getByRole('button',{name:'Simpan sasaran'}).click();
 await kpi.getByText('Jualan selesai · Sasaran 5 (v1)',{exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>window.kpiRows.length),1);
 const personal=page.locator('#personal');
 await personal.getByRole('button',{name:'KPI',exact:true}).click();
 await personal.locator('#my-kpi').getByRole('button',{name:'Muat',exact:true}).click();
 await personal.getByText('Jualan selesai · Sasaran 5 (v1)',{exact:false}).waitFor();
 assert.equal(await personal.locator('[data-target]').count(),0);
 assert.equal(await personal.locator('[data-person]').count(),0);
 assert.equal(await staff.locator('#hr-kpi-wrap').count(),0);
 assert.equal(failures.length,0,failures.join('; '));
 }finally{await browser.close()}
});
