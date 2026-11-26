import {createClient} from 'npm:@supabase/supabase-js@2.49.4';
import * as PDFLib from 'npm:pdf-lib@1.17.1';
import {deliveryFields,buildDeliveryOrderPdf} from './do-pdf.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const table='delivery_order_esign';
const allowed=new Set(['https://abedinauto.my','https://www.abedinauto.my']);
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const validId=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const b64=(bytes:Uint8Array)=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s)};
const str=(v:unknown,max:number)=>{if(typeof v!=='string')return '';if(v.length>max)throw new Error('Maklumat terlalu panjang.');return v.trim()};
const saleOk=(s:any)=>s&&['sold','completed'].includes(String(s.status).toLowerCase());
async function sale(id:string){const {data,error}=await db.from('sales').select('id,vehicle_id,customer_id,status').eq('id',id).maybeSingle();if(error)throw error;return data}
async function staff(req:Request){const jwt=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!jwt)return null;const {data,error}=await db.auth.getUser(jwt);if(error||!data.user)return null;const {data:profile,error:pe}=await db.from('profiles').select('id,role,enabled').eq('id',data.user.id).maybeSingle();if(pe||!profile?.enabled||!['owner','sales_advisor'].includes(profile.role))return null;return profile}
async function snapshot(s:any,h:any){
 const [v,c]=await Promise.all([db.from('vehicles').select('id,plate,make,model,model_year,mileage_km,details').eq('id',s.vehicle_id).single(),db.from('customers').select('id,full_name,phone,notes').eq('id',s.customer_id).single()]);
 if(v.error||c.error||!v.data||!c.data)throw new Error('Rekod pelanggan atau kenderaan tidak lengkap.');
 const a=deliveryFields({x:s,v:v.data,c:c.data});
 const date=str(h.date,10),time=str(h.time,5);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00+08:00'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Tarikh dan masa serahan diperlukan.');
 if(!['baik','perlu'].includes(h.condition)||!['1','2'].includes(h.keys))throw new Error('Pilih keadaan kenderaan dan bilangan kunci.');
 const mileage=str(h.mileage,10);if(mileage!==''&&!/^\d{1,9}$/.test(mileage))throw new Error('Mileage tidak sah.');
 const docs=Array.isArray(h.docs)?[...new Set(h.docs)].filter(d=>['geran','insurans','lain'].includes(d)):[];
 return {version:1,vehicle_id:s.vehicle_id,customer_id:s.customer_id,fields:{...a,date,time,ic:str(h.ic,40),address:str(h.address,180),variant:str(h.variant,100),mileage,condition:h.condition,keys:h.keys,docs,accessories:str(h.accessories,35),notes:str(h.notes,150)}};
}
async function render(snap:any,signature?:number[][][],signedAt?:string){if(snap.version!==1)throw new Error('Versi dokumen tidak disokong.');const result=await buildDeliveryOrderPdf(PDFLib,{x:{},v:{},c:{},handover:{...snap.fields,signature,signedAt}});return {pdf:b64(result.bytes),filename:result.fname}}
function signatureOf(v:any){if(!Array.isArray(v)||!v.length||v.length>80)throw new Error('Sila tandatangan.');let n=0,travel=0;for(const stroke of v){if(!Array.isArray(stroke)||stroke.length<2)throw new Error('Tandatangan tidak sah.');let prev:number[]|null=null;for(const pt of stroke){if(!Array.isArray(pt)||pt.length!==2||pt.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)||++n>2000)throw new Error('Tandatangan terlalu kompleks atau tidak sah.');if(prev)travel+=Math.hypot(pt[0]-prev[0],pt[1]-prev[1]);prev=pt}}if(travel<.025)throw new Error('Sila lukis tandatangan penuh.');return v}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://abedinauto.my','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed.has(origin))return reply({error:'Origin tidak dibenarkan.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Kaedah tidak dibenarkan.'},405);
 try{
  const raw=await req.text();if(raw.length>140000)return reply({error:'Permintaan terlalu besar.'},413);
  const b=JSON.parse(raw);if(!b||typeof b!=='object')return reply({error:'Permintaan tidak sah.'},400);
  if(['staff_get','staff_issue'].includes(b.action)){
   const who=await staff(req);if(!who)return reply({error:'Akses tidak dibenarkan.'},403);
   if(!validId(b.sale_id))return reply({error:'ID jualan tidak sah.'},400);
   const s=await sale(b.sale_id);if(!saleOk(s))return reply({error:'E-Sign hanya untuk jualan selesai.'},409);
   const {data:old,error}=await db.from(table).select('sale_id,snapshot,signed_at,signed_pdf,expires_at,token_hash').eq('sale_id',s.id).maybeSingle();if(error)throw error;
   if(b.action==='staff_get'){if(!old)return reply({status:'none'});return reply({status:old.signed_at?'signed':new Date(old.expires_at).getTime()>Date.now()?'pending':'expired',signed_at:old.signed_at,expires_at:old.expires_at,...(old.signed_at?{pdf:old.signed_pdf,fields:old.snapshot.fields}:{})})}
   if(old?.signed_at)return reply({error:'DO telah ditandatangani dan dikunci.'},409);
   const snap=await snapshot(s,b.handover||{});await render(snap);
   const t=token(),digest=await hash(t),expires_at=new Date(Date.now()+48*3600000).toISOString();
   const row={sale_id:s.id,snapshot:snap,token_hash:digest,expires_at,created_by:who.id,created_at:new Date().toISOString()};
   const result=old?await db.from(table).update(row).eq('sale_id',s.id).eq('token_hash',old.token_hash).is('signed_at',null).select('sale_id').maybeSingle():await db.from(table).insert(row).select('sale_id').single();
   if(result.error||!result.data)return reply({error:'Rekod berubah. Buka semula E-Sign.'},409);
   return reply({status:'pending',token:t,expires_at});
  }
  if(!['buyer_get','buyer_sign'].includes(b.action)||typeof b.token!=='string'||!/^[0-9a-f]{64}$/.test(b.token))return reply({error:'Pautan tidak sah.'},400);
  const digest=await hash(b.token);
  const {data:row,error}=await db.from(table).select('sale_id,snapshot,expires_at,signed_at,signed_pdf').eq('token_hash',digest).gt('expires_at',new Date().toISOString()).maybeSingle();
  if(error)throw error;if(!row)return reply({error:'Pautan tidak sah atau tamat tempoh.'},404);
  if(b.action==='buyer_get'){
   if(row.signed_at)return reply({status:'signed',fields:row.snapshot.fields,pdf:row.signed_pdf,signed_at:row.signed_at});
   const s=await sale(row.sale_id);if(!saleOk(s)||s.vehicle_id!==row.snapshot.vehicle_id||s.customer_id!==row.snapshot.customer_id)return reply({error:'Rekod jualan telah berubah. Hubungi Abe Din Auto.'},409);
   return reply({status:'pending',fields:row.snapshot.fields,...await render(row.snapshot)});
  }
  if(row.signed_at)return reply({error:'DO telah ditandatangani. Muat semula untuk mendapatkan PDF.'},409);
  if(b.accept!==true)return reply({error:'Sila sahkan pengakuan pelanggan.'},400);
  const signature=signatureOf(b.signature);
  const s=await sale(row.sale_id);if(!saleOk(s)||s.vehicle_id!==row.snapshot.vehicle_id||s.customer_id!==row.snapshot.customer_id)return reply({error:'Rekod jualan telah berubah. Hubungi Abe Din Auto.'},409);
  const signed_at=new Date().toISOString(),out=await render(row.snapshot,signature,signed_at);
  const {data:done,error:de}=await db.from(table).update({signature,signed_at,signed_pdf:out.pdf}).eq('sale_id',row.sale_id).eq('token_hash',digest).is('signed_at',null).gt('expires_at',signed_at).select('sale_id').maybeSingle();
  if(de||!done)return reply({error:'Tandatangan tidak dapat disahkan. Muat semula pautan.'},409);
  return reply({status:'signed',fields:row.snapshot.fields,signed_at,...out});
 }catch(e){console.error('DO E-Sign request failed',e instanceof Error?e.name:'unknown');return reply({error:e instanceof Error&&['SyntaxError','TypeError'].includes(e.name)?'Permintaan tidak sah.':e instanceof Error?e.message:'Permintaan gagal.'},400)}
});
