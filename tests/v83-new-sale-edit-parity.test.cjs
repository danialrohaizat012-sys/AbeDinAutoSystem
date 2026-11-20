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
assert.ok(start>0&&end>start&&editStart>0);
const newSale=app.slice(start,end);
const editSale=app.slice(editStart,start);
const includesField=(source,field)=>source.includes('name="'+field+'"')||source.includes("'"+field+"'");
test('Jual Kereta has sale and customer fields already found in Edit Jualan',()=>{
 for(const field of ['customer_id','agreed_price','sale_date','c_name','c_phone','c_email']){
  assert.ok(includesField(editSale,field),'Edit Jualan field: '+field);
  assert.ok(includesField(newSale,field),'Jual Kereta field: '+field);
 }
 assert.ok(newSale.includes('Maklumat Jualan'));
 assert.ok(newSale.includes('Pelanggan baru'));
 assert.ok(newSale.includes('Pilih sedia ada'));
});
test('first payment has matching fields and is optional',()=>{
 for(const field of ['pdate','pkind','pmethod','pamount','ploanbank','pref','pnote']){
  assert.ok(includesField(editSale,field),'Edit Jualan payment: '+field);
  assert.ok(includesField(newSale,field),'Jual Kereta payment: '+field);
 }
 assert.ok(newSale.includes('Rekod Bayaran (Pilihan)'));
 assert.ok(newSale.includes('name="record_payment"'));
 assert.ok(newSale.includes('data-new-sale-pay hidden disabled'));
 assert.ok(newSale.includes('payBox.disabled=!payToggle.checked'));
});
test('one server-side transaction records sale, customer and optional first payment',()=>{
 assert.ok(newSale.includes("client.rpc('create_vehicle_sale_with_details',args)"));
 for(const term of ["p_sale_date:f.get('sale_date')","p_payment_kind:hasPay?f.get('pkind'):null","p_payment_amount:amount","p_paid_date:hasPay"])
  assert.ok(newSale.includes(term),term);
 assert.ok(sql.includes('v_sale := public.create_vehicle_sale(p_vehicle_id,p_customer_id,p_agreed_price)'));
 assert.ok(sql.includes('v_payment := public.record_sale_payment('));
 assert.ok(sql.includes('if p_payment_kind is not null then'));
 assert.ok(sql.includes('if p_sale_date is not null then'));
 assert.ok(sql.includes('perform public.update_customer_details'));
});
test('server checks role, price, dates and payment reference',()=>{
 for(const term of ["auth.uid() is null","public.current_staff_role() not in ('owner','sales_advisor')",
  "p_payment_amount > p_agreed_price","p_sale_date > v_today","p_paid_date > v_today",
  "nullif(trim(coalesce(p_payment_reference,'')),'') is null","security definer",
  "set search_path = public, pg_temp","from anon","to authenticated"]){
  assert.ok(sql.includes(term),term);
 }
 assert.match(sql,/revoke all on function/);
});
test('loan bank and payment method are compatible with Edit Jualan',()=>{
 assert.ok(sql.includes("v_method = 'Loan Bank'"));
 assert.ok(sql.includes('Loan Bank · '));
 assert.ok(sql.includes('[Kaedah: '));
 assert.ok(newSale.includes('wireLoan(o)'));
 assert.ok(newSale.includes('wireRefGen(o,'));
 assert.ok(newSale.includes('genPayRef(v.plate)'));
});
test('client validates before creating a new customer',()=>{
 const validation=newSale.indexOf('if(!Number.isFinite(price)');
 const insertion=newSale.indexOf("client.from('customers').insert(");
 assert.ok(validation>0&&insertion>validation);
 assert.ok(newSale.includes('Jumlah bayaran mesti melebihi sifar'));
 assert.ok(newSale.includes('Tarikh jualan atau bayaran tidak boleh pada masa hadapan'));
});
test('mobile layout correctly sizes and hides payment fields',()=>{
 assert.ok(css.includes('.ada-form .ada-sale-pay-toggle input[type="checkbox"]'));
 assert.ok(css.includes('.ada-form [data-new-sale-pay][hidden]{display:none!important}'));
 assert.ok(css.includes('@media(max-width:520px)'));
 assert.match(app,/css\/app\.css\?v=50\.(?:45|46)/);
});
