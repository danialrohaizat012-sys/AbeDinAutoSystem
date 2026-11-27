import {createClient} from 'npm:@supabase/supabase-js@2.49.4';
import * as PDFLib from 'npm:pdf-lib@1.17.1';
import {buildDeliveryOrderPdf} from './do-pdf.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=new Set(['https://abedinauto.my','https://www.abedinauto.my']);
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const b64=(bytes:Uint8Array)=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s)};
const text=(v:unknown,n:number)=>typeof v==='string'&&v.length<=n?v.trim():'';
const id=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const validSale=(s:any)=>s&&['sold','completed','reserved'].includes(String(s.status).toLowerCase());
async function sale(saleId:string){const {data,error}=await db.from('sales').select('id,vehicle_id,customer_id,status').eq('id',saleId).maybeSingle();if(error)throw error;return data}
async function signedRecord(s:any){const {data,error}=await db.from('delivery_order_esign').select('signed_pdf,signed_at,snapshot').eq('sale_id',s.id).maybeSingle();if(error)throw error;if(!data?.signed_at||!data.signed_pdf||data.snapshot?.vehicle_id!==s.vehicle_id||data.snapshot?.customer_id!==s.customer_id)return null;return data}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://abedinauto.my','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed.has(origin))return reply({error:'Origin tidak dibenarkan.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Kaedah tidak sah.'},405);
 try{
  const raw=await req.text();if(raw.length>8000)return reply({error:'Permintaan terlalu besar.'},413);
  const b=JSON.parse(raw);
  if(b?.action==='issue'){
   const jwt=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!jwt)return reply({error:'Sila log masuk.'},401);
   const {data:u,error:ue}=await db.auth.getUser(jwt);if(ue||!u.user)return reply({error:'Sila log masuk.'},401);
   const {data:p,error:pe}=await db.from('profiles').select('role,enabled').eq('id',u.user.id).maybeSingle();
   if(pe||!p?.enabled||!['owner','sales_advisor'].includes(p.role))return reply({error:'Akses tidak dibenarkan.'},403);
   if(!id(b.sale_id)||typeof b.signed!=='boolean')return reply({error:'Permintaan tidak sah.'},400);
   const s=await sale(b.sale_id);if(!validSale(s))return reply({error:'Rekod jualan tidak sah.'},409);
   let pdf:string|null=null,filename='DO-'+s.id.replace(/-/g,'')+'.pdf';
   if(b.signed){if(!await signedRecord(s))return reply({error:'DO belum ditandatangani atau rekod berubah.'},409)}
   else{
    const [v,c]=await Promise.all([db.from('vehicles').select('id,plate,make,model,model_year,mileage_km').eq('id',s.vehicle_id).single(),db.from('customers').select('id,full_name,phone,notes').eq('id',s.customer_id).single()]);
    if(v.error||c.error)return reply({error:'Rekod tidak lengkap.'},409);
    const h=b.handover||{},date=text(h.date,10),time=text(h.time,5),mileage=text(h.mileage,10);
    if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date))return reply({error:'Tarikh tidak sah.'},400);
    if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return reply({error:'Masa tidak sah.'},400);
    if(mileage&&!/^\d{1,9}$/.test(mileage))return reply({error:'Mileage tidak sah.'},400);
    const out=await buildDeliveryOrderPdf(PDFLib,{x:s,v:v.data,c:c.data,handover:{date,time,mileage,ic:text(h.ic,40),address:text(h.address,180)}});
    pdf=b64(out.bytes);filename=out.fname;
   }
   const t=token(),digest=await hash(t),expires_at=new Date(Date.now()+7*86400000).toISOString();
   const {error}=await db.from('delivery_order_share').upsert({sale_id:s.id,signed:b.signed,vehicle_id:s.vehicle_id,customer_id:s.customer_id,token_hash:digest,expires_at,pdf,filename,created_by:u.user.id},{onConflict:'sale_id,signed'});
   if(error)throw error;
   return reply({token:t,expires_at});
  }
  if(b?.action!=='get'||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))return reply({error:'Pautan tidak sah.'},400);
  const {data:r,error}=await db.from('delivery_order_share').select('sale_id,signed,vehicle_id,customer_id,pdf,filename').eq('token_hash',await hash(b.token)).gt('expires_at',new Date().toISOString()).maybeSingle();
  if(error)throw error;if(!r)return reply({error:'Pautan tidak sah atau tamat tempoh.'},404);
  const s=await sale(r.sale_id);if(!validSale(s)||s.vehicle_id!==r.vehicle_id||s.customer_id!==r.customer_id)return reply({error:'Rekod jualan telah berubah.'},409);
  const pdf=r.signed?(await signedRecord(s))?.signed_pdf:r.pdf;
  if(!pdf)return reply({error:'Dokumen tidak tersedia.'},404);
  return reply({pdf,filename:r.filename,signed:r.signed});
 }catch{return reply({error:'DO PDF tidak dapat diproses. Sila hubungi Abe Din Auto.'},500)}
});
