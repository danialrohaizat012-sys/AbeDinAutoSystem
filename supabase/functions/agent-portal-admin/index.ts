import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const headers={ "content-type":"application/json; charset=utf-8", "cache-control":"no-store",
"access-control-allow-origin":"*", "access-control-allow-headers":"authorization, apikey, x-client-info, content-type",
"access-control-allow-methods":"POST, OPTIONS" };
const res=(status:number,payload:unknown)=>new Response(JSON.stringify(payload),{status,headers});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response(null,{status:204,headers});
 if(req.method!=="POST") return res(405,{error:"Method not allowed"});
 const token=/^Bearer\s+([^\s]+)$/i.exec(req.headers.get("authorization")||"")?.[1];
 if(!token) return res(401,{error:"Authentication required"});
 const url=Deno.env.get("SUPABASE_URL")||"";
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!key||new URL(url||"https://invalid.invalid").hostname!=="buzpdyvvoiqgbeventwm.supabase.co")
   return res(503,{error:"Server not configured"});
 const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:identity,error:authError}=await admin.auth.getUser(token);
 if(authError||!identity.user?.id||!identity.user.email_confirmed_at) return res(401,{error:"Invalid account"});
 const {data:owner,error:ownerErr}=await admin.from("profiles").select("role,enabled")
   .eq("id",identity.user.id).maybeSingle();
 if(ownerErr||owner?.role!=="owner"||owner?.enabled!==true) return res(403,{error:"Owner access required"});
 if(!(req.headers.get("content-type")||"").startsWith("application/json")) return res(415,{error:"JSON required"});
 if(Number(req.headers.get("content-length")||0)>4096) return res(413,{error:"Request too large"});
 let payload:Record<string,unknown>;
 try { payload=await req.json(); if(!payload||Array.isArray(payload)||typeof payload!=="object") throw 1;}
 catch {return res(400,{error:"Invalid JSON"});}
 if(payload.action==="list"){
   const {data,error}=await admin.from("agent_applications")
   .select("id,full_name,phone,email,state,status,applied_at").eq("status","pending")
   .order("applied_at",{ascending:true}).limit(100);
   return error?res(500,{error:"Unable to load applications"}):res(200,{applications:data});
 }
 if(payload.action==="finance_list"){
   const [leads,commissions,payouts]=await Promise.all([
     admin.from("agent_leads").select("id,agent_id,customer_name,status,linked_sale_id,lead_source,referral_code_snapshot,created_at")
       .not("linked_sale_id","is",null).order("created_at",{ascending:false}).limit(100),
     admin.from("agent_commissions").select("id,agent_id,lead_id,sale_id,agreed_amount,status,created_at")
       .order("created_at",{ascending:false}).limit(100),
     admin.from("agent_payouts").select("id,agent_id,amount,status,approved_by,transfer_reference,paid_at,created_at")
       .order("created_at",{ascending:false}).limit(100)
   ]);
   if(leads.error||commissions.error||payouts.error)return res(500,{error:"Unable to load finance records"});
   return res(200,{leads:leads.data,commissions:commissions.data,payouts:payouts.data});
 }
 if(payload.action==="direct_inquiry_list"){
   const {data,error}=await admin.from("catalogue_direct_inquiries")
     .select("id,vehicle_id,customer_name,customer_phone,source,status,owner_read_at,created_at")
     .order("created_at",{ascending:false}).limit(100);
   return error?res(500,{error:"Unable to load direct enquiries"}):res(200,{inquiries:data});
 }
 if(payload.action==="owner_lead_mark_read"){
   const id=payload.lead_id;
   const type=payload.lead_type;
   if(typeof id!=="string"||!uuid.test(id)||!["agent","direct"].includes(String(type)))
     return res(400,{error:"Valid lead ID and type required"});
   const table=type==="agent"?"agent_leads":"catalogue_direct_inquiries";
   const {data,error}=await admin.from(table).update({owner_read_at:new Date().toISOString()})
     .eq("id",id).select("id,owner_read_at").maybeSingle();
   if(error||!data)return res(404,{error:"Lead not found or cannot be marked read"});
   return res(200,{lead:data});
 }
 if(payload.action==="commission_vehicle_list"){
   const [vehicles,offers]=await Promise.all([
     admin.from("vehicles").select("id,vehicle_id,make,model,model_year,status,catalogue_status").order("created_at",{ascending:false}).limit(200),
     admin.from("agent_vehicle_commission_offers").select("vehicle_id,category,indicative_amount,active,updated_at").limit(200)
   ]);
   if(vehicles.error||offers.error)return res(500,{error:"Unable to load vehicle commission offers"});
   const byVehicle=new Map((offers.data||[]).map(o=>[o.vehicle_id,o]));
   return res(200,{vehicles:(vehicles.data||[]).map(v=>({...v,offer:byVehicle.get(v.id)||null}))});
 }
 if(payload.action==="commission_offer_set"){
   const vehicle=payload.vehicle_id,cat=payload.category,amount=payload.amount,active=payload.active;
   if(typeof vehicle!=="string"||!uuid.test(vehicle)||
      !["standard","premium","special"].includes(String(cat))||
      typeof amount!=="string"||!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(amount)||
      Number(amount)>100000||typeof active!=="boolean")
      return res(400,{error:"Valid vehicle, category and indicative amount are required"});
   const {data:car,error:carError}=await admin.from("vehicles").select("id").eq("id",vehicle).maybeSingle();
   if(carError||!car)return res(404,{error:"Vehicle not found"});
   const {data,error}=await admin.from("agent_vehicle_commission_offers")
      .upsert({vehicle_id:vehicle,category:cat,indicative_amount:Number(amount),active,updated_by:identity.user.id,updated_at:new Date().toISOString()},{onConflict:"vehicle_id"})
      .select("vehicle_id,category,indicative_amount,active").single();
   if(error)return res(500,{error:"Unable to save commission category"});
   await admin.from("agent_audit_events").insert({
     actor_user_id:identity.user.id,entity_type:"vehicle",entity_id:vehicle,
     action:"agent_commission_offer_set",reason:"Owner set non-binding agent commission category "+String(cat)
   });
   return res(200,{offer:data,note:"Indicative only; sale and commission require separate owner approval"});
 }
 if(payload.action==="lead_contact_list"){
   // Owner only, because authentication and active owner checks run before this branch.
   const {data:leads,error}=await admin.from("agent_leads")
     .select("id,agent_id,vehicle_id,customer_name,customer_phone,status,lead_source,referral_code_snapshot,linked_sale_id,agent_read_at,owner_read_at,created_at")
     .order("created_at",{ascending:false}).limit(100);
   if(error)return res(500,{error:"Unable to load agent customer contacts"});
   const vehicleIds=[...new Set((leads||[]).map(x=>x.vehicle_id).filter(Boolean))];
   const agentIds=[...new Set((leads||[]).map(x=>x.agent_id).filter(Boolean))];
   const [cars,agents]=await Promise.all([
     vehicleIds.length?admin.from("vehicles").select("id,vehicle_id,make,model,model_year").in("id",vehicleIds):Promise.resolve({data:[],error:null}),
     agentIds.length?admin.from("agent_profiles").select("id,agent_code,application_id").in("id",agentIds):Promise.resolve({data:[],error:null})
   ]);
   if(cars.error||agents.error)return res(500,{error:"Unable to load lead vehicle information"});
   const applicationIds=[...new Set((agents.data||[]).map(x=>x.application_id).filter(Boolean))];
   const applications=applicationIds.length?await admin.from("agent_applications")
      .select("id,full_name").in("id",applicationIds):{data:[],error:null};
   if(applications.error)return res(500,{error:"Unable to load agent names"});
   const byApplication=new Map((applications.data||[]).map(x=>[x.id,x.full_name]));
   const byCar=new Map((cars.data||[]).map(x=>[x.id,x]));
   const byAgent=new Map((agents.data||[]).map(x=>[x.id,x]));
   return res(200,{leads:(leads||[]).map(x=>({
     ...x,
     agent_code:byAgent.get(x.agent_id)?.agent_code||x.referral_code_snapshot||null,
     agent_name:byApplication.get(byAgent.get(x.agent_id)?.application_id)||null,
     car:byCar.get(x.vehicle_id)||null
   }))});
 }
 if(payload.action==="lead_list"){
   const {data,error}=await admin.from("agent_leads")
     .select("id,agent_id,customer_name,customer_phone,status,linked_sale_id,vehicle_id,lead_source,referral_code_snapshot,created_at")
     .is("linked_sale_id",null).order("created_at",{ascending:false}).limit(100);
   return error?res(500,{error:"Unable to load leads"}):res(200,{leads:data});
 }
 if(payload.action==="link_lead"){
   if(typeof payload.lead_id!=="string"||!uuid.test(payload.lead_id)||
      typeof payload.sale_id!=="string"||!uuid.test(payload.sale_id)||
      typeof payload.reason!=="string"||payload.reason.trim().length<15)
      return res(400,{error:"A matched sale and documented owner evidence are required"});
   const {data,error}=await admin.rpc("agent_link_lead_gateway_v1",{
     p_actor:identity.user.id,p_lead:payload.lead_id,p_sale:payload.sale_id,
     p_evidence_reason:payload.reason.trim().slice(0,500)
   });
   return error?res(error.code==="23505"?409:400,{error:"Lead attribution rejected: check customer and vehicle match"}):res(200,{result:data});
 }
 if(payload.action==="approve_commission"){
   const amount=payload.amount;
   if(typeof payload.lead_id!=="string"||!uuid.test(payload.lead_id)||
      typeof amount!=="string"||!/^(?:[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(amount)||
      Number(amount)>100000||
      typeof payload.reason!=="string"||payload.reason.trim().length<20||
      payload.finance_reconciled!==true)
      return res(400,{error:"Verified sale, amount, and finance reconciliation acknowledgement required"});
   const {data,error}=await admin.rpc("agent_approve_commission_gateway_v2",{
     p_actor:identity.user.id,p_lead:payload.lead_id,
     p_amount:amount,p_reason:payload.reason.trim().slice(0,2000)
   });
   return error?res(error.code==="23505"?409:400,{error:"Commission rejected. Verify sold status, payments and attribution"}):res(200,{result:data});
 }
 if(payload.action==="prepare_payout"||payload.action==="approve_payout"){
   const target=payload.action==="prepare_payout"?payload.commission_id:payload.payout_id;
   if(typeof target!=="string"||!uuid.test(target)||
      typeof payload.reason!=="string"||payload.reason.trim().length<15)
      return res(400,{error:"A valid record and review reason are required"});
   const args=payload.action==="prepare_payout"?
      {p_actor:identity.user.id,p_commission:target,p_reason:payload.reason.trim().slice(0,2000)}:
      {p_actor:identity.user.id,p_payout:target,p_reason:payload.reason.trim().slice(0,2000)};
   const rpc=payload.action==="prepare_payout"?"agent_prepare_payout_gateway_v1":"agent_approve_payout_gateway_v1";
   const {data,error}=await admin.rpc(rpc,args);
   return error?res(error.code==="23505"?409:400,{error:"Payout action rejected: check commission and approval status"}):res(200,{result:data});
 }
 if(payload.action==="review"){
   const application=payload.application_id,decision=payload.decision;
   const reason=typeof payload.reason==="string"?payload.reason.trim().slice(0,2000):null;
   if(typeof application!=="string"||!uuid.test(application)||
     !["approve","reject"].includes(String(decision))||(decision==="reject"&&!reason))
      return res(400,{error:"Invalid review"});
   const {data,error}=await admin.rpc("agent_admin_review_v1",{
     p_actor:identity.user.id,p_application:application,p_decision:decision,p_reason:reason
   });
   if(error) return res(error.code==="23505"?409:400,{error:"Review could not be completed"});
   return res(200,{result:data});
 }
 return res(400,{error:"Unknown action"});
});
