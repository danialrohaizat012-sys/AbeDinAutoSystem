const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/tiktok-lead-storage.js');
const {save,whatsapp}=globalThis.AdaTikTokStorage;
const row={valid:true,duplicate:false,name:'Demo',phone:'+60123456789',city:'Klang'};
test('requires authenticated user',async()=>{await assert.rejects(save({auth:{getUser:async()=>({data:{user:null}})}},[row]),/log masuk/);});
test('duplicate-safe import and assignment',async()=>{let sent;const client={auth:{getUser:async()=>({data:{user:{id:'demo'}}})},from(table){assert.equal(table,'tiktok_leads');return {upsert(records,options){sent=records;assert.deepEqual(options,{onConflict:'phone',ignoreDuplicates:true});return {select:async()=>({data:[],error:null})};}};}};assert.deepEqual(await save(client,[row,row]),{submitted:2,inserted:0,skipped:2});assert.equal(sent[0].assigned_to,'demo');});
test('WhatsApp link validates number',()=>{assert.equal(whatsapp(row.phone),'https://wa.me/60123456789');assert.throws(()=>whatsapp('123'));});

test('first valid row wins; duplicate rows and existing phones are skipped',async()=>{let sent;const existing='+60123456789';const fresh={...row,phone:'+60198765432',name:'First'};const client={auth:{getUser:async()=>({data:{user:{id:'demo'}}})},from(){return {upsert(records,opts){sent=records;assert.equal(opts.ignoreDuplicates,true);return {select:async()=>({data:records.filter(r=>r.phone!==existing).map(()=>({id:'new'})),error:null})};}};}};assert.deepEqual(await save(client,[row,{...row,duplicate:true},fresh,{...fresh,name:'Later'},{...fresh,valid:false}]),{submitted:4,inserted:1,skipped:3});assert.equal(sent.length,2);assert.equal(sent[1].name,'First');});
