const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../js/checklist.js'),'utf8');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
function extract(start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'function '+start+' exists');
 return src.slice(a,b);
}
const dashboard=extract('function bindDashboardSearch(){','function viewPantau(){');
const inventory=extract('function bindKereta(){','/* --- Rekod --- */');
test('inspection module remains syntactically valid',()=>{
 assert.doesNotThrow(()=>new Function(src.replace(/^export /gm,'')));
});
test('all visible inspection card actions bind using querySelectorAll',()=>{
 for(const part of [dashboard,inventory]){
  for(const key of ['start','edit','cost','rec']){
   assert.match(part,new RegExp('\\$\\$\\("[^"]*\\[data-'+key+'\\]"\\)\\.forEach'));
   assert.doesNotMatch(part,new RegExp('(?<!\\$)\\$\\("[^"]*\\[data-'+key+'\\]"\\)\\.forEach'));
  }
 }
});
function simulate(section){
 const buttons=['start','edit','cost','rec'].map(key=>({dataset:{[key]:'selected-'+key},onclick:null}));
 const queries=Object.fromEntries(buttons.map(b=>['[data-'+Object.keys(b.dataset)[0]+']',b]));
 const input={value:'',oninput:null},select={value:'perlu',onchange:null};
 const grid={innerHTML:''},meta={textContent:''};
 const panel={
  '#ada-ins-search-q':input,'#ada-ins-search-status':select,
  '#ada-ins-search-results':grid,'#ada-ins-search-meta':meta,
  '#iq':input,'#cgrid':grid
 };
 const calls=[];
 const single=selector=>panel[selector]||null;
 const multi=selector=>{
  if(selector==='[data-if]')return [];
  const key=Object.keys(queries).find(q=>selector.endsWith(q));
  return key?[queries[key]]:[];
 };
 const S={vehicles:[{id:'v1',plate:'ABC123',vehicle_id:'ADA-0001',status:'available',make:'Perodua',model:'Myvi'}],dashboardSearch:{q:'',status:'perlu'},inv:{q:'',f:''}};
 const carState=()=>({k:'belum',t:'Belum diperiksa',r:null});
 const inspectionSearchRows=()=>[{v:S.vehicles[0],s:carState()}];
 const card=()=>'<button>Periksa</button>';
 const func=new Function('$','$$','S','inspectionSearchRows','carCard','carState','carName',
 'openForCar','openForm','editInspectionCost','go','esc','render',
 section+';return '+(section.includes('function bindKereta')?'bindKereta':'bindDashboardSearch'));
 const args=[single,multi,S,inspectionSearchRows,card,carState,v=>v.make+' '+v.model,
 id=>calls.push('start:'+id),id=>calls.push('edit:'+id),id=>calls.push('cost:'+id),(view,id)=>calls.push('rec:'+view+':'+id),x=>x,()=>{}];
 func(...args)();
 for(const btn of buttons){
  assert.equal(typeof btn.onclick,'function','click handler on '+Object.keys(btn.dataset)[0]);
  btn.onclick();
 }
 assert.deepEqual(calls,['start:selected-start','edit:selected-edit','cost:selected-cost','rec:detail:selected-rec']);
}
test('Ringkasan search binds all four click handlers without TypeError',()=>simulate(dashboard));
test('Kereta list binds all four click handlers without TypeError',()=>simulate(inventory));
test('module cache is refreshed for iPhone Safari',()=>{
 assert.match(app,/import\('\.\/js\/checklist\.js\?v=83\.11'\)/);
});
