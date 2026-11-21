import test from "node:test";
import assert from "node:assert/strict";
import { createAgentApi } from "../js/agent-network-api.mjs";

function mockSupabase({user={id:"user-A",email:"agent@example.com",email_confirmed_at:"2026-01-01T00:00:00Z"}, rows={}}={}) {
  const calls=[];
  const state={};
  function chain(table){
    const query={};
    const api={
      insert(payload){query.operation="insert";query.payload=payload;return api;},
      select(columns){query.columns=columns;return api;},
      eq(column,value){(query.eq ||= {})[column]=value;return api;},
      order(){return api;},
      limit(){return Promise.resolve({data:rows[table]??[],error:null});},
      single(){calls.push({table,...query});return Promise.resolve({data:{id:"new-1",status:"pending"},error:null});},
      maybeSingle(){calls.push({table,...query});return Promise.resolve({data:rows[table]??null,error:null});}
    };
    return api;
  }
  return {client:{auth:{getUser:async()=>({data:{user},error:null})},from:table=>chain(table)},calls};
}
test("wrong project is blocked before any API call",()=>{
  const {client,calls}=mockSupabase();
  assert.throws(()=>createAgentApi(client,{projectRef:"abqrgiebeoyzowvxeggj"}),/sales project/);
  assert.equal(calls.length,0);
});
test("verified agent can prepare own pending application",async()=>{
  const {client,calls}=mockSupabase();
  const api=createAgentApi(client,{projectRef:"buzpdyvvoiqgbeventwm"});
  await api.apply({full_name:"Ahmad Osman",phone:"0123456789",email:"agent@example.com",state:"Kelantan"});
  assert.equal(calls[0].table,"agent_applications");
  assert.equal(calls[0].operation,"insert");
  assert.equal(calls[0].payload.user_id,"user-A");
  assert.equal(calls[0].payload.status,"pending");
});
test("unverified user cannot submit",async()=>{
  const {client,calls}=mockSupabase({user:{id:"user-A",email:"agent@example.com"}});
  await assert.rejects(()=>createAgentApi(client,{projectRef:"buzpdyvvoiqgbeventwm"}).apply({
    full_name:"Ahmad Osman",phone:"0123456789",email:"agent@example.com",state:"Kelantan"
  }),/sahkan e-mel/);
  assert.equal(calls.length,0);
});
test("email mismatch is rejected before database write",async()=>{
  const {client,calls}=mockSupabase();
  await assert.rejects(()=>createAgentApi(client,{projectRef:"buzpdyvvoiqgbeventwm"}).apply({
    full_name:"Ahmad Osman",phone:"0123456789",email:"other@example.com",state:"Kelantan"
  }),/mesti sama/);
  assert.equal(calls.length,0);
});
test("lead requires active agent and customer consent",async()=>{
  const {client,calls}=mockSupabase({rows:{agent_profiles:{id:"agent-1",status:"active"}}});
  const api=createAgentApi(client,{projectRef:"buzpdyvvoiqgbeventwm"});
  await assert.rejects(()=>api.createLead({agentId:"agent-1",customerName:"Ali",customerPhone:"0123456789",consentConfirmed:false}),/Persetujuan/);
  assert.equal(calls.filter(c=>c.table==="agent_leads").length,0);
});
test("another agent cannot be passed as owner",async()=>{
  const {client,calls}=mockSupabase({rows:{agent_profiles:{id:"agent-1",status:"active"}}});
  const api=createAgentApi(client,{projectRef:"buzpdyvvoiqgbeventwm"});
  await assert.rejects(()=>api.createLead({agentId:"agent-2",customerName:"Ali",customerPhone:"0123456789",consentConfirmed:true}),/ejen aktif/);
  assert.equal(calls.filter(c=>c.table==="agent_leads").length,0);
});
test("reads are scoped to user and no direct table mutations are exposed",async()=>{
  const {client,calls}=mockSupabase();
  const api=createAgentApi(client,{projectRef:"buzpdyvvoiqgbeventwm"});
  await api.application();
  await api.profile();
  assert.equal(calls[0].eq.user_id,"user-A");
  assert.equal(calls[1].eq.user_id,"user-A");
  for(const forbidden of ["approveAgent","updateCommission","markPaid","updatePayout","updateProfile"]){
    assert.equal(forbidden in api,false);
  }
});
