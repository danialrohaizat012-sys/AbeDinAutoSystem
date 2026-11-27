const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const modules=new Set(['staff.js','staff-profile.js','hr-dashboard.mjs','hr-assistant.mjs']);
for(const width of [390,1280])test('Real owner staff module HR workflow '+width+'px',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width,height:844}});const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='hr-demo.invalid')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="owner"></div><div id="staff"></div>'});
  const name=u.pathname.slice(4);if(!u.pathname.startsWith('/js/')||!modules.has(name))return route.abort();
  return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'js',name),'utf8')});
 });
 await page.goto('https://hr-demo.invalid/');
 await page.evaluate(async()=>{
  const {mountStaff}=await import('/js/staff.js');
  const me={id:'demo-owner',role:'owner',enabled:true,full_name:'Demo Owner',email:'demo@example.invalid'};
  window.calls=[];
  function mock(){return {rpc:async name=>({data:name==='staff_list'?[me]:[],error:null}),from(table){window.calls.push(table);const q={select(){return q},eq(){return q},gte(){return q},lt(){return q},lte(){return q},order(){return q},range:async()=>({data:[],error:null}),maybeSingle:async()=>({data:me,error:null}),then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}};return q;}}}
  mountStaff(document.querySelector('#owner'),{client:mock(),profile:me});
  mountStaff(document.querySelector('#staff'),{client:mock(),profile:{id:'demo-staff',role:'operations',enabled:true}});
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
 assert.equal(failures.length,0,failures.join('; '));
 }finally{await browser.close()}
});
