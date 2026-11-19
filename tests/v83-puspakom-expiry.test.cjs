// V83 Puspakom 120-day expiry - read-only regression tests.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const moduleSource=fs.readFileSync(path.resolve(__dirname,'../js/puspakom.js'),'utf8');
const appSource=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const a=moduleSource.indexOf('const MONTHS = '),b=moduleSource.indexOf('let S = null;',a);
assert.ok(a>=0&&b>a,'Puspakom expiry calculation source exists');
const lib=new Function(moduleSource.slice(a,b)+';return {expiryInfo,expiryPanel,expiryTodayMY};')();
const x=appSource.indexOf('function pkTodayMY(){'),y=appSource.indexOf('function pkPanel(',x);
assert.ok(x>=0&&y>x,'Vehicle 360 expiry source exists');
const view=new Function(appSource.slice(x,y)+';return {pkExpiry,pkExpiryView};')();

test('120-day expiry is based on booking date, not approval date',()=>{
 const rec={status:'lulus',date:'2026-09-01'};
 const e=lib.expiryInfo(rec,'2026-11-20');
 assert.equal(e.expiry,'2026-12-30');
 assert.equal(e.left,40);
 assert.equal(e.elapsed,80);
 assert.match(lib.expiryPanel(rec),/Booking:/);
 assert.match(lib.expiryPanel(rec),/Tamat:/);
});
test('on expiry day remaining days are zero; after expiry show expired',()=>{
 assert.equal(lib.expiryInfo({status:'lulus',date:'2026-09-01'},'2026-12-30').left,0);
 const e=lib.expiryInfo({status:'lulus',date:'2026-09-01'},'2026-12-31');
 assert.equal(e.left,-1);
 assert.equal(e.tone,'expired');
});
test('handles leap-day booking and validates dates',()=>{
 assert.equal(lib.expiryInfo({status:'lulus',date:'2024-02-29'},'2024-03-01').expiry,'2024-06-28');
 assert.equal(lib.expiryInfo({status:'lulus',date:'2026-02-30'},'2026-11-20'),null);
});
test('countdown is only visible for Lulus',()=>{
 for(const status of ['belum','tempah','gagal']){
  assert.equal(lib.expiryInfo({status,date:'2026-09-01'},'2026-11-20'),null);
  assert.equal(lib.expiryPanel({status,date:'2026-09-01'}),'');
  assert.equal(view.pkExpiryView({status,tarikh:'2026-09-01'}),'');
 }
});
test('Lulus without booking date prompts data completion instead of inventing a date',()=>{
 assert.match(lib.expiryPanel({status:'lulus',date:''}),/Tarikh booking/);
 assert.match(view.pkExpiryView({status:'lulus',tarikh:null}),/Isi tarikh booking/);
 assert.doesNotMatch(moduleSource,/if \(st === "lulus" && !c\.date\) patch\.tarikh = todayStr\(\)/);
 assert.match(moduleSource,/openForm\(c, "lulus"\)/);
 assert.match(moduleSource,/status === "tempah" \|\| status === "lulus"/);
});
test('Vehicle 360 shows the same expiry date and uses Malaysia timezone',()=>{
 const e=view.pkExpiry({status:'lulus',tarikh:'2026-09-01'},'2026-11-20');
 assert.equal(e.expiry,'2026-12-30');
 assert.equal(e.left,40);
 assert.match(view.pkExpiryView({status:'lulus',tarikh:'2026-09-01'}),/Tamat \(120 hari\)/);
 assert.match(appSource,/import\('\.\/js\/puspakom\.js\?v=6'\)/);
 assert.match(moduleSource,/timeZone:"Asia\/Kuala_Lumpur"/);
 assert.match(appSource,/timeZone:'Asia\/Kuala_Lumpur'/);
});
test('Puspakom cards show a distinct expiry visual and date fields',()=>{
 assert.match(moduleSource,/\$\{expiryPanel\(c\)\}/);
 assert.match(moduleSource,/\.expiry-bar/);
 assert.match(moduleSource,/\.expiry-urgent/);
 assert.match(moduleSource,/\.expiry-expired/);
});
