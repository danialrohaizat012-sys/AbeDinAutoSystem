// V83 Vehicle 360 smoke and behavior tests - no database connection needed.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/vehicle360.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/vehicle360.css'),'utf8');
const lib=new Function(source.replace(/^export /m,'')+';return {findSale,buildHistory,escapeText,mountVehicle360}')();
test('Vehicle 360 is mounted only in existing vehicle profile',()=>{
 assert.match(html,/current==='vehicleProfile'&&vehicleProfileId/);
 assert.match(html,/mountVehicle360\(el\('ada-cloud-view'\)/);
 assert.match(html,/css\/vehicle360\.css\?v=\d+(?:\.\d+)*/);
});
test('inactive and cancelled sales do not become the current sale',()=>{
 const sales=[
  {id:'cancel',vehicle_id:'v1',status:'cancelled',created_at:'2026-11-20'},
  {id:'sold',vehicle_id:'v1',status:'sold',created_at:'2026-11-01',sold_at:'2026-11-15'},
  {id:'other',vehicle_id:'v2',status:'sold',created_at:'2026-11-19'}
 ];
 assert.equal(lib.findSale(sales,'v1').id,'sold');
 assert.equal(lib.findSale(sales,'missing'),null);
});
test('vehicle history sorts real dated events and avoids invented events',()=>{
 const history=lib.buildHistory({id:'v1',created_at:'2026-11-01'},[],{created_at:'2026-11-03',sold_at:'2026-11-12'});
 assert.equal(history.length,3);
 assert.equal(history[0].description,'Jualan selesai');
});
test('dynamic text is HTML escaped',()=>{
 assert.equal(lib.escapeText('<script>"'),'&lt;script&gt;&quot;');
});
test('financial summary is reserved for Owner',()=>{
 assert.match(source,/if\(isOwner\)\{/);
 assert.match(source,/isOwner&&panes\.finance\.length/);
 assert.match(source,/Anggaran berdasarkan kos yang direkod/);
 assert.doesNotMatch(source,/\.from\(|\.rpc\(|\.insert\(|\.update\(/);
});
test('responsive tabs are present',()=>{
 assert.match(css,/\.ada-v360-tabs/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/\[data-v360-pane\]\[hidden\]/);
});
