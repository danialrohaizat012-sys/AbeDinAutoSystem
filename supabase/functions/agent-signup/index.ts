import { createClient } from "npm:@supabase/supabase-js@2.57.0";
// Pendaftaran ejen tanpa e-mel pengesahan: akaun dicipta terus (email_confirm:true),
// jadi had kadar e-mel Supabase tidak terlibat.
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*",
"access-control-allow-headers":"authorization, apikey, x-client-info, content-type","access-control-allow-methods":"POST, OPTIONS"};
const res=(status:number,payload:unknown)=>new Response(JSON.stringify(payload),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return res(405,{error:"Method not allowed"});
 let body:any={};try{body=await req.json();}catch{return res(400,{error:"Data tidak sah"});}
 const email=String(body?.email||"").trim().toLowerCase();const password=String(body?.password||"");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>200)return res(400,{error:"E-mel tidak sah."});
 if(password.length<6)return res(400,{error:"Kata laluan terlalu pendek. Guna sekurang-kurangnya 6 aksara."});
 if(password.length>72)return res(400,{error:"Kata laluan terlalu panjang."});
 const url=Deno.env.get("SUPABASE_URL")||"";const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!key||new URL(url||"https://invalid.invalid").hostname!=="buzpdyvvoiqgbeventwm.supabase.co")return res(503,{error:"Server not configured"});
 const server=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {error}=await server.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{signup_source:"agent_portal"}});
 if(error){
  const m=String(error.message||"");
  if(/already|registered|exists/i.test(m))return res(409,{error:"exists"});
  if(/password/i.test(m))return res(400,{error:"Kata laluan terlalu lemah. Cuba kata laluan lain (sekurang-kurangnya 6 aksara)."});
  return res(500,{error:"Pendaftaran gagal. Cuba lagi sebentar."});
 }
 return res(200,{ok:true});
});
