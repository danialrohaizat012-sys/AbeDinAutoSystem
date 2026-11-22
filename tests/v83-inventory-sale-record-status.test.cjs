const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/app.css'),'utf8');
const begin=app.indexOf('function saleRecordState(v){'),end=app.indexOf('function extraCosts(v){',begin);
assert.ok(begin>=0&&end>begin,'Sale verification helper is present');
const source=app.slice(begin,end);
const effStatus=v=>v.status||'available';
const safe=s=>String(s).replace(/[&<>"]/g,'');
function detector(sales,role='owner'){
  return new Function('sales','profile','effStatus','safe',source+';return {state:saleRecordState,badge:saleRecordBadge}')(
    sales,{role},effStatus,safe);
}
const car={id:'car-1',status:'sold',vehicle_id:'ADA-0108',plate:'MBS5708'};
test('Sold inventory with no Sales transaction clearly says no sale record',()=>{
 const {state,badge}=detector([]);
 assert.deepEqual(state(car),{key:'missing',label:'Tiada Rekod Jualan',sale:null});
 assert.match(badge(car),/Sold · Tiada Rekod Jualan/);
});
test('Cancelled sale is not mistaken for a completed or recorded sale',()=>{
 const {state}=detector([{id:'x',vehicle_id:'car-1',status:'cancelled',agreed_price:5900}]);
 assert.equal(state(car).key,'missing');
});
test('A recorded reservation is not falsely called a completed sale',()=>{
 const {state,badge}=detector([{id:'x',vehicle_id:'car-1',status:'reserved',created_at:'2026-11-20T12:00:00Z'}]);
 assert.equal(state(car).key,'recorded');
 assert.match(badge(car),/Ada Rekod Jualan/);
});
test('Sold sales transaction is distinct from inventory Sold flag',()=>{
 const {state,badge}=detector([{id:'x',vehicle_id:'car-1',status:'sold',sold_at:'2026-11-20T13:00:00Z'}]);
 assert.equal(state(car).key,'completed');
 assert.match(badge(car),/Jualan Selesai/);
});
test('A later reservation cannot hide an older completed sale',()=>{
 const rows=[
  {id:'sold',vehicle_id:'car-1',status:'sold',sold_at:'2026-11-19T13:00:00Z'},
  {id:'reservation',vehicle_id:'car-1',status:'reserved',created_at:'2026-11-20T13:00:00Z'}
 ];
 assert.equal(detector(rows).state(car).sale.id,'sold');
});
test('Unrelated sales do not determine another car status',()=>{
 assert.equal(detector([{id:'x',vehicle_id:'different',status:'sold'}]).state(car).key,'missing');
});
test('Staff without sales permission is not falsely told there is no sale',()=>{
 const {state,badge}=detector([],'operations');
 assert.equal(state(car).key,'restricted');
 assert.equal(badge(car),'');
});
test('Available unsold cars do not get a warning badge',()=>{
 const {state,badge}=detector([]);
 assert.equal(state({...car,status:'available'}).key,'missing');
 assert.equal(badge({...car,status:'available'}),'');
});
test('Vehicle 360 and inventory card display the same verified status',()=>{
 const v=app.slice(app.indexOf('function vehicleProfile('),app.indexOf('function effStatus('));
 const c=app.slice(app.indexOf('function vehicleCards('),app.indexOf('async function syncVehicleImages('));
 assert.match(v,/const saleCheck=saleRecordState\(v\)/);
 assert.match(v,/saleRecordBadge\(v\)/);
 assert.match(v,/Status Rekod Jualan/);
 assert.match(v,/Pengesahan Jualan/);
 assert.match(c,/ada-sale-record-row.*saleRecordBadge\(v\)/s);
 assert.match(app,/function effStatus\(v\)/);
 assert.match(app,/css\/app.css\?v=\d+(?:\.\d+)*/);
 assert.match(css,/\.ada-sale-record-badge\.is-missing/);
 assert.match(css,/\.ada-sale-record-badge\.is-completed/);
});
