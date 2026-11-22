// Reconcile Sold inventory against Puspakom records, including missing records.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/puspakom.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const carsStart=source.indexOf('function cars() {'),carsEnd=source.indexOf('function toCar(',carsStart);
const auditStart=source.indexOf('function soldPuspakomAudit('),auditEnd=source.indexOf('function renderSoldAudit(',auditStart);
assert.ok(carsStart>=0&&carsEnd>carsStart&&auditStart>0&&auditEnd>auditStart);
const normPlate=p=>String(p||'').toUpperCase().replace(/\s+/g,'');
const toCar=(plate,r,v)=>({plate,inv:!!v,vstatus:v?.status||'',vid:v?.vehicle_id||'',hasRecord:!!(r&&Object.keys(r).length),status:r?.status||'belum',rec:r||{}});
const runCars=new Function('S','normPlate','toCar',source.slice(carsStart,carsEnd)+';return cars;');
const audit=new Function(source.slice(auditStart,auditEnd)+';return soldPuspakomAudit')();
const vehicles=[
 {id:'v1',plate:'TBU6267',vehicle_id:'ADA-0048',status:'sold'},
 {id:'v2',plate:'CDW3079',vehicle_id:'ADA-0085',status:'sold'},
 {id:'v3',plate:'ALH2836',vehicle_id:'ADA-0088',status:'available'},
 {id:'v4',plate:'VAU4126',vehicle_id:'ADA-0107',status:'sold'}
];
const rows=[
 {vehicle_id:'v2',plate:'CDW3079',status:'lulus'},
 {vehicle_id:'v3',plate:'ALH2836',status:'tempah'},
 {vehicle_id:'v4',plate:'VAU4126',status:'gagal'}
];
const cars=(v=vehicles,p=rows)=>runCars({vehicles:v,rows:p},normPlate,toCar)();
test('Sold without any Puspakom record is not hidden',()=>{
 const found=cars().find(c=>c.plate==='TBU6267');
 assert.ok(found);assert.equal(found.inv,true);assert.equal(found.hasRecord,false);
 assert.equal(found.vid,'ADA-0048');
});
test('reconciliation counts sold approved and pending correctly',()=>{
 const a=audit(cars());
 assert.equal(a.sold.length,3);
 assert.equal(a.approved.length,1);
 assert.equal(a.missing.length,1);
 assert.equal(a.pending.length,2);
 assert.deepEqual(a.pending.map(x=>x.plate).sort(),['TBU6267','VAU4126']);
});
test('approved Sold records are not incorrectly flagged',()=>{
 assert.deepEqual(audit(cars()).approved.map(x=>x.plate),['CDW3079']);
});
test('available vehicles are excluded from Sold audit',()=>{
 assert.ok(!audit(cars()).sold.some(x=>x.plate==='ALH2836'));
});
test('audit controls filter all Sold and Sold pending; missing badge is visible',()=>{
 assert.match(source,/S\.filter === "sold_all"/);
 assert.match(source,/S\.filter === "sold_pending"/);
 assert.match(source,/Tiada rekod Puspakom — perlu semakan/);
 assert.match(source,/Perlu pengesahan \(\$\{audit\.pending\.length\}\)/);
 assert.match(source,/Semua kereta terjual/);
 assert.match(source,/renderSoldAudit\(all\)/);
});
test('all cards remain editable using existing booking form without synthetic approval',()=>{
 assert.match(source,/const ed = e\.target\.closest\("\[data-edit\]"\)/);
 assert.match(source,/openForm\(c0/);
 assert.match(source,/status: r\.status \|\| "belum"/);
 assert.match(html,/import\('\.\/js\/puspakom\.js\?v=\d+(?:\.\d+)*'\)/);
});
