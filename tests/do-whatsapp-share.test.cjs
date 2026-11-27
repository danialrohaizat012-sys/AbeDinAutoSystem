const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
test('message is accurate for unsigned and signed documents, without IC or address',async()=>{
 const {deliveryShareMessage,deliverySharePayload}=await import('../js/do-esign.mjs');
 const f={name:'Demo',model:'Perodua Axia',plate:'DEMO123',no:'DO-DEMO',ic:'SECRET',address:'PRIVATE'};
 const signed=deliveryShareMessage(f,true),unsigned=deliveryShareMessage(f,false);
 assert.match(signed,/telah ditandatangani/);assert.match(unsigned,/belum ditandatangani/);
 for(const msg of [signed,unsigned]){assert.match(msg,/Demo/);assert.match(msg,/DEMO123/);assert.match(msg,/DO-DEMO/);assert.doesNotMatch(msg,/SECRET|PRIVATE/)}
 const file={name:'DO-DEMO.pdf'};assert.deepEqual(deliverySharePayload(file,'Mesej disunting'),{files:[file],title:'DO Abe Din Auto',text:'Mesej disunting'});
});
test('both staff signed and unsigned share actual PDF; archived document is not regenerated',()=>{
 const app=read('app.html'),ui=read('js/do-esign.mjs');
 assert.match(app,/mountDeliveryShare\(share\.querySelector/);
 assert.match(ui,/mountDeliveryShare\(host,\{file:pdfFile\(data\)/);
 assert.match(ui,/pdfActions\(o\.querySelector\('\[data-pdf\]'\),current,phone,true\)/);
 assert.match(ui,/navigator\.share\(payload\)/);
 assert.match(ui,/navigator\.canShare\?\.\(payload\)/);
 assert.match(ui,/PDF dimuat turun/);
});
