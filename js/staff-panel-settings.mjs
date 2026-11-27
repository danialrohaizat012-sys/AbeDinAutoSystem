// Suis ON/OFF paparan To-Do List dan Makluman untuk staf. Hanya Owner boleh ubah (dikuatkuasakan RLS).
const TABLE='staff_panel_settings';
const PANELS=[
 ['makluman_enabled','Makluman Staf','Panel merah makluman pada paparan staf'],
 ['todo_enabled','To-Do List Staf','Tugasan Saya pada halaman Kehadiran staf']
];
// Jika tetapan gagal dibaca, panel kekal dipaparkan.
export async function panelEnabled(client,key){
 try{const {data,error}=await client.from(TABLE).select(key).eq('id',true).single();return error||!data?true:data[key]!==false}
 catch{return true}
}
export function mountPanelToggles(host,{client,profile}){
 if(!host||profile?.role!=='owner'||profile.enabled!==true)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const style=el('style');style.textContent='.ada-panel-sw{border:1px solid rgba(128,144,160,.4);border-radius:11px;padding:8px 11px;margin:0 0 10px}.ada-panel-sw .pp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px}.ada-panel-sw .pp-row strong{display:block;font-size:13px}.ada-panel-sw .pp-row small{display:block;font-size:11px;opacity:.75}.ada-panel-sw button{flex:0 0 74px;min-height:34px;margin:0;padding:6px 0;border:0;border-radius:20px;font:inherit;font-size:12px;font-weight:800;color:#fff;background:#6b7785;cursor:pointer}.ada-panel-sw button[aria-checked=true]{background:#157a47}.ada-panel-sw button:disabled{opacity:.5}.ada-panel-sw .pp-msg{font-size:11px;margin:4px 0 0}.ada-panel-sw .pp-msg:empty{display:none}';
 const box=el('div','ada-panel-sw'),msg=el('p','pp-msg');msg.setAttribute('role','status');
 let state=null,busy=false;
 const buttons=PANELS.map(([key,title,desc])=>{
  const row=el('div','pp-row'),text=el('div'),b=el('button','','…');
  text.append(el('strong','',title),el('small','',desc));
  b.type='button';b.dataset.panel=key;b.disabled=true;b.setAttribute('role','switch');b.setAttribute('aria-label',title);
  b.onclick=()=>save(key,title);row.append(text,b);box.append(row);return b;
 });
 box.append(msg);host.replaceChildren(style,box);
 function paint(){for(const b of buttons){const on=state?.[b.dataset.panel]!==false;b.textContent=state?(on?'ON':'OFF'):'…';b.setAttribute('aria-checked',String(Boolean(state)&&on));b.disabled=busy||!state}}
 async function load(){
  const {data,error}=await client.from(TABLE).select('todo_enabled,makluman_enabled').eq('id',true).single();
  if(error||!data){msg.textContent='Gagal membaca tetapan: '+(error?.message||'tiada data');return}
  state=data;paint();
 }
 async function save(key,title){
  if(busy||!state)return;busy=true;paint();msg.textContent='Menyimpan…';
  const next=!state[key];
  try{
   const {data,error}=await client.from(TABLE).update({[key]:next,updated_at:new Date().toISOString(),updated_by:profile.id}).eq('id',true).select('todo_enabled,makluman_enabled').single();
   if(error||!data)throw error||Error('Akses tidak dibenarkan');
   state=data;msg.textContent=title+' kini '+(data[key]?'ON — staf boleh nampak':'OFF — disorok daripada staf')+'. Staf nampak perubahan apabila halaman dibuka semula.';
  }catch(err){msg.textContent='Gagal simpan: '+(err?.message||err)}
  finally{busy=false;paint()}
 }
 load().catch(err=>{msg.textContent='Gagal membaca tetapan: '+(err?.message||err)});
}
