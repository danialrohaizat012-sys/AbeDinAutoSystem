/* Standalone TikTok CSV parser; no network or database writes. */
(function(root){
"use strict";
function parse(text){
 text=String(text).replace(/^\uFEFF/,"");
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else quoted=false;}else cell+=c;}else if(c==='"'&&cell===""){quoted=true;}else if(c===','){row.push(cell);cell="";}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
 if(quoted)throw Error("CSV: petikan tidak lengkap");row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function phone(s){let p=String(s||"").replace(/[\s()+-]/g,"");if(p.startsWith("0"))p="60"+p.slice(1);return /^601\d{8,9}$/.test(p)? "+"+p:null;}
function preview(text){const rows=parse(text);if(!rows.length)return [];const headers=rows.shift().map(x=>x.trim().toLowerCase().replace(/[_-]/g," "));const idx=(names)=>headers.findIndex(h=>names.includes(h));const n=idx(["name","full name","nama"]),p=idx(["phone","phone number","mobile number","nombor telefon"]),c=idx(["city","bandar"]),d=idx(["date","created time","created at","tarikh"]);if(n<0||p<0)throw Error("Lajur nama dan nombor telefon diperlukan");const seen=new Set();return rows.map((r,i)=>{const normalized=phone(r[p]);const duplicate=normalized!==null&&seen.has(normalized);if(normalized)seen.add(normalized);return {row:i+2,name:(r[n]||"").trim(),phone:normalized,rawPhone:r[p]||"",city:(r[c]||"").trim(),date:(r[d]||"").trim(),duplicate,valid:!!normalized&&!!(r[n]||"").trim()};});}
const api={parse,phone,preview};if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.AdaTikTokImport=api;
})(typeof globalThis!=="undefined"?globalThis:this);
