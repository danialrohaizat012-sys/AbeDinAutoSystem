const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const lib=require('../assets/vendor/pdf-lib.min.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('legacy archive branding keeps original content streams and PDF bytes',async()=>{
 const {brandedCopy,originalStreams}=await import('../supabase/functions/delivery-order-esign/do-brand-archive.mjs');
 for(const [top,height] of [[30,65],[22,58]]){
 const doc=await lib.PDFDocument.create(),p=doc.addPage([595.28,841.89]),f=await doc.embedFont(lib.StandardFonts.Helvetica);
 p.drawRectangle({x:34,y:841.89-top-height,width:527.28,height,color:lib.rgb(.13,.13,.13)});
 p.drawText('ABE DIN AUTO',{x:47,y:780,size:12,font:f});p.drawText('SSM: 003842956-V',{x:400,y:770,size:8,font:f});
 p.drawText('LEGACY TERMS AND SIGNATURE',{x:40,y:500,size:10,font:f});
 const original=Buffer.from(await doc.save()).toString('base64'),a=await lib.PDFDocument.load(original);
 const out=await brandedCopy(lib,original);assert.equal(out.reformatted,true);assert.equal(out.original_pdf,original);
 const b=await lib.PDFDocument.load(out.pdf);assert.equal(b.getPageCount(),1);
 assert.ok(originalStreams(lib,a,a.getPage(0)).every(s=>originalStreams(lib,b,b.getPage(0)).some(t=>Buffer.from(s).equals(Buffer.from(t)))));
 assert.equal((await brandedCopy(lib,out.pdf)).reformatted,false);
 }
});
test('signed archive is never overwritten during read and all share paths use the same copy helper',()=>{
 const e=read('supabase/functions/delivery-order-esign/index.ts'),s=read('supabase/functions/delivery-order-share/index.ts');
 assert.match(e,/safeBrandedCopy\(PDFLib,old\.signed_pdf\)/);assert.match(e,/safeBrandedCopy\(PDFLib,row\.signed_pdf\)/);assert.match(s,/safeBrandedCopy\(PDFLib,pdf\)/);
 assert.equal(read('supabase/functions/delivery-order-esign/do-brand-archive.mjs'),read('supabase/functions/delivery-order-share/do-brand-archive.mjs'));
 assert.match(read('do.html'),/data\.original_pdf/);
});