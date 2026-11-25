(function(root){
"use strict";
function review(records){
 if(!Array.isArray(records)||records.length>500)throw Error("Maksimum 500 rekod");
 const seen=new Set();
 return records.map((r,i)=>{
 const name=String(r.name??"").trim(),rawPhone=String(r.rawPhone??r.phone??"");
 const phone=root.AdaTikTokImport.phone(rawPhone);
 const valid=!!phone&&name.length>0&&name.length<=200;
 const duplicate=valid&&seen.has(phone);
 if(valid)seen.add(phone);
 return {row:i+1,name,rawPhone,phone,city:String(r.city??"").trim(),date:String(r.date??"").trim(),valid,duplicate};
 });
}
function update(records,index,changes){
 if(!Number.isInteger(index)||index<0||index>=records.length)throw Error("Rekod tidak dijumpai");
 return review(records.map((r,i)=>i===index?{...r,...Object.fromEntries(Object.entries(changes).filter(([k])=>["name","rawPhone","city","date"].includes(k)))}:r));
}
root.AdaTikTokReview={review,update};
})(globalThis);
