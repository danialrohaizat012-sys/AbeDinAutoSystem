import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*",
"access-control-allow-headers":"authorization, apikey, x-client-info, content-type","access-control-allow-methods":"GET, OPTIONS"};
const response=(status:number,payload:unknown)=>new Response(JSON.stringify(payload),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="GET")return response(405,{error:"Method not allowed"});
 const token=/^Bearer\s+([^\s]+)$/i.exec(req.headers.get("authorization")||"")?.[1];
 if(!token)return response(401,{error:"Login required"});
 const url=Deno.env.get("SUPABASE_URL")||"";
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!key||new URL(url||"https://invalid.invalid").hostname!=="buzpdyvvoiqgbeventwm.supabase.co")
 return response(503,{error:"Server not configured"});
 const server=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:auth,error:authErr}=await server.auth.getUser(token);
 if(authErr||!auth.user?.id||!auth.user.email_confirmed_at)return response(401,{error:"Unverified user"});
 const {data:agent,error:agentErr}=await server.from("agent_profiles").select("id,status")
 .eq("user_id",auth.user.id).maybeSingle();
 if(agentErr||agent?.status!=="active")return response(403,{error:"Active agent required"});
 const {data:share,error:shareErr}=await server.from("agent_public_share_tokens")
   .select("token").eq("agent_id",agent.id).maybeSingle();
 if(shareErr||!share?.token)return response(503,{error:"Agent promotion link unavailable"});
 // Reuse the EXACT public-catalogue visibility and car-link contract.
 // Public RPC returns vehicle_id (display/share ID) separately from id (UUID).
 // Never expose acquisition price, supplier information, plate or staff finance.
 const {data,error}=await server.rpc("get_public_catalogue",{p_vehicle_id:null});
 if(error)return response(500,{error:"Unable to load public catalogue"});
 const {data:offers, error:offerError}=await server.rpc("get_public_vehicle_offers");
 if(offerError)return response(500,{error:"Unable to load public prices"});
 const {data:commissionOffers,error:commissionError}=await server.from("agent_vehicle_commission_offers")
   .select("vehicle_id,category,indicative_amount,active").eq("active",true).limit(200);
 if(commissionError)return response(500,{error:"Unable to load commission categories"});
 const commissionMap=new Map((commissionOffers||[]).map(x=>[x.vehicle_id,x]));
 const offerMap=new Map((Array.isArray(offers)?offers:[]).map(x=>[String(x.vehicle_id),x]));
 const rows=Array.isArray(data)?data:[];
 const available=rows.filter(v=>String(v.status||"").toLowerCase()==="available");
 const vehicles=available.slice(0,200).map(v=>{
   const imgs=Array.isArray(v.images)?v.images:[];
   const cover=imgs.find(x=>x.is_cover)||imgs[0];
   const path=typeof cover?.storage_path==="string"?cover.storage_path:"";
   return {id:v.id,public_vehicle_id:v.vehicle_id,
     make:v.make,model:v.model,model_year:v.model_year,
     asking_price:v.asking_price,
     display_price:(()=>{
       const base=Number(v.asking_price||0);
       const promo=Number(offerMap.get(String(v.vehicle_id))?.promo_price||0);
       return promo>0&&base>0&&promo<base?promo:base;
     })(),
     monthly_installment:offerMap.get(String(v.vehicle_id))?.monthly_installment||null,
     commission_category:commissionMap.get(v.id)?.category||null,
     indicative_commission:commissionMap.get(v.id)?.indicative_amount??null,
     image_url:path?"https://buzpdyvvoiqgbeventwm.supabase.co/storage/v1/object/public/vehicle-images/"+path.split("/").map(encodeURIComponent).join("/"):null};
 }).filter(v=>typeof v.id==="string"&&typeof v.public_vehicle_id==="string");
 return response(200,{vehicles,total:vehicles.length,source:"public_catalogue",share_token:share.token});
});
