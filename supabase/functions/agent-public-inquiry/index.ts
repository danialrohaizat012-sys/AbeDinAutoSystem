import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const allowed=new Set(["https://abedinauto.my","https://www.abedinauto.my"]);
const allowedOrigin=(origin:string|null)=>origin&&allowed.has(origin)?origin:"https://abedinauto.my";
const headers=(origin:string|null)=>({"content-type":"application/json; charset=utf-8","cache-control":"no-store",
  "access-control-allow-origin":allowedOrigin(origin),"vary":"Origin",
  "access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type"});
const respond=(status:number,result:unknown,origin:string|null)=>
  new Response(JSON.stringify(result),{status,headers:headers(origin)});
const refPattern=/^ADA-AG-[0-9]{4,}$/;
Deno.serve(async(req)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
 if(req.method!=="POST")return respond(405,{error:"Method not allowed"},origin);
 if(!origin||!allowed.has(origin))return respond(403,{error:"Unsupported origin"},origin);
 if(!(req.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
  return respond(415,{error:"JSON request required"},origin);
 if(Number(req.headers.get("content-length")||0)>4096)return respond(413,{error:"Payload too large"},origin);
 let data:Record<string,unknown>;
 try{data=await req.json();if(!data||typeof data!=="object"||Array.isArray(data))throw Error("bad");}
 catch{return respond(400,{error:"Invalid request"},origin);}
 if(data.company_website)return respond(400,{error:"Invalid request"},origin);
 const ref=typeof data.ref==="string"?data.ref.trim():"";
 const car=typeof data.car==="string"?data.car.trim():"";
 const name=typeof data.customer_name==="string"?data.customer_name.trim():"";
 const phone=typeof data.customer_phone==="string"?data.customer_phone.trim():"";
 if(!refPattern.test(ref)||ref.length>30||!car||car.length>80||
    name.length<2||name.length>160||phone.length<9||phone.length>24||
    data.consent!==true)return respond(400,{error:"Please check all required fields and consent"},origin);
 const url=Deno.env.get("SUPABASE_URL")||"";
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!key||new URL(url||"https://invalid.invalid").hostname!=="buzpdyvvoiqgbeventwm.supabase.co")
  return respond(503,{error:"Service unavailable"},origin);
 const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||
  (req.headers.get("x-forwarded-for")||"").split(",")[0].trim()||"unknown";
 const dataToHash=new TextEncoder().encode(key+"|agent-public-ref-v1|"+ip);
 const digest=await crypto.subtle.digest("SHA-256",dataToHash);
 const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
 const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:result,error}=await client.rpc("agent_submit_public_inquiry_gateway_v1",{
  p_referral_code:ref,p_public_vehicle_id:car,p_customer_name:name,
  p_customer_phone:phone,p_consent:true,p_request_hash:hash
 });
 if(error){
  if(error.code==="23505")return respond(409,{error:"Pertanyaan untuk kereta dan nombor ini sudah didaftarkan. Hubungi AbeDin Auto."},origin);
  if(error.code==="23514")return respond(409,{error:"Kereta atau akaun ejen sudah tidak aktif."},origin);
  return respond(400,{error:"Maklumat tidak sah atau permohonan tidak dapat didaftarkan."},origin);
 }
 if(result?.status==="rate_limited")return respond(429,{error:"Terlalu banyak permintaan. Cuba kemudian."},origin);
 return respond(201,{success:true,lead_id:result.lead_id,
  agent_code:result.agent_code,vehicle_id:result.vehicle_id,
  message:"Pertanyaan direkodkan dan akan disemak oleh AbeDin Auto."},origin);
});
