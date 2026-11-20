const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const start=app.indexOf('function receiptWhatsApp(');
const end=app.indexOf('function isoDate(',start);
assert.ok(start>0&&end>start,'Receipt WhatsApp function should exist');
const src=app.slice(start,end);
test('receipt share function remains syntactically valid',()=>{
 assert.doesNotThrow(()=>new Function(src));
});
test('shows a green customer-chat button plus PDF sharing and download',()=>{
 assert.match(src,/data-wa-pdf-direct/);
 assert.match(src,/data-wa-open class="ada-wa-btn"/);
 assert.match(src,/data-wa-dl/);
 assert.match(src,/Kongsi PDF \(pilih penerima\)/);
});
test('PDF-only share includes actual receipt file and not the message body',()=>{
 assert.match(src,/const payload=\{files:\[file\],title:'Resit '\+no\}/);
 assert.doesNotMatch(src,/payload\.text/);
 assert.match(src,/querySelector\('\[data-wa-pdf-direct\]'\)\.addEventListener\('click',shareReceipt\)/);
});
test('PDF sharing does not falsely claim WhatsApp delivery',()=>{
 assert.doesNotMatch(src,/msg\('Resit dikongsi\.'\)/);
 assert.match(src,/does not[\s\S]*confirm delivery/);
});
test('unsupported browser downloads receipt, user must attach manually',()=>{
 assert.match(src,/if\(!canFile\|\|typeof navigator\.share!=='function'\)/);
 assert.match(src,/dl\(\)/);
 assert.match(src,/lampirkan melalui WhatsApp/);
});
test('document preserves customer phone and PDF identity',()=>{
 assert.match(src,/waPhone\(c\.phone\)/);
 assert.match(src,/new File\(\[blob\],fname,\{type:'application\/pdf'\}\)/);
 assert.match(src,/e\?\.name==='AbortError'/);
});
test('customer action opens the saved number with the edited message on any browser',()=>{
 const receiptSource=app.slice(app.indexOf('function waPhone('),end);
 const message='Bayaran RM10 & resit #1';
 for(const canShare of [true,false]){
  const controls=new Map();
  const visited=[];
  const modal={
   querySelector(selector){
    if(selector==='[name=watext]')return {value:message};
    if(!controls.has(selector))controls.set(selector,{addEventListener(){}});
    return controls.get(selector);
   }
  };
  const render=new Function('navigator','window','File','safe','cloudModal',
    receiptSource+'\nreturn receiptWhatsApp;')(
    {canShare:()=>canShare},{location:{assign:url=>visited.push(url)}},
    class {},String,()=>modal);
  for(const phone of ['012-345 6789','+60 12-345 6789','']){
   render({c:{phone},v:{}});
   controls.get('[data-wa-open]').onclick();
  }
  const expected='https://wa.me/60123456789?text='+encodeURIComponent(message);
  assert.deepEqual(visited,[expected,expected]);
 }
});
