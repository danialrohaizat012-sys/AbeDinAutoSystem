const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.html'),'utf8');
const server=fs.readFileSync(path.join(__dirname,'../supabase/functions/scan-customer/index.ts'),'utf8');
test('normalizes explicit fields and rejects malformed values',async()=>{
 const {normalizeCustomer}=await import('../supabase/functions/scan-customer/normalize.mjs');
 assert.deepEqual(normalizeCustomer({full_name:'CONTOH BIN DEMO',ic:'000000000000',phone:'012-0000000',email:'demo@example.invalid',address:'do not return'}),{full_name:'CONTOH BIN DEMO',ic:'000000-00-0000',phone:'0120000000',email:'demo@example.invalid'});
 assert.deepEqual(normalizeCustomer({full_name:'123',ic:'123',phone:'abc',email:'nope'}),{full_name:'',ic:'',phone:'',email:''});
});
test('scan only new-customer form; manual save remains unchanged',()=>{
 assert.ok(app.includes('data-customer-consent'));
 assert.ok(app.includes('setMode(mode);wireCustomerScan(fm);'));
 assert.ok(app.includes("client.functions.invoke('scan-customer'"));
 assert.ok(app.includes('if(input.value.trim()){skipped++;continue}'));
 assert.ok(app.includes("client.from('customers').insert("));
 assert.ok(app.includes("client.rpc('create_vehicle_sale_with_details',args)"));
});
test('endpoint requires authenticated active sales role and consent before AI request',()=>{
 assert.ok(server.includes('admin.auth.getUser('));
 assert.ok(server.includes('p.enabled!==true'));
 assert.ok(server.includes('["owner","sales_advisor"].includes(p.role)'));
 assert.ok(server.indexOf('body?.consent!==true')<server.indexOf('https://api.anthropic.com/v1/messages'));
 assert.ok(server.includes('normalizeCustomer(read.input)'));
 assert.ok(!server.includes('console.log'));
});
