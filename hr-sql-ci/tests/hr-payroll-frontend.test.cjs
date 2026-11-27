const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const modules=new Set(['staff.js','staff-profile.js','staff-me.js','slip.js','hr-dashboard.mjs','hr-assistant.mjs','hr-kpi.mjs','hr-letters.mjs','hr-esign.mjs','hr-discipline.mjs','hr-assets.mjs','payroll-review.mjs','payroll-slip.mjs','payroll-handoff.mjs','payroll-approval.mjs']);
const demoSlip={c:{hasPay:true,net:2000},lines:[['Gaji asas','Demo',2000]],rows:[],stats:{present:22,absent:0,late:0,lateMin:'0',worked:'176j',ot:'0',paidLeave:0,unpaidLeave:0}};
for(const width of [390,1280])test('Payroll profile, independent reviewer and approved slip '+width+'px',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='payroll-demo.invalid')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="owner"></div><div id="profile"></div><div id="reviewer"></div><div id="worker"></div>'});
  const name=u.pathname.slice(4);if(!u.pathname.startsWith('/js/'))return route.abort();
  // Only the underlying attendance calculation is a deterministic fixture; all payroll/HR UI modules are actual repo files.
  if(name==='kehadiran.js')return route.fulfill({contentType:'text/javascript',body:'export async function computeSlip(){return '+JSON.stringify(demoSlip)+'}'});
  if(!modules.has(name))return route.abort();
  return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'js',name),'utf8')});
 });
 await page.goto('https://payroll-demo.invalid/');
 await page.evaluate(async()=>{
  const {mountStaff}=await import('/js/staff.js'),{mountProfile}=await import('/js/staff-profile.js'),{mountStaffMe}=await import('/js/staff-me.js');
  const id=n=>'00000000-0000-0000-0000-00000000000'+n;
  const owner={id:id(1),role:'owner',enabled:true,full_name:'Demo Owner',email:'owner@example.invalid'};
  const worker={...owner,id:id(2),role:'operations',full_name:'Demo Staff'},reviewer={...worker,id:id(3),full_name:'Demo HR'};
  const people=[owner,worker,reviewer];const state={reviewers:[],handoffs:[],submissions:[],records:[],calls:[]};window.payrollState=state;
  const ok=data=>({data,error:null});
  function mock(actor){return {rpc:async (name,p={})=>{
   if(name==='staff_list')return ok(people);
   state.calls.push({name,actor:actor.id,p});
   if(name==='hr_set_payroll_reviewer'&&actor.id===owner.id){state.reviewers=[{staff_id:p.p_staff,enabled:p.p_enabled}];return ok(null)}
   if(name==='hr_create_payroll_handoff'&&actor.id===owner.id&&state.reviewers.some(r=>r.staff_id===p.p_reviewer&&r.enabled)){const h={id:crypto.randomUUID(),staff_id:p.p_payload.staff_id,staff_name:worker.full_name,pay_month:p.p_payload.pay_month,payload:p.p_payload,reviewer_id:p.p_reviewer,expected_previous:p.p_expected_previous,correction_reason:p.p_correction_reason,status:'waiting'};state.handoffs.push(h);return ok(h.id)}
   if(name==='hr_submit_payroll_handoff'){const h=state.handoffs.find(h=>h.id===p.p_handoff&&h.reviewer_id===actor.id&&h.status==='waiting');if(h){h.status='submitted';const s={...h,id:crypto.randomUUID(),status:'pending',submitted_by:actor.id};state.submissions.push(s);return ok(s.id)}}
   if(name==='hr_decide_payroll'&&actor.id===owner.id){const s=state.submissions.find(s=>s.id===p.p_submission&&s.status==='pending'&&s.submitted_by!==actor.id);if(s&&p.p_approve){s.status='approved';s.decision_note=p.p_note;const rec={...s.payload,id:crypto.randomUUID(),revision:1,supersedes_id:null,recorded_at:new Date().toISOString()};state.records.push(rec);s.record_id=rec.id;return ok(rec.id)}}
   return {data:null,error:{message:'Denied mock RPC '+name}};
  },from(table){const filters={};let max=Infinity;const rows=()=>{let list=({profiles:people,hr_payroll_reviewers:state.reviewers.filter(r=>actor.role==='owner'||r.staff_id===actor.id),hr_payroll_handoffs:state.handoffs.filter(h=>actor.role==='owner'||h.reviewer_id===actor.id),hr_payroll_submissions:state.submissions.filter(s=>actor.role==='owner'||s.submitted_by===actor.id),staff_payroll_records:state.records.filter(r=>actor.role==='owner'||r.staff_id===actor.id)})[table]||[];return list.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)).slice(0,max)};const q={select(){return q},eq(k,v){filters[k]=v;return q},order(){return q},limit(n){max=n;return q},maybeSingle:async()=>ok(rows()[0]||null),then(resolve,reject){return Promise.resolve(ok(rows())).then(resolve,reject)}};return q;}}}
  mountStaff(document.querySelector('#owner'),{client:mock(owner),profile:owner});
  mountProfile(document.querySelector('#profile'),{client:mock(owner),profile:owner},worker,()=>{});
  mountStaffMe(document.querySelector('#reviewer'),{client:mock(reviewer),profile:reviewer});
  mountStaffMe(document.querySelector('#worker'),{client:mock(worker),profile:worker});
 });
 const owner=page.locator('#owner'),profile=page.locator('#profile'),reviewer=page.locator('#reviewer'),worker=page.locator('#worker');
 await owner.locator('#payroll-queue-wrap summary').click();const oq=owner.locator('#payroll-queue');
 await oq.locator('[data-delegate]').selectOption('00000000-0000-0000-0000-000000000003');
 await oq.getByRole('button',{name:'Lantik',exact:true}).click();await oq.getByText('Penyemak aktif: Demo HR',{exact:true}).waitFor();
 const month=await profile.locator('#slipm option').nth(1).getAttribute('value');await profile.locator('#slipm').selectOption(month);
 await profile.getByText('ANGGARAN · BELUM DISAHKAN',{exact:true}).waitFor();
 const f=profile.locator('[data-payroll-review]');
 for(const [k,n] of [['KWSP','220'],['PERKESO','10'],['SIP','4'],['PCB','0']]){await f.locator('input[name="'+k+'_amount"]').fill(n);await f.locator('input[name="'+k+'_ref"]').fill('Demo verified');}
 for(const k of ['attendance','deductions','statutory'])await f.locator('input[name="'+k+'"]').check();
 await f.locator('input[name=reference]').fill('Demo checked');await f.getByRole('button',{name:'Pratonton rekod gaji'}).click();
 await f.getByRole('button',{name:'Serah draf kepada HR'}).click();await f.getByText('Draf diserah.',{exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>window.payrollState.records.length),0);
 await worker.getByRole('button',{name:'Slip Gaji',exact:true}).click();await worker.locator('#month').selectOption(month);await worker.getByText('ANGGARAN · BELUM DISAHKAN',{exact:true}).waitFor();assert.equal(await worker.getByRole('button',{name:'PDF rekod',exact:true}).count(),0);
 await reviewer.getByRole('button',{name:'Semakan payroll',exact:true}).click();const rq=reviewer.locator('#my-payroll-queue');
 await rq.locator('details summary').first().click();await rq.locator('[data-confirm]').check();await rq.getByRole('button',{name:'Hantar untuk kelulusan'}).click();await rq.getByText('submitted',{exact:false}).first().waitFor();
 assert.equal(await page.evaluate(()=>window.payrollState.records.length),0);
 await oq.getByRole('button',{name:'Refresh',exact:true}).click();await oq.getByText('pending',{exact:false}).first().click();await oq.locator('[data-note]').fill('Demo approved');await oq.getByRole('button',{name:'Lulus dan kunci'}).click();
 await oq.getByText('approved',{exact:false}).first().waitFor();
 await worker.getByRole('button',{name:'Muat semula',exact:true}).click();await worker.getByText('REKOD GAJI DISAHKAN · BUKAN BUKTI PEMBAYARAN',{exact:true}).waitFor();await worker.getByRole('button',{name:'PDF rekod',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.payrollState.records[0].net_sen),176600);
 assert.deepEqual(await page.evaluate(()=>window.payrollState.calls.map(x=>x.name)),['hr_set_payroll_reviewer','hr_create_payroll_handoff','hr_submit_payroll_handoff','hr_decide_payroll']);
 assert.equal(errors.length,0,errors.join('; '));
 }finally{await browser.close()}
});
