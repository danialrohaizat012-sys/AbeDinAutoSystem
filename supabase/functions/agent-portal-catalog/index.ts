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
 const {data:agent,error:agentErr}=await server.from("agent_profiles").select("status")
 .eq("user_id",auth.user.id).maybeSingle();
 if(agentErr||agent?.status!=="active")return response(403,{error:"Active agent required"});
 const {data,error}=await server.from("vehicles").select("id,make,model,model_year,asking_price")
 .eq("status","available").order("make",{ascending:true}).limit(200);
 if(error)return response(500,{error:"Unable to load catalogue"});
 return response(200,{vehicles:data||[]});
});
