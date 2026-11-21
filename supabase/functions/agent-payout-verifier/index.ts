import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const h={"content-type":"application/json; charset=utf-8","cache-control":"no-store",
 "access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS",
 "access-control-allow-headers":"authorization, apikey, content-type, x-client-info"};
const out=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:h});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
 if(req.method!=="POST")return out(405,{error:"Method not allowed"});
 const bearer=/^Bearer\s+([^\s]+)$/i.exec(req.headers.get("authorization")??"")?.[1];
 if(!bearer)return out(401,{error:"Login required"});
 const url=Deno.env.get("SUPABASE_URL")??"";
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
 if(!key||new URL(url||"https://invalid.invalid").hostname!=="buzpdyvvoiqgbeventwm.supabase.co")
   return out(503,{error:"Server configuration invalid"});
 const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:userResult,error:userError}=await admin.auth.getUser(bearer);
 const user=userResult.user;
 if(userError||!user?.id||!user.email_confirmed_at)return out(401,{error:"Verified login required"});
 const [{data:staff},{data:verifier}]=await Promise.all([
   admin.from("profiles").select("role,enabled").eq("id",user.id).maybeSingle(),
   admin.from("agent_payout_verifiers").select("enabled").eq("user_id",user.id).maybeSingle()
 ]);
 if(!staff?.enabled||!(staff.role==="owner"||verifier?.enabled===true))
   return out(403,{error:"Payout verification permission required"});
 if(!(req.headers.get("content-type")||"").startsWith("application/json"))
   return out(415,{error:"JSON required"});
 if(Number(req.headers.get("content-length")||0)>4096)return out(413,{error:"Payload too large"});
 let body:Record<string,unknown>;
 try{body=await req.json();if(!body||Array.isArray(body)||typeof body!=="object")throw 1;}
 catch{return out(400,{error:"Invalid JSON"});}
 if(body.action==="list"){
   const {data,error}=await admin.from("agent_payouts")
     .select("id,agent_id,amount,status,approved_by,created_at")
     .eq("status","approved").order("created_at",{ascending:false}).limit(100);
   return error?out(500,{error:"Could not load payout list"}):out(200,{payouts:data});
 }
 if(body.action==="confirm"){
   if(typeof body.payout_id!=="string"||!uuid.test(body.payout_id)
      ||typeof body.bank_reference!=="string"
      ||body.bank_reference.trim().length<5||body.bank_reference.trim().length>120
      ||typeof body.bank_paid_at!=="string"
      ||!Number.isFinite(Date.parse(body.bank_paid_at))
      ||Date.parse(body.bank_paid_at)>Date.now()+300000
      ||body.independent_bank_reconciliation!==true)
      return out(400,{error:"Verified bank evidence and acknowledgement required"});
   const {data,error}=await admin.rpc("agent_confirm_payout_gateway_v1",{
     p_actor:user.id,p_payout:body.payout_id,
     p_transfer_reference:body.bank_reference.trim(),
     p_bank_paid_at:new Date(body.bank_paid_at).toISOString()
   });
   if(error)return out(error.code==="42501"?403:400,{error:"Verification rejected: ensure different approver, authorized HR and bank evidence"});
   return out(200,{result:data});
 }
 return out(400,{error:"Invalid action"});
});