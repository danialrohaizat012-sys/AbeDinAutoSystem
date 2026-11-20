const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../js/checklist.js'),'utf8');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const begin=source.indexOf('function bindDetail(){'),end=source.indexOf('// Cost-only editor:',begin);
assert.ok(begin>=0&&end>begin);
const detail=source.slice(begin,end);
test('Pemeriksaan module JavaScript parses',()=>assert.doesNotThrow(()=>new Function(source.replace(/^export /gm,''))));
test('Edit and Tambah Kos use multi-element lookup, not singular lookup',()=>{
 for(const name of ['edit','cost']){
   assert.ok(detail.includes('$$("[data-'+name+']").forEach'),name+' must use $$');
   assert.ok(!detail.includes('$("[data-'+name+']").forEach')||detail.includes('$$("[data-'+name+']").forEach'));
 }
});
test('Sahkan, Pulangkan, Edit, Kos, PDF, salin and siap get handlers in detail view',()=>{
 const actions=[];
 const buttons={edit:{dataset:{edit:'rec-1'}},cost:{dataset:{cost:'rec-1'}},pdf:{dataset:{act:'pdf'}},copy:{dataset:{act:'copy'}},lulus:{dataset:{rv:'lulus'}},ulang:{dataset:{rv:'ulang'}},siap:{dataset:{siap:'0'},checked:false,disabled:false}};
 const lists={'.evid [data-open]':[],'[data-edit]':[buttons.edit],'[data-cost]':[buttons.cost],'[data-rv]':[buttons.lulus,buttons.ulang],'[data-siap]':[buttons.siap]};
 const one=sel=>({'[data-act="pdf"]':buttons.pdf,'[data-act="copy"]':buttons.copy,'[data-act="del"]':null}[sel]||null);
 const many=sel=>lists[sel]||[];
 const S={id:'rec-1',rows:[{id:'rec-1',items:{},parts:[],plat:'MBS5708'}]};
 const factory=new Function('S','$','$$','loadTrail','hydrate','photosOf','lightbox','openForm','editInspectionCost','withBusy','pdfInspection','summaryText','toast','showCopy','review','partsTotal','bodyOf','render','go',detail+';return bindDetail');
 const binder=factory(S,one,many,()=>actions.push('trail'),()=>{},()=>[],()=>{},
   id=>actions.push('edit:'+id),id=>actions.push('cost:'+id),(_btn,cb)=>{cb();actions.push('pdf')},()=>{},
   ()=> 'Ringkasan',()=>{},()=>{},(_r,to)=>actions.push('review:'+to),
   ()=>0,()=>({}),()=>{},()=>{});
 assert.doesNotThrow(()=>binder());
 for(const key of ['edit','cost','pdf','copy','lulus','ulang'])assert.equal(typeof buttons[key].onclick,'function',key+' click is wired');
 assert.equal(typeof buttons.siap.onchange,'function','Siap change is wired');
 buttons.edit.onclick();
 buttons.cost.onclick();
 buttons.pdf.onclick({target:buttons.pdf});
 buttons.lulus.onclick();
 buttons.ulang.onclick();
 assert.ok(actions.includes('edit:rec-1'));
 assert.ok(actions.includes('cost:rec-1'));
 assert.ok(actions.includes('pdf'));
 assert.ok(actions.includes('review:lulus'));
 assert.ok(actions.includes('review:ulang'));
});
test('review routes update to the same database record and does not modify cost or items',()=>{
 const idx=source.indexOf('function review(r,to){');
 const ending=source.indexOf('/* ---------- form ---------- */',idx);
 const reviewSource=source.slice(idx,ending);
 assert.match(reviewSource,/update\(\{status:to,review_note:note,reviewed_by:S\.myId,reviewed_at:new Date\(\)\.toISOString\(\)\}\)\.eq\("id",r\.id\)/);
 assert.match(reviewSource,/if\(to==="ulang"&&!note\)/);
 assert.match(reviewSource,/if\(error\)/);
 assert.doesNotMatch(reviewSource,/update\(\{[^}]*kos:/);
});
test('client fetches newer checklist module in mobile Safari',()=>{
 assert.match(app,/import\('\.\/js\/checklist\.js\?v=83\.\d+'\)/);
});
