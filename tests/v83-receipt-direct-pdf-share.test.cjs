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
test('adds one PDF-only sharing button alongside original share and download',()=>{
 assert.match(src,/data-wa-pdf-direct/);
 assert.match(src,/data-wa-share/);
 assert.match(src,/data-wa-open/);
 assert.match(src,/data-wa-dl/);
 assert.match(src,/Kongsi PDF terus \(tanpa mesej\)/);
});
test('PDF-only share includes actual receipt file and not the message body',()=>{
 assert.match(src,/const payload=\{files:\[file\],title:'Resit '\+no\}/);
 assert.match(src,/if\(withMessage\)payload\.text=msgText\(\)/);
 assert.match(src,/querySelector\('\[data-wa-pdf-direct\]'\)\.addEventListener\('click',\(\)=>shareReceipt\(false\)\)/);
 assert.match(src,/querySelector\('\[data-wa-share\]'\)\?\.addEventListener\('click',\(\)=>shareReceipt\(true\)\)/);
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
