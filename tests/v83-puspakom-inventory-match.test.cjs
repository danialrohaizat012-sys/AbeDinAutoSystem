// V83 Puspakom: a Sold vehicle with an approved booking must still link to Inventory.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/puspakom.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const start=source.indexOf('function cars() {');
const end=source.indexOf('function toCar(',start);
assert.ok(start>0&&end>start,'cars() source exists');
const normPlate=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const toCar=(plate,rec,vehicle)=>({plate,inv:!!vehicle,vid:vehicle?.vehicle_id||null,vstatus:vehicle?.status||null,bookingStatus:rec?.status||'belum',vuuid:vehicle?.id||rec?.vehicle_id||null});
const carList=new Function('S','normPlate','toCar',source.slice(start,end)+';return cars;');
const cdw={id:'1ca3164b-16bd-4e72-b259-620d19145a78',vehicle_id:'ADA-0085',plate:'CDW3079',status:'sold'};
const approved={vehicle_id:cdw.id,plate:'CDW3079',status:'lulus',tarikh:'2026-11-17'};
const cars=(vehicles,rows)=>carList({vehicles,rows},normPlate,toCar)();
test('CDW3079 Sold + Lulus is matched to actual Inventory (not missing)',()=>{
 const r=cars([cdw],[approved]);
 assert.equal(r.length,1);assert.equal(r[0].inv,true);
 assert.equal(r[0].vid,'ADA-0085');assert.equal(r[0].vuuid,cdw.id);
 assert.equal(r[0].bookingStatus,'lulus');
});
test('Sold vehicles with other Puspakom states stay linked',()=>{
 for(const state of ['tempah','gagal','belum']){
  const found=cars([cdw],[{...approved,status:state}]);
  assert.equal(found.length,1);assert.equal(found[0].inv,true);
 }
});
test('Sold without a Puspakom booking is still omitted from Puspakom list',()=>{
 assert.deepEqual(cars([cdw],[]),[]);
});
test('booking fallback remains visible when no Inventory vehicle exists',()=>{
 const found=cars([],[approved]);
 assert.equal(found.length,1);assert.equal(found[0].inv,false);
});
test('match by vehicle ID when booking plate differs; prevent duplicate cards',()=>{
 const found=cars([cdw],[{...approved,plate:'CDW 3079 OLD'}]);
 assert.equal(found.length,1);assert.equal(found[0].inv,true);
});
test('normalizes spaces and cases when matching plate',()=>{
 const found=cars([{...cdw,plate:'cdw 3079'}],[approved]);
 assert.equal(found.length,1);assert.equal(found[0].inv,true);
});
test('Puspakom module cache is incremented for iPhone clients',()=>{
 assert.match(html,/import\('\.\/js\/puspakom\.js\?v=7'\)/);
});
