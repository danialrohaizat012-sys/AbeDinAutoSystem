/* Parses labelled text from an OCR provider; does not perform OCR itself. */
(function(root){
"use strict";
const fields={"name":"name","phone number":"rawPhone","city":"city","province/state":"state","gender":"gender","job title":"occupation"};
function extract(text){
 const rows=[];let record={},pending=null;
 for(const line of String(text).split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){
 const match=line.match(/^(phone number|province\/state|job title|gender|city|name)(?:\s*[:：]\s*|\s+|$)(.*)$/i);
 if(match){const key=fields[match[1].toLowerCase()];if(key==="name"&&Object.keys(record).length){rows.push(record);record={};}pending=key;if(match[2]){record[key]=match[2].trim();pending=null;}}
 else if(pending){record[pending]=line;pending=null;}
 }
 if(Object.keys(record).length)rows.push(record);
 return rows.map(r=>({...r,phone:root.AdaTikTokImport.phone(r.rawPhone),source:"tiktok",requiresReview:true}));
}
root.AdaTikTokScreenshotText={extract};
})(globalThis);
