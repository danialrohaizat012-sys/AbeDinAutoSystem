const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const load=n=>import(pathToFileURL(path.resolve(__dirname,'../js',n)).href);
const input=(R,c)=>({staffId:'11111111-1111-1111-1111-111111111111',month:'2026-11',slip:{c:{hasPay:true,...c},lines:[['Gaji asas','1 hari',50]]},
  statutory:Object.fromEntries(R.STATUTORY.map(k=>[k,{amount:0,reference:'r'}])),review:{attendance:true,deductions:true,statutory:true,reference:'x'}});
test('draf gaji ditahan jika ada hari tanpa punch balik',async()=>{
  const R=await load('payroll-review.mjs'),S=await load('payroll-slip.mjs');
  const open={openCount:2,openDays:['2026-11-21','2026-11-25']};
  assert.throws(()=>R.preparePayroll(input(R,open)),/21\/11\/2026, 25\/11\/2026/);
  const html=S.reviewFormHtml({c:open});assert.match(html,/ditahan/);assert.doesNotMatch(html,/<form/);
});
test('draf gaji dibenarkan jika rekod lengkap',async()=>{
  const R=await load('payroll-review.mjs'),S=await load('payroll-slip.mjs');
  assert.equal(R.preparePayroll(input(R,{openCount:0,openDays:[]})).net_sen,5000);
  assert.match(S.reviewFormHtml({c:{openCount:0}}),/<form/);
});
