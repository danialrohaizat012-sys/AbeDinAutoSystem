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
