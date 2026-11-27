import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const OWNER='11111111-1111-4111-8111-111111111111',AGENT='22222222-2222-4222-8222-222222222222',
 STAFF='33333333-3333-4333-8333-333333333333',OFF='44444444-4444-4444-8444-444444444444',NONE='55555555-5555-4555-8555-555555555555';

// Jalankan Edge Function sebenar dengan Supabase tiruan.
const dir=mkdtempSync(join(tmpdir(),'agent-fn-'));
const file=join(dir,'fn.ts');
writeFileSync(file,read('supabase/functions/agent-portal-admin/index.ts')
 .replace(/^import \{ createClient \} from "npm:[^"]+";/,'const createClient=(...a:unknown[])=>(globalThis as any).__createClient(...a);'));
let handler,state;
globalThis.Deno={serve:h=>{handler=h},env:{get:k=>k==='SUPABASE_URL'?'https://buzpdyvvoiqgbeventwm.supabase.co':'test-key'}};
globalThis.__createClient=()=>({
 auth:{
  getUser:async token=>({data:{user:{id:token,email_confirmed_at:'2026-01-01'}},error:null}),
  admin:{
   getUserById:async id=>({data:{user:{id,email:'ejen@contoh.com'}},error:null}),
   updateUserById:async(id,attrs)=>{state.updates.push({id,attrs});return{error:state.updateFails?{message:'x'}:null}}
  }
 },
 from:table=>{let id;const q={
  select:()=>q,eq:(_,v)=>{id=v;return q},
  maybeSingle:async()=>{
   if(table==='profiles')return{data:id===OWNER?{id,role:'owner',enabled:true}:id===STAFF?{id,role:'sales_advisor',enabled:true}:null,error:null};
   if(table==='agent_profiles')return{data:[AGENT,STAFF,OWNER].includes(id)?{id:'ap-'+id,status:'active'}:id===OFF?{id:'ap',status:'suspended'}:null,error:null};
   return{data:null,error:null};
  },
  insert:async row=>{if(state.auditFails)return{error:{message:'x'}};state.audit.push(row);return{error:null}}
 };return q}
});
await import(pathToFileURL(file).href);
async function call(actor,target,opts={}){
 state={updates:[],audit:[],...opts};
 const r=await handler(new Request('https://x/f',{method:'POST',headers:{authorization:'Bearer '+actor,'content-type':'application/json'},
  body:JSON.stringify({action:'set_temp_password',agent_user_id:target})}));
 return{status:r.status,body:await r.json()};
}
test('Owner mendapat kata laluan sementara untuk ejen, direkod tanpa kata laluan',async()=>{
 const r=await call(OWNER,AGENT);
 assert.equal(r.status,200);
 assert.match(r.body.temporary_password,/^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/);
 assert.equal(r.body.email,'ejen@contoh.com');
 assert.deepEqual(state.updates,[{id:AGENT,attrs:{password:r.body.temporary_password}}]);
 assert.deepEqual(state.audit.map(a=>a.action),['agent_temp_password_requested','agent_temp_password_set']);
 assert.ok(!JSON.stringify(state.audit).includes(r.body.temporary_password));
});
test('Setiap kata laluan berbeza dan cukup kuat',async()=>{
 const seen=new Set();
 for(let i=0;i<200;i++){const p=(await call(OWNER,AGENT)).body.temporary_password;seen.add(p);
  assert.ok(/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p));}
 assert.equal(seen.size,200);
});
test('Bukan owner ditolak',async()=>{
 for(const actor of [AGENT,STAFF]){const r=await call(actor,AGENT);assert.equal(r.status,403);assert.equal(state.updates.length,0)}
});
test('Staff, owner, ejen tidak aktif, bukan ejen dan ID rosak ditolak',async()=>{
 for(const t of [STAFF,OWNER,OFF,NONE,'abc',undefined]){const r=await call(OWNER,t);assert.equal(r.status,400,String(t));assert.equal(state.updates.length,0);assert.equal(r.body.temporary_password,undefined)}
});
test('Audit gagal: kata laluan tidak ditukar',async()=>{
 const r=await call(OWNER,AGENT,{auditFails:true});
 assert.equal(r.status,500);assert.equal(state.updates.length,0);
});
test('Tukar gagal: tiada kata laluan dipulangkan',async()=>{
 const r=await call(OWNER,AGENT,{updateFails:true});
 assert.equal(r.status,500);assert.equal(r.body.temporary_password,undefined);
 assert.equal(state.audit.at(-1).action,'agent_temp_password_failed');
});
test('Panel mempunyai butang dan parse dengan betul',()=>{
 const m=read('js/agent-admin-panel.js');
 assert.match(m,/request\('set_temp_password',\{agent_user_id:g\.user_id\}\)/);
 assert.doesNotMatch(m,/localStorage[^\n]*temporary_password|console\.[a-z]+\([^\n]*temporary_password/);
 execFileSync(process.execPath,['--check',new URL('../js/agent-admin-panel.js',import.meta.url).pathname]);
});
