/* Requires existing authenticated Supabase client and reviewed tiktok_leads migration. */
(function(root){
"use strict";
async function save(client,rows){
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user)throw Error("Sila log masuk dahulu");
 const uid=data.user.id;
 const unique=new Map();
 for(const r of rows){if(r.valid&&!r.duplicate&&/^\+601[0-9]{8,9}$/.test(r.phone)&&r.name.trim().length<=200)unique.set(r.phone,{name:r.name.trim(),phone:r.phone,city:r.city||null,state:r.state||null,gender:r.gender||null,occupation:r.occupation||null,source_date:r.date||null,assigned_to:uid,created_by:uid});}
 const records=[...unique.values()];
 if(records.length>500)throw Error("Maksimum 500 rekod setiap import");
 if(!records.length)return {submitted:0,inserted:0,skipped:0};
 const result=await client.from("tiktok_leads").upsert(records,{onConflict:"phone",ignoreDuplicates:true}).select("id");
 if(result.error)throw Error(result.error.message);
 const inserted=result.data.length;
 return {submitted:records.length,inserted,skipped:records.length-inserted};
}
function whatsapp(phone){if(!/^\+601[0-9]{8,9}$/.test(phone))throw Error("Nombor tidak sah");return "https://wa.me/"+phone.slice(1);}
root.AdaTikTokStorage={save,whatsapp};
})(globalThis);
