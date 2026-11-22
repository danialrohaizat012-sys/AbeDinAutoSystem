const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const checklist=fs.readFileSync(path.resolve(__dirname,'../js/checklist.js'),'utf8');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
test('checklist compiles after cost editor changes',()=>{
 assert.doesNotThrow(()=>new Function(checklist.replace(/^export /gm,'')));
});
test('Sold vehicles can be searched and filtered without losing existing records',()=>{
 assert.match(checklist,/function viewKereta\(\)\{\s*const list=S\.vehicles\.map/);
 assert.match(checklist,/\["sold","Sudah dijual"/);
 assert.match(checklist,/S\.inv\.f==="sold"\?String\(v\.status\|\|""\)\.toLowerCase\(\)==="sold"/);
 assert.match(checklist,/\["sold","Sudah dijual"\]/);
 assert.match(checklist,/status==="sold" \|\| !!q/);
});
test('Sold vehicle prefers its approved inspection over a later draft',()=>{
 assert.match(checklist,/const l=sold\?\(all\.find\(r=>r\.status==="lulus"\)\|\|all\[0\]\):all\[0\]/);
 assert.match(app,/r\.status==='lulus'&&inspCosts\[r\.vehicle_id\]\.status!=='lulus'/);
});
test('inspection cards and approved inspection detail offer a cost-only action',()=>{
 assert.match(checklist,/data-cost="\\?\$\{esc\(r\.id\)\}/);
 assert.match(checklist,/\+ Edit \/ Tambah Kos/);
 assert.match(checklist,/function editInspectionCost\(id\)/);
 assert.match(checklist,/data-cost\]"\)\.forEach\(b=>b\.onclick=\(\)=>editInspectionCost/);
});
test('cost updates preserve raw inspection details, approval status and use optimistic concurrency',()=>{
 assert.match(checklist,/_rawData:x\.data\|\|\{\}/);
 assert.match(checklist,/data:\{\.\.\.r\._rawData,parts:normalized\},kos:partsTotal/);
 assert.match(checklist,/if\(r\.updatedAt\)query=query\.eq\("updated_at",r\.updatedAt\)/);
 assert.match(checklist,/\.eq\("id",r\.id\)/);
 assert.match(checklist,/\.select\("\*"\)\.maybeSingle\(\)/);
 assert.doesNotMatch(checklist,/update\(\{\s*status:"lulus"/);
});
test('cost editor validates positive quantity and non-negative amounts',()=>{
 assert.match(checklist,/Number\.isInteger\(p\.qty\)\|\|p\.qty<1/);
 assert.match(checklist,/Number\.isFinite\(x\)&&x>=0/);
 assert.match(checklist,/S\.rows=S\.rows\.map\(x=>x\.id===rec\.id\?rec:x\)/);
});
test('finance re-reads the verified checklist cost and refreshes owner screen',()=>{
 assert.match(checklist,/new CustomEvent\("ada-inspection-cost-updated"/);
 assert.match(app,/addEventListener\('ada-inspection-cost-updated',async e=>/);
 assert.match(app,/\.eq\('id',rid\)\.eq\('vehicle_id',vid\)\.maybeSingle\(\)/);
 assert.match(app,/if\(chosen\)inspCosts\[vid\]=\{kos:Number\(chosen\.kos\|\|0\),status:chosen\.status\}/);
 assert.match(app,/if\(current==='inventory'\|\|current==='vehicleProfile'\)/);
 assert.match(app,/import\('\.\/js\/checklist\.js\?v=\d+(?:\.\d+)*'\)/);
});
