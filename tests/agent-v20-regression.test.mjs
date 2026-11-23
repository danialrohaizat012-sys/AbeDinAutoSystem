import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createV20AgentData} from '../js/agent-v20-data.mjs';
const root=new URL('../',import.meta.url);
const app=readFileSync(new URL('app.html',root),'utf8');
const portal=readFileSync(new URL('agent-v20.html',root),'utf8');
function mock({user='u1',profile={id:'a1'},rows=[]}={}){
 const calls=[];
 const db={auth:{getUser:async()=>({data:{user:user?{id:user}:null},error:null})},
 from(table){const q={select(columns){calls.push({table,columns});return q},eq(key,value){calls.push({table,key,value});return q},order(){return q},limit:async()=>({data:rows,error:null}),maybeSingle:async()=>({data:profile,error:null})};return q}};
 return {db,calls};
}
test('all agent data reads filter by authenticated agent id',async()=>{
 const {db,calls}=mock();const api=createV20AgentData(db);
 for(const name of ['leads','commissions','payouts'])await api[name]();
 assert.equal(calls.filter(c=>c.key==='agent_id'&&c.value==='a1').length,3);
 assert.equal(calls.filter(c=>c.key==='user_id'&&c.value==='u1').length,3);
 assert.equal(calls.filter(c=>c.key==='status'&&c.value==='active').length,3);
});
test('unauthenticated and inactive agents cannot read',async()=>{
 const unauth=mock({user:null});await assert.rejects(createV20AgentData(unauth.db).leads(),/Login required/);
 const inactive=mock({profile:null});await assert.rejects(createV20AgentData(inactive.db).payouts(),/Active agent required/);
});
test('agent portal does not write to database',()=>{
 const src=readFileSync(new URL('js/agent-v20-data.mjs',root),'utf8');
 assert.doesNotMatch(src,/\.(insert|update|upsert|delete|rpc)\s*\(/);
});
test('main application only adds isolated agent link and check',()=>{
 assert.match(app,/id="ada-agent-v20-link"[^>]*hidden/);
 assert.match(app,/\.eq\('status','active'\)\.maybeSingle\(\)/);
 assert.match(portal,/createV20AgentData/);
 assert.match(portal,/signInWithPassword/);
});

test('portal only exposes navigation after active agent lookup',()=>{
 assert.match(portal,/from\('agent_profiles'\)\.select\('id'\)/);
 assert.match(portal,/tabs\.hidden=!allowed/);
 assert.match(portal,/refreshButton\.hidden=!allowed/);
 assert.match(portal,/if\(allowed\)load\(\)/);
});

test('proposed RLS requires active agent for each protected read',()=>{
 const sql=readFileSync(new URL('supabase/migrations/20261123_agent_v20_active_read_policies.sql',root),'utf8');
 for(const table of ['agent_leads','agent_commissions','agent_payouts','agent_payout_items']){
  const start=sql.indexOf('create policy '+table+'_read_own');
  assert.ok(start>=0,'missing read policy for '+table);
  const end=sql.indexOf(';',start);
  const policy=sql.slice(start,end);
  assert.match(policy,/a\.user_id\s*=\s*\(select auth\.uid\(\)\)/);
  assert.match(policy,/a\.status\s*=\s*'active'/);
  if(table==='agent_payout_items'){
   assert.match(policy,/p\.id\s*=\s*agent_payout_items\.payout_id/);
   assert.match(policy,/a\.id\s*=\s*p\.agent_id/);
  }else assert.match(policy,/a\.id\s*=\s*agent_(?:leads|commissions|payouts)\.agent_id/);
 }
});

test('simulated agent accounts remain scoped to their own rows',async()=>{
 const records=[
  {id:'lead-a',agent_id:'agent-a',created_at:'2026-11-23'},
  {id:'lead-b',agent_id:'agent-b',created_at:'2026-11-23'}
 ];
 function scopedClient(userId,agentId,status='active'){
  let table,filters=[];
  const q={
   select(){return q},
   eq(k,v){filters.push([k,v]);return q},
   order(){return q},
   async maybeSingle(){
    return {data:status==='active'?{id:agentId}:null,error:null};
   },
   async limit(){
    const own=records.filter(row=>filters.some(([k,v])=>k==='agent_id'&&v===row.agent_id));
    return {data:own,error:null};
   }
  };
  return {
   auth:{getUser:async()=>({data:{user:{id:userId}},error:null})},
   from(t){table=t;filters=[];return q}
  };
 }
 const a=await createV20AgentData(scopedClient('user-a','agent-a')).leads();
 const b=await createV20AgentData(scopedClient('user-b','agent-b')).leads();
 assert.deepEqual(a.map(x=>x.id),['lead-a']);
 assert.deepEqual(b.map(x=>x.id),['lead-b']);
 await assert.rejects(createV20AgentData(scopedClient('user-a','agent-a','inactive')).leads(),/Active agent required/);
});
