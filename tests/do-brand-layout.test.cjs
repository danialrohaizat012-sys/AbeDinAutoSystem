const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('all three DO generators use identical layout, logo, and legal terms',()=>{
 const ui=read('js/do-pdf.mjs');assert.equal(ui,read('supabase/functions/delivery-order-esign/do-pdf.mjs'));assert.equal(ui,read('supabase/functions/delivery-order-share/do-pdf.mjs'));assert.match(ui,/doc\.embedPng\('data:image\/png;base64,/);assert.match(ui,/page\.drawImage\(logo/);
});
test('signed and unsigned DO fit A4, preserve all seven clauses',async()=>{
 const lib=require('../assets/vendor/pdf-lib.min.js'),{buildDeliveryOrderPdf,DO_TERMS}=await import('../js/do-pdf.mjs');assert.equal(DO_TERMS.clauses.length,7);
 for(const signed of [false,true]){const out=await buildDeliveryOrderPdf(lib,{x:{id:'demo'},v:{plate:'DEMO'},c:{full_name:'Demo'},handover:signed?{condition:'baik',keys:'2',docs:['geran'],accessories:'Radio',notes:'Catatan',signature:[[[.1,.2],[.8,.9]]],signedAt:'2026-11-27T02:00:00Z'}:{}});const doc=await lib.PDFDocument.load(out.bytes);assert.equal(doc.getPageCount(),1)}
});