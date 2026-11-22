// V83: inspection dashboard search regression checks.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../js/checklist.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const begin=src.indexOf('const inspectionSearchStatus ='),end=src.indexOf('function dashboardSearchHtml()',begin);
assert.ok(begin>=0&&end>begin,'dashboard search helper exists');
const search=new Function('carState','carName',src.slice(begin,end)+';return inspectionSearchRows')(
 v=>({k:v._k}),v=>[v.make,v.model].filter(Boolean).join(' '));
const vehicles=[
 {id:'1',plate:'DDA 1234',vehicle_id:'ADA-001',make:'Perodua',model:'Myvi',status:'available',_k:'belum'},
 {id:'2',plate:'ABC 5678',vehicle_id:'ADA-002',make:'Toyota',model:'Vios',status:'available',_k:'draf'},
 {id:'3',plate:'BCA 9988',vehicle_id:'ADA-003',make:'Honda',model:'City',status:'reserved',_k:'hantar'},
 {id:'4',plate:'DTT 111',vehicle_id:'ADA-004',make:'Proton',model:'Saga',status:'available',_k:'ulang'},
 {id:'5',plate:'XYZ 000',vehicle_id:'ADA-005',make:'Toyota',model:'Yaris',status:'available',_k:'lulus'},
 {id:'6',plate:'SOL 999',vehicle_id:'ADA-006',make:'Perodua',model:'Axia',status:'sold',_k:'belum'}
];
test('search matches plate with or without spaces, model, make, inventory ID',()=>{
 assert.deepEqual(search(vehicles,'dda1234','perlu').map(x=>x.v.id),['1']);
 assert.deepEqual(search(vehicles,'vios','semua').map(x=>x.v.id),['2']);
 assert.deepEqual(search(vehicles,'toyota','semua').map(x=>x.v.id),['2','5']);
 assert.deepEqual(search(vehicles,'ada-003','semua').map(x=>x.v.id),['3']);
});
test('need-action includes uninspected and active inspection statuses, not approved',()=>{
 assert.deepEqual(search(vehicles,'','perlu').map(x=>x.v.id),['1','2','3','4']);
 assert.deepEqual(search(vehicles,'','belum').map(x=>x.v.id),['1']);
 assert.deepEqual(search(vehicles,'','proses').map(x=>x.v.id),['2','3','4']);
 assert.deepEqual(search(vehicles,'','lulus').map(x=>x.v.id),['5']);
 assert.equal(search(vehicles,'','semua').length,6);
 assert.deepEqual(search(vehicles,'','sold').map(x=>x.v.id),['6']);
 assert.deepEqual(search(vehicles,'sol999','perlu').map(x=>x.v.id),['6']);
});
test('search is visible directly on summary dashboard with filter and results',()=>{
 const dashboard=src.slice(src.indexOf('function viewPantau()'),src.indexOf('function bindPantau()'));
 assert.match(dashboard,/class="kpis"[\s\S]*Gred keseluruhan[\s\S]*\$\{dashboardSearchHtml\(\)\}/);
 assert.match(src,/function bindPantau\(\)[^{]*\{[^}]*bindDashboardSearch\(\)/);
 assert.match(src,/id="ada-ins-search-q"/);
 assert.match(src,/id="ada-ins-search-status"/);
 assert.match(src,/id="ada-ins-search-results"/);
 assert.match(src,/id="ada-ins-search-meta" role="status"/);
});
test('search reuses existing car actions and does not alter sales or inspection data',()=>{
 assert.match(src,/results\.innerHTML=visible\.length/);
 assert.match(src,/openForCar\(b\.dataset\.start\)/);
 assert.match(src,/openForm\(b\.dataset\.edit\)/);
 assert.match(src,/go\("detail",b\.dataset\.rec\)/);
 assert.match(html,/import\('\.\/js\/checklist\.js\?v=\d+(?:\.\d+)*'\)/);
});
test('search layout stacks controls on very narrow phones',()=>{
 assert.match(src,/@media\(max-width:350px\)\{\s*\.ada-ins-search/);
 assert.match(src,/\.ada-ins-search-controls\{grid-template-columns:1fr\}/);
});
