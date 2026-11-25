const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/tiktok-lead-storage.js');
const {save,whatsapp}=globalThis.AdaTikTokStorage;
const row={valid:true,duplicate:false,name:'Demo',phone:'+60123456789',city:'Klang'};
test('requires authenticated user',async()=>{await assert.rejects(save({auth:{getUser:async()=>({data:{user:null}})}},[row]),/log masuk/);});
test('duplicate-safe import and assignment',async()=>{let sent;const client={auth:{getUser:async()=>({data:{user:{id:'demo'}}})},from(table){assert.equal(table,'tiktok_leads');return {upsert(records,options){sent=records;assert.deepEqual(options,{onConflict:'phone',ignoreDuplicates:true});return {select:async()=>({data:[],error:null})};}};}};assert.deepEqual(await save(client,[row,row]),{submitted:1,inserted:0,skipped:1});assert.equal(sent[0].assigned_to,'demo');});
test('WhatsApp link validates number',()=>{assert.equal(whatsapp(row.phone),'https://wa.me/60123456789');assert.throws(()=>whatsapp('123'));});
