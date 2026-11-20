const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/app.css'),'utf8');
const sql=fs.readFileSync(path.resolve(__dirname,'../V83_NEW_SALE_DETAILS.sql'),'utf8');
const start=app.indexOf('function showSaleForm(');
const end=app.indexOf('function showPaymentForm(',start);
const editStart=app.indexOf('function showEditSaleForm(');
const newSale=app.slice(start,end);
const editSale=app.slice(editStart,start);
assert.ok(start>0&&end>start&&editStart>0);
test('Jual Kereta contains all editable sale and customer details',()=>{
 for(const field of ['customer_id','agreed_price','sale_date','c_name','c_phone','c_email']){
  assert.match(editSale,new RegExp('name=\\\\"'+field+'\\\\"'));
  assert.match(newSale,new RegExp('name=\\\\"'+field+'\\\\"'));
 }
 assert.match(newSale,/Maklumat Jualan/);
 assert.match(newSale,/Pelanggan baru/);
 assert.match(newSale,/Pilih sedia ada/);
});
test('first payment matches Edit Jualan detail fields',()=>{
 for(const field of ['pdate','pkind','pmethod','pamount','ploanbank','pref','pnote']){
  assert.ok(editSale.includes("'"+field+"'")||editSale.includes('name=\\\\"'+field+'\\\\"'),'edit has '+field);
  assert.ok(newSale.includes("'"+field+"'")||newSale.includes('name=\\\\"'+field+'\\\\"'),'new has '+field);
 }
 assert.match(newSale,/Rekod Bayaran \(Pilihan\)/);
 assert.match(newSale,/name=\\\\"record_payment\\\\"/);
 assert.match(newSale,/data-new-sale-pay\\" hidden disabled/);
 assert.match(newSale,/payBox\.disabled=!payToggle\.checked/);
});
test('new sale saves sale and optional payment in a single atomic RPC',()=>{
 assert.match(newSale,/client\.rpc\('create_vehicle_sale_with_details',args\)/);
 assert.match(newSale,/p_sale_date:f\.get\('sale_date'\)/);
 assert.match(newSale,/p_payment_kind:hasPay\?f\.get\('pkind'\):null/);
 assert.match(newSale,/p_payment_amount:amount/);
 assert.match(newSale,/p_paid_date:hasPay/);
 assert.match(sql,/v_sale := public\.create_vehicle_sale\(p_vehicle_id,p_customer_id,p_agreed_price\)/);
 assert.match(sql,/v_payment := public\.record_sale_payment\(/);
 assert.match(sql,/if p_payment_kind is not null then/);
 assert.match(sql,/if p_sale_date is not null then/);
 assert.match(sql,/perform public\.update_customer_details/);
});
test('authorization, payment limits, and date validation are enforced server-side',()=>{
 assert.match(sql,/auth\.uid\(\) is null/);
 assert.match(sql,/public\.current_staff_role\(\) not in \('owner','sales_advisor'\)/);
 assert.match(sql,/p_payment_amount > p_agreed_price/);
 assert.match(sql,/p_sale_date > v_today/);
 assert.match(sql,/p_paid_date > v_today/);
 assert.match(sql,/revoke all on function/);
 assert.match(sql,/from public/);
 assert.match(sql,/from anon/);
 assert.match(sql,/to authenticated/);
 assert.match(sql,/security definer/);
 assert.match(sql,/set search_path = public, pg_temp/);
});
test('payment method and bank are stored in edit-compatible format',()=>{
 assert.match(sql,/v_method = 'Loan Bank'/);
 assert.match(sql,/Loan Bank · /);
 assert.match(sql,/\[Kaedah: /);
 assert.match(newSale,/wireLoan\(o\)/);
 assert.match(newSale,/wireRefGen\(o,/);
 assert.match(newSale,/genPayRef\(v\.plate\)/);
});
test('client validates before a new customer is inserted',()=>{
 const validation=newSale.indexOf("if(!Number.isFinite(price)");
 const insertion=newSale.indexOf("client.from('customers').insert(");
 assert.ok(validation>0&&insertion>validation);
 assert.match(newSale,/Jumlah bayaran mesti melebihi sifar/);
 assert.match(newSale,/Tarikh jualan atau bayaran tidak boleh pada masa hadapan/);
});
test('mobile payment checkbox and hidden form are scoped',()=>{
 assert.match(css,/\.ada-form \.ada-sale-pay-toggle input\[type="checkbox"\]/);
 assert.match(css,/\.ada-form \[data-new-sale-pay\]\[hidden\]\{display:none!important\}/);
 assert.match(css,/@media\(max-width:520px\)/);
});
