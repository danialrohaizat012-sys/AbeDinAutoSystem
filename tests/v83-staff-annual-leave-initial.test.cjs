// Initial staff annual-leave configuration must not invent an HR allocation.
// Run without database writes or access to employee details.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../js/staff-profile.js'),'utf8');
const staff=fs.readFileSync(path.resolve(__dirname,'../js/staff.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
test('HR module remains valid JavaScript',()=>{
 const {spawnSync}=require('node:child_process');
 const result=spawnSync(process.execPath,['--check','--input-type=module'],{input:src,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.error?.message);
});
test('unconfigured annual leave displays as not set, not arbitrary 8 days',()=>{
 assert.match(src,/const annualNotSet = P\.hr\.al_days == null/);
 assert.match(src,/unconfigured \? "—"/);
 assert.match(src,/Belum ditetapkan oleh Admin/);
 assert.match(src,/annualNotSet \? null : e\.annual/);
});
test('explicit zero allowance is not treated as missing',()=>{
 assert.match(src,/P\.hr\.al_days == null/);
 assert.doesNotMatch(src,/!P\.hr\.al_days/);
 assert.match(src,/hr\.al_days != null \? \+hr\.al_days/);
});
test('extra and carry-over fields begin visually blank until base is configured',()=>{
 assert.match(src,/\["al_extra", "al_carry"\]\.includes\(k\) && P\.hr\.al_days == null && \+v === 0\) v = ""/);
 assert.match(src,/Cuti tahunan asas \(isi selepas pendaftaran\)/);
});
test('existing annual leave calculations and approved leave history are not reset',()=>{
 assert.match(src,/return \{ annual: al \+ \(\+hr\.al_extra \|\| 0\) \+ \(\+hr\.al_carry \|\| 0\)/);
 assert.match(src,/const used = sum\(k, "approved"\)/);
 const leaveUi=src.slice(src.indexOf('function leaveView()'),src.indexOf('function leaveView()')+3600);
 assert.doesNotMatch(leaveUi,/\.delete\(\)|\.truncate\(\)/);
});
test('PDF matches unconfigured status and legal entitlement is preserved',()=>{
 assert.match(src,/h\.al_days == null \? "Belum ditetapkan"/);
 assert.match(src,/tidak menafikan hak minimum cuti pekerja/);
 assert.match(src,/Akta Kerja 1955/);
});
test('HR asset version is bumped on app and module import',()=>{
 assert.match(staff,/staff-profile\.js\?v=\d+(?:\.\d+)*/);
 assert.match(html,/import\('\.\/js\/staff\.js\?v=\d+(?:\.\d+)*'\)/);
});
