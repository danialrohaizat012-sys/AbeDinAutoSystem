// Sold implies completed handover in Abe Din Auto's operational workflow.
// Puspakom history remains auditable, and missing inspection records remain flagged.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/puspakom.js'),'utf8');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const i=source.indexOf('function nextStep(c) {');
const j=source.indexOf('const isAlert =',i);
assert.ok(i>=0&&j>i,'Puspakom nextStep exists');
const nextStep=new Function('todayStr','expiryInfo','find','STATUSES',source.slice(i,j)+';return nextStep')(
 ()=> '2026-11-20',()=>({expiry:'2026-11-30',left:10}),
 (statuses,v)=>statuses.find(x=>x.v===v)||statuses[0],
 [{v:'lulus',l:'Lulus'},{v:'tempah',l:'Booking'},{v:'gagal',l:'Gagal'},{v:'belum',l:'Belum tempah'}]);
const epStart=source.indexOf('const expiryPanel = c => {'),epEnd=source.indexOf('const fmtDate =',epStart);
assert.ok(epStart>0&&epEnd>epStart);
const expiryPanel=new Function('expiryInfo','VALID_DAYS','esc','fmtDate',source.slice(epStart,epEnd)+';return expiryPanel')(
 ()=>({left:10,elapsed:110,tone:'urgent',expiry:'2026-11-30'}),120,x=>String(x),x=>String(x));
test('Sold + Lulus is complete and no transfer-of-ownership reminder remains',()=>{
 const result=nextStep({vstatus:'sold',hasRecord:true,status:'lulus'});
 assert.equal(result.alert,false);
 assert.match(result.txt,/selesai/i);
 assert.doesNotMatch(result.txt,/perlu tukar milik|urus tukar milik|hari lagi|luput/i);
});
test('Sold + Lulus has no active booking expiry countdown',()=>{
 assert.equal(expiryPanel({vstatus:'sold',status:'lulus',date:'2026-11-17'}),'');
 assert.notEqual(expiryPanel({vstatus:'available',status:'lulus',date:'2026-11-17'}),'');
});
test('Sold without Puspakom record remains an audit warning, not falsely approved',()=>{
 const result=nextStep({vstatus:'sold',hasRecord:false,status:'belum'});
 assert.equal(result.alert,true);
 assert.match(result.txt,/rekod Puspakom tiada/i);
});
test('Sold with Booking or Gagal remains an audit discrepancy',()=>{
 for(const status of ['tempah','gagal']){
  const result=nextStep({vstatus:'sold',hasRecord:true,status});
  assert.equal(result.alert,true);
  assert.match(result.txt,/semak dokumen sejarah/i);
  assert.doesNotMatch(result.txt,/perlu tukar milik/i);
 }
});
test('non-Sold Puspakom Lulus still has the 120-day expiry display',()=>{
 assert.match(source,/if \(c\.vstatus === "sold" \|\| c\.status !== "lulus"\) return ""/);
 assert.match(source,/const who = c\.type === "B5"/);
});
test('Vehicle 360 hides Sold expiry yet preserves Puspakom information',()=>{
 assert.match(app,/effStatus\(v\)==='sold'\?'':pkExpiryView\(r\)/);
 assert.match(app,/tempoh booking tidak lagi dipantau/);
 assert.match(app,/import\('\.\/js\/puspakom\.js\?v=9'\)/);
});
