// Native Agent Network panel; owner-only server authorization remains mandatory.
const API='https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/agent-portal-admin';
const date=v=>v?new Date(v).toLocaleString('ms-MY'):'—';
const amount=v=>'RM '+Number(v||0).toLocaleString('ms-MY',{minimumFractionDigits:2});
function node(t,c='',v){const a=document.createElement(t);if(c)a.className=c;if(v!==undefined)a.textContent=String(v);return a}
function line(p,title,detail){const a=node('div','ag-line');a.append(node('strong','',title),node('small','',detail));p.append(a);return a}
function phoneLink(phone){
 const p=String(phone||'').replace(/\D/g,'');
 if(/^0[1-9][0-9]{7,9}$/.test(p))return '60'+p.slice(1);
 if(/^60[1-9][0-9]{7,9}$/.test(p))return p;
 return null;
}
function contactControls(row,lead,carLabel){
 const phone=phoneLink(lead.customer_phone);
 if(!phone)return;
 const buttons=node('div','ag-controls');
 const call=node('a','ag-link','Hubungi Telefon');call.href='tel:+'+phone;
 const wa=node('a','ag-link ag-whatsapp','WhatsApp Pelanggan');wa.target='_blank';wa.rel='noopener noreferrer';
 wa.href='https://wa.me/'+phone+'?text='+encodeURIComponent(
  'Salam '+String(lead.customer_name||'')+', saya dari AbeDin Auto. Terima kasih kerana berminat dengan '+String(carLabel||'kereta kami')+'. Boleh kami bantu?');
 buttons.append(wa,call);row.append(buttons);
}
function leadCarLabel(lead){
 const car=lead.car;
 return car?[car.make,car.model,car.model_year].filter(Boolean).join(' ')||car.vehicle_id||'Kereta'
   :(lead.vehicle_id?'ID kereta '+String(lead.vehicle_id).slice(0,8):'Kereta tidak dinyatakan');
}
function compactLead(parent,a,car,onRead,agentLead){
 const details=node('details','ag-mini');
 const summary=node('summary','ag-mini-head');
 const title=node('div','ag-mini-title');
 title.append(node('strong','',a.customer_name||'Pelanggan'));
 const model=car?[car.make,car.model,car.model_year].filter(Boolean).join(' '):null;
 title.append(node('small','',model||'Kereta '+(a.vehicle_id||'tidak dinyatakan')));
 if(agentLead)title.append(node('small','','Ejen: '+(a.agent_name||'Nama tiada')+' ('+(a.agent_code||'—')+')'));
 summary.append(title,node('span',a.owner_read_at?'ag-read':'ag-unread',a.owner_read_at?'Sudah baca':'Belum baca'));
 const body=node('div','ag-mini-body');body.append(node('p','','Telefon: '+(a.customer_phone||'—')+' · '+a.status+' · '+date(a.created_at)));
 body.append(node('p','','Ejen '+(a.agent_read_at?'sudah baca':'belum baca')+' · Owner '+(a.owner_read_at?'sudah baca':'belum baca')));
 if(car?.vehicle_id){const link=node('a','ag-link','Lihat Kereta');const url=new URL('/',location.origin);url.searchParams.set('car',car.vehicle_id);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';body.append(link)}
 contactControls(body,a,model);
 if(!a.owner_read_at){const btn=node('button','ag-primary','Tandakan Sudah Baca');btn.type='button';btn.onclick=()=>onRead(a,agentLead?'agent':'direct');body.append(btn)}
 details.append(summary,body);parent.append(details);
}
function section(parent,title,desc,tab){const a=node('section','ag-card');if(tab)a.dataset.tab=tab;a.append(node('h3','',title),node('p','ag-desc',desc));parent.append(a);return a}
export function mountAgentAdmin(host,{client,profile}={}){
 host.replaceChildren();
 if(profile?.role!=='owner'||profile?.enabled!==true){host.append(node('p','muted','Hanya owner aktif boleh mengurus ejen.'));return}
 let loading=false,disposed=false;
 host.className='ada-agent-owner';
 const style=node('style');style.textContent='.ada-agent-owner .ag-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:15px}.ada-agent-owner h2{margin:0;font-size:24px}.ada-agent-owner h3{margin:0 0 7px;font-size:17px}.ada-agent-owner p{margin:5px 0 12px;color:#66788b;font-size:13px;line-height:1.5}.ada-agent-owner .ag-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.ada-agent-owner .ag-stat,.ada-agent-owner .ag-card{padding:16px;background:var(--card-bg,#fff);border:1px solid #d9e3ec;border-radius:14px}.ada-agent-owner .ag-stat b{display:block;font-size:25px}.ada-agent-owner .ag-stat small{color:#597188;font-size:12px}.ada-agent-owner .ag-sections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ada-agent-owner .ag-line{padding:12px 0;border-bottom:1px solid #e5eaf0;overflow-wrap:anywhere}.ada-agent-owner .ag-line:last-child{border:0}.ada-agent-owner .ag-line strong{display:block;font-size:14px}.ada-agent-owner .ag-line small{display:block;color:#687d90;font-size:12px;margin-top:4px}.ada-agent-owner .ag-controls{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.ada-agent-owner button,.ada-agent-owner .ag-link{padding:10px 13px;border-radius:9px;border:0;background:#e8eff7;color:#194e81;font:inherit;font-size:13px;font-weight:750;text-decoration:none;cursor:pointer}.ada-agent-owner .ag-primary{background:#1762a8!important;color:#fff!important}.ada-agent-owner .ag-whatsapp{background:#116d4a!important;color:white!important}.ada-agent-owner .ag-mini{border:1px solid #dce4ed;border-radius:10px;margin:7px 0;background:#fff}.ada-agent-owner .ag-mini-head{list-style:none;cursor:pointer;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}.ada-agent-owner .ag-mini-head::-webkit-details-marker{display:none}.ada-agent-owner .ag-mini-title{display:grid;gap:4px;min-width:0}.ada-agent-owner .ag-mini-title small{font-size:12px;color:#63778a}.ada-agent-owner .ag-mini-body{padding:12px;border-top:1px solid #e3e9ef}.ada-agent-owner .ag-read,.ada-agent-owner .ag-unread{white-space:nowrap;padding:5px 8px;border-radius:20px;font-size:11px}.ada-agent-owner .ag-read{background:#dcf0e3;color:#16603c}.ada-agent-owner .ag-unread{background:#fff0d6;color:#855b1b}.ada-agent-owner .ag-config{display:grid;grid-template-columns:1.5fr 1fr 1fr auto;gap:8px;align-items:end}.ada-agent-owner .ag-config label{display:grid;gap:5px;font-size:12px}.ada-agent-owner .ag-config select,.ada-agent-owner .ag-config input{border:1px solid #cdd9e4;border-radius:9px;padding:10px;max-width:100%;min-width:0}.ada-agent-owner .ag-config input[type=checkbox]{width:auto}@media(max-width:650px){.ada-agent-owner .ag-config{grid-template-columns:1fr 1fr}.ada-agent-owner .ag-config label:first-child{grid-column:1/-1}}.ada-agent-owner .ag-status{border-radius:9px;background:#eaf3fc;color:#1c527d;padding:11px;font-size:13px}.ada-agent-owner .ag-status.bad{background:#ffefe9;color:#8a422b}@media(max-width:850px){.ada-agent-owner .ag-sections{grid-template-columns:1fr}.ada-agent-owner .ag-counts{grid-template-columns:repeat(2,minmax(0,1fr))}}';
 // Match the parent system theme: dark by default, light only with html.ada-light.
 // Scoped tokens avoid changing other dashboard modules.
 style.textContent += `
 .ada-agent-owner{
   --ag-bg:#161b1e;--ag-raised:#1d2428;--ag-raised-hover:#242d32;
   --ag-ink:#f1f2ee;--ag-muted:#acb8bc;--ag-border:#343d41;
   --ag-accent:#d7b468;--ag-accent-ink:#161b1e;
   --ag-field:#222a2f;--ag-field-ink:#f1f2ee;--ag-field-border:#526066;
   --ag-soft:#303b41;--ag-soft-ink:#e1e9ec;
   --ag-status-bg:#22302f;--ag-status-ink:#c1ded2;
   color:var(--ag-ink)!important;color-scheme:dark;min-width:0;
 }
 html.ada-light .ada-agent-owner{
   --ag-bg:#ffffff;--ag-raised:#f7f9fb;--ag-raised-hover:#eef3f7;
   --ag-ink:#21323b;--ag-muted:#526977;--ag-border:#d8e1e8;
   --ag-accent:#8f6a2e;--ag-accent-ink:#fff;
   --ag-field:#fff;--ag-field-ink:#21323b;--ag-field-border:#a5b6c5;
   --ag-soft:#eaf0f4;--ag-soft-ink:#23445b;
   --ag-status-bg:#e8f1ee;--ag-status-ink:#245846;
   color-scheme:light;
 }
 .ada-agent-owner .ag-card,.ada-agent-owner .ag-stat,.ada-agent-owner .ag-mini{
   background:var(--ag-bg)!important;border:1px solid var(--ag-border)!important;
   color:var(--ag-ink)!important;box-shadow:none!important;
 }
 .ada-agent-owner .ag-card{border-radius:14px!important}
 .ada-agent-owner .ag-stat{border-radius:12px!important}
 .ada-agent-owner h2,.ada-agent-owner h3,.ada-agent-owner .ag-line strong,
 .ada-agent-owner .ag-mini-title strong,.ada-agent-owner .ag-stat b{
   color:var(--ag-ink)!important;opacity:1!important;
 }
 .ada-agent-owner p,.ada-agent-owner .ag-line small,.ada-agent-owner .ag-mini-title small,
 .ada-agent-owner .ag-stat small,.ada-agent-owner .ag-config label,.ada-agent-owner .ag-mini-body p{
   color:var(--ag-muted)!important;opacity:1!important;
 }
 .ada-agent-owner .ag-mini{background:var(--ag-raised)!important}
 .ada-agent-owner .ag-mini-head:hover,.ada-agent-owner .ag-mini[open] .ag-mini-head{
   background:var(--ag-raised-hover)!important
 }
 .ada-agent-owner .ag-mini-body,.ada-agent-owner .ag-line{border-color:var(--ag-border)!important}
 .ada-agent-owner .ag-mini-body{color:var(--ag-ink)!important}
 .ada-agent-owner .ag-config select,.ada-agent-owner .ag-config input:not([type=checkbox]){
   appearance:auto;-webkit-appearance:auto;background:var(--ag-field)!important;
   color:var(--ag-field-ink)!important;-webkit-text-fill-color:var(--ag-field-ink)!important;
   border:1px solid var(--ag-field-border)!important;border-radius:9px!important;
   min-height:42px;opacity:1!important;color-scheme:inherit;
 }
 .ada-agent-owner .ag-config select option{background:var(--ag-field)!important;color:var(--ag-field-ink)!important}
 .ada-agent-owner .ag-config input[type=checkbox]{accent-color:var(--ag-accent);width:20px;height:20px}
 .ada-agent-owner button:not(.ag-primary),.ada-agent-owner .ag-link:not(.ag-primary):not(.ag-whatsapp){
   background:var(--ag-soft)!important;color:var(--ag-soft-ink)!important;
   -webkit-text-fill-color:var(--ag-soft-ink)!important;border:1px solid var(--ag-border)!important;
 }
 .ada-agent-owner .ag-primary{
   background:var(--ag-accent)!important;color:var(--ag-accent-ink)!important;
   -webkit-text-fill-color:var(--ag-accent-ink)!important;border:1px solid transparent!important
 }
 .ada-agent-owner .ag-whatsapp{background:#146848!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
 .ada-agent-owner .ag-status{
   background:var(--ag-status-bg)!important;color:var(--ag-status-ink)!important;
   border:1px solid var(--ag-border)!important
 }
 .ada-agent-owner .ag-status.bad{background:#382927!important;color:#f1b5a7!important}
 html.ada-light .ada-agent-owner .ag-status.bad{background:#fff1ed!important;color:#903f2b!important}
 .ada-agent-owner .ag-read{background:#244537!important;color:#bfe8cc!important}
 .ada-agent-owner .ag-unread{background:#45361e!important;color:#f5d894!important}
 html.ada-light .ada-agent-owner .ag-read{background:#e0f1e6!important;color:#196443!important}
 html.ada-light .ada-agent-owner .ag-unread{background:#fff0d5!important;color:#815717!important}
 .ada-agent-owner .ag-com-search{width:100%;margin:10px 0;min-height:40px;border-radius:9px;padding:0 12px;background:var(--ag-field);color:var(--ag-field-ink);border:1px solid var(--ag-field-border)}
 .ada-agent-owner .ag-com-list{display:grid;gap:8px;max-height:560px;overflow:auto}
 .ada-agent-owner .ag-com-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 110px auto auto;gap:8px;align-items:center;padding:9px 10px;border:1px solid var(--ag-border);border-radius:10px;background:var(--ag-raised)}
 .ada-agent-owner .ag-com-row[hidden]{display:none}
 .ada-agent-owner .ag-com-name strong{display:block}.ada-agent-owner .ag-com-name small,.ada-agent-owner .ag-com-st{color:var(--ag-muted)}
 .ada-agent-owner .ag-com-st{grid-column:1/-1;font-size:12px}
 .ada-agent-owner .ag-com-row input,.ada-agent-owner .ag-com-row select{min-height:38px;border-radius:8px;padding:0 8px;background:var(--ag-field);color:var(--ag-field-ink);border:1px solid var(--ag-field-border);width:100%}
 .ada-agent-owner .ag-com-on{white-space:nowrap;font-size:13px}
 @media(max-width:650px){.ada-agent-owner .ag-com-row{grid-template-columns:1fr 1fr}.ada-agent-owner .ag-com-name{grid-column:1/-1}}
 .ada-agent-owner button.ag-danger{background:#5a2620!important;color:#ffd9d2!important;-webkit-text-fill-color:#ffd9d2!important;border:1px solid #7a3328!important}
 html.ada-light .ada-agent-owner button.ag-danger{background:#fdecea!important;color:#9b2c1d!important;-webkit-text-fill-color:#9b2c1d!important}
 .ada-agent-owner .ag-agent-actions{margin-top:10px}.ada-agent-owner .ag-agent-edit{margin-top:10px}
 .ada-agent-owner .ag-promo-slot{border:1px solid var(--ag-border);border-radius:10px;padding:10px;margin-top:10px;background:var(--ag-raised)}
 .ada-agent-owner .ag-promo-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
 .ada-agent-owner .ag-promo-slot textarea{width:100%;box-sizing:border-box;border-radius:8px;padding:8px;background:var(--ag-field);color:var(--ag-field-ink);border:1px solid var(--ag-field-border);font:inherit}
 .ada-agent-owner .ag-promo-count{display:block;text-align:right;color:var(--ag-muted);font-size:12px}
 .ada-agent-owner .ag-counts{gap:10px!important}
 .ada-agent-owner .ag-sections{gap:13px!important}
 .ada-agent-owner .ag-config{gap:10px!important}
 .ada-agent-owner .ag-config label{font-weight:600!important}
 .ada-agent-owner button:focus-visible,.ada-agent-owner a:focus-visible,
 .ada-agent-owner input:focus-visible,.ada-agent-owner select:focus-visible,
 .ada-agent-owner summary:focus-visible{outline:2px solid var(--ag-accent)!important;outline-offset:2px}
 @media(max-width:650px){
   .ada-agent-owner .ag-card{padding:14px!important}
   .ada-agent-owner .ag-stat{padding:12px!important}
   .ada-agent-owner .ag-config{gap:9px!important}
 }
 .ada-agent-owner{font-size:14px}
 .ada-agent-owner .ag-header{margin-bottom:12px!important}
 .ada-agent-owner .ag-header h2{font-size:22px!important;letter-spacing:-.01em}
 .ada-agent-owner .ag-sub{margin:2px 0 0!important;font-size:13px}
 .ada-agent-owner button.ag-icon{width:40px;height:40px;border-radius:50%!important;font-size:18px;padding:0!important}
 .ada-agent-owner .ag-counts{display:flex!important;flex-wrap:wrap;gap:8px!important;margin-bottom:14px}
 .ada-agent-owner .ag-stat{flex:1 1 120px;padding:10px 14px!important;border-radius:12px!important}
 .ada-agent-owner .ag-stat small{font-size:11px;text-transform:uppercase;letter-spacing:.06em}
 .ada-agent-owner .ag-stat b{display:block;font-size:22px;margin-top:2px}
 .ada-agent-owner .ag-tabs{display:flex;gap:4px;overflow-x:auto;padding:4px;margin-bottom:14px;border-radius:12px;background:var(--ag-raised);border:1px solid var(--ag-border);position:sticky;top:0;z-index:2;scrollbar-width:none}
 .ada-agent-owner .ag-tabs::-webkit-scrollbar{display:none}
 .ada-agent-owner button.ag-tab{flex:1 0 auto;background:transparent!important;border:0!important;color:var(--ag-muted)!important;-webkit-text-fill-color:var(--ag-muted)!important;padding:9px 14px!important;border-radius:9px!important;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:0}
 .ada-agent-owner button.ag-tab.on{background:var(--ag-bg)!important;color:var(--ag-ink)!important;-webkit-text-fill-color:var(--ag-ink)!important;box-shadow:0 1px 3px rgba(0,0,0,.25)!important}
 .ada-agent-owner .ag-badge{background:var(--ag-accent);color:var(--ag-accent-ink);-webkit-text-fill-color:var(--ag-accent-ink);font-size:11px;font-weight:700;border-radius:999px;min-width:18px;height:18px;line-height:18px;padding:0 5px;text-align:center}
 .ada-agent-owner .ag-status{border-radius:10px!important;padding:8px 12px!important;margin-bottom:12px;font-size:13px}
 .ada-agent-owner .ag-status[hidden]{display:none!important}
 .ada-agent-owner .ag-sections{display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
 .ada-agent-owner .ag-card[hidden]{display:none!important}
 .ada-agent-owner .ag-card{padding:16px!important;border-radius:14px!important}
 .ada-agent-owner .ag-card h3{font-size:16px!important;margin:0 0 2px!important}
 .ada-agent-owner .ag-desc{font-size:12.5px!important;margin:0 0 12px!important}
 .ada-agent-owner .ag-mini{border-radius:10px!important;margin-top:6px}
 .ada-agent-owner .ag-mini-head{padding:10px 12px!important}
 .ada-agent-owner .ag-mini-title small{font-size:12px}
 .ada-agent-owner .ag-read,.ada-agent-owner .ag-unread{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}
 .ada-agent-owner .ag-line{padding:10px 0!important}
 .ada-agent-owner button{border-radius:9px!important}
 .ada-agent-owner .ag-agent-actions button{padding:7px 12px!important;font-size:13px}
 `;
 const top=node('div','ag-header'),heading=node('div');
 heading.append(node('h2','','Ejen'),node('p','ag-sub','Urus ejen, komisen, promosi dan kelulusan.'));
 const controls=node('div','ag-controls');
 const refresh=node('button','ag-icon','↻');refresh.title='Muat semula';refresh.setAttribute('aria-label','Muat semula');refresh.type='button';
 controls.append(refresh);top.append(heading,controls);
 const msg=node('div','ag-status','Memuatkan rekod ejen...');msg.setAttribute('role','status');
 const counts=node('div','ag-counts'),tabsBar=node('nav','ag-tabs'),content=node('div','ag-sections');
 tabsBar.setAttribute('role','tablist');
 let activeTab=(()=>{try{return localStorage.getItem('ada-agent-tab')||'ejen'}catch{return 'ejen'}})();
 const TABS=[['ejen','Ejen'],['komisen','Komisen'],['kelulusan','Kelulusan'],['lead','Lead'],['promosi','Promosi']];
 function tabify(badges={}){
  tabsBar.replaceChildren();
  for(const [id,label] of TABS){
   const b=node('button','ag-tab'+(id===activeTab?' on':''),label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(id===activeTab));
   if(badges[id])b.append(node('span','ag-badge',badges[id]));
   b.onclick=()=>{activeTab=id;try{localStorage.setItem('ada-agent-tab',id)}catch{};tabify(badges)};
   tabsBar.append(b);
  }
  for(const sec of content.children)sec.hidden=sec.dataset.tab!==activeTab;
 }
 host.append(style,top,counts,tabsBar,msg,content);
 let msgTimer=0;function status(v,bad=false){if(disposed)return;msg.textContent=v;msg.className='ag-status'+(bad?' bad':'');msg.hidden=false;clearTimeout(msgTimer);if(!bad)msgTimer=setTimeout(()=>{if(!disposed)msg.hidden=true},3500)}
 async function request(action,params={}){
  const {data,error}=await client.auth.getSession();
  if(error||!data?.session?.access_token)throw Error('Sesi admin tamat. Sila log keluar dan masuk semula.');
  async function send(token){
   const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0',authorization:'Bearer '+token},body:JSON.stringify({action,...params})});
   const payload=await r.json().catch(()=>({}));
   return {r,payload};
  }
  let result=await send(data.session.access_token);
  if(result.r.status===401){
   const refreshed=await client.auth.refreshSession();
   if(!refreshed.error&&refreshed.data?.session?.access_token)result=await send(refreshed.data.session.access_token);
  }
  if(!result.r.ok){
   if(result.r.status===401)throw Error('Sesi atau pengesahan e-mel akaun owner tidak sah. Sila log keluar, masuk semula dan pastikan e-mel telah disahkan.');
   if(result.r.status===403)throw Error('Akaun ini belum mempunyai akses Owner aktif untuk modul ejen.');
   throw Error(result.payload.error||'Gagal memuat data ejen');
  }
  return result.payload;
 }
 function stat(title,value){const a=node('div','ag-stat');a.append(node('small','',title),node('b','',value));return a}
 async function ownerRead(a,type){
  try{await request('owner_lead_mark_read',{lead_id:a.id,lead_type:type});status('Status dibaca disimpan.');await load()}
  catch(e){status(e.message,true)}
 }
 async function load(){
  if(loading||disposed)return;loading=true;refresh.disabled=true;status('Menyemak data ejen...');
  try{
   const [apps,leads,direct,fin,contacts,vehicleData,agentRes]=await Promise.all([request('list'),request('lead_list'),request('direct_inquiry_list'),request('finance_list'),request('lead_contact_list'),request('commission_vehicle_list'),client.rpc('owner_agent_list_v1')]);
   const agents=Array.isArray(agentRes?.data)?agentRes.data:[];
   if(disposed)return;
   const applications=apps.applications||[],agentLeads=contacts.leads||[],directLeads=direct.inquiries||[],commissions=fin.commissions||[],payouts=fin.payouts||[];
   const vehicles=vehicleData.vehicles||[],carMap=new Map(vehicles.map(v=>[v.id,v]));
   counts.replaceChildren(stat('Ejen aktif',agents.filter(x=>x.agent_status==='active').length),stat('Lead',agentLeads.length+directLeads.length),stat('Komisen belum bayar',commissions.filter(c=>c.status!=='paid').length));
   content.replaceChildren();
   const pl=section(content,'Senarai Ejen ('+agents.length+')','Semua ejen berdaftar dan prestasi mereka. Tekan nama untuk butiran.','ejen');
   if(agentRes?.error)pl.append(node('p','','Gagal memuat senarai ejen: '+agentRes.error.message));
   else if(!agents.length)pl.append(node('p','','Belum ada ejen berdaftar.'));
   const label={active:'Aktif',suspended:'Tidak aktif',terminated:'Ditamatkan'};
   for(const g of agents){
    const d=node('details','ag-mini'),sm=node('summary','ag-mini-head'),t=node('div','ag-mini-title');
    t.append(node('strong','',g.name||g.email||'Ejen'),node('small','',[g.agent_code||'Tiada kod',g.phone,[g.city,g.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')));
    const act=g.agent_status==='active',st=act?'Aktif':g.application_status==='pending'?'Menunggu kelulusan':(label[g.agent_status]||g.application_status||g.agent_status);
    sm.append(t,node('span',act?'ag-read':'ag-unread',st));
    const b=node('div','ag-mini-body');
    b.append(node('p','','Klik pautan: '+g.clicks+' (30 hari: '+g.clicks_30d+') · Lead: '+g.leads+' · Komisen: '+g.commissions+' ('+amount(g.commission_total)+') · Dibayar: '+amount(g.paid_total)));
    b.append(node('p','','E-mel: '+(g.email||'—')+' · Mohon: '+date(g.applied_at)+' · Aktif sejak: '+date(g.activated_at)));
    contactControls(b,{customer_phone:g.phone,customer_name:g.name},null);
    const wa=b.querySelector('.ag-whatsapp');if(wa){wa.textContent='WhatsApp Ejen';wa.href=wa.href.split('?')[0];}
    if(g.user_id){
     const ctl=node('div','ag-controls ag-agent-actions');
     const ed=node('button','','✏️ Edit');ed.type='button';
     const form=node('form','ag-config ag-agent-edit');form.hidden=true;
     const fld=(lab,val,type='text')=>{const l=node('label','',lab),i=node('input');i.type=type;i.value=val||'';l.append(i);form.append(l);return i};
     const fN=fld('Nama',g.name),fP=fld('Telefon',g.phone,'tel'),fS=fld('Negeri',g.state),fC=fld('Bandar',g.city);
     const sv=node('button','ag-primary','Simpan');sv.type='submit';const cn=node('button','','Batal');cn.type='button';form.append(sv,cn);
     ed.onclick=()=>{form.hidden=!form.hidden};cn.onclick=()=>{form.hidden=true};
     form.onsubmit=async e=>{e.preventDefault();sv.disabled=true;try{const {error}=await client.rpc('owner_agent_update_v1',{p_user_id:g.user_id,p_name:fN.value,p_phone:fP.value,p_state:fS.value,p_city:fC.value});if(error)throw error;status('Butiran ejen dikemas kini.');await load()}catch(err){status(err.message.includes('phone_check')?'Nombor telefon tidak sah (9–24 aksara).':err.message,true)}finally{sv.disabled=false}};
     ctl.append(ed);
     if(g.agent_profile_id){
      const isAct=g.agent_status==='active';
      const tg=node('button',isAct?'':'ag-primary',isAct?'⏸ Nyahaktif':'▶ Aktifkan');tg.type='button';
      tg.onclick=async()=>{if(!confirm((isAct?'Nyahaktifkan':'Aktifkan semula')+' ejen '+(g.name||'')+'?'+(isAct?'\nEjen tidak boleh guna portal dan link promosi sehingga diaktifkan semula.':'')))return;tg.disabled=true;
       try{const {error}=await client.rpc('owner_agent_set_status_v1',{p_user_id:g.user_id,p_status:isAct?'suspended':'active'});if(error)throw error;status('Status ejen dikemas kini.');await load()}catch(err){status(err.message,true);tg.disabled=false}};
      ctl.append(tg);
     }
     const del=node('button','ag-danger','🗑 Padam');del.type='button';
     del.onclick=async()=>{if(!confirm('Padam ejen '+(g.name||'')+'?\nProfil ejen, permohonan dan link promosi akan dibuang. Akaun log masuk (dan akaun staf, jika ada) tidak terjejas.'))return;del.disabled=true;
      try{const {error}=await client.rpc('owner_agent_delete_v1',{p_user_id:g.user_id});if(error)throw error;status('Ejen dipadam.');await load()}catch(err){status(err.message,true);del.disabled=false}};
     ctl.append(del);b.append(ctl,form);
    }
    d.append(sm,b);pl.append(d);
   }
   const pa=section(content,'Permohonan Ejen','Owner semak maklumat sebelum meluluskan permohonan.','ejen');
   if(!applications.length)pa.remove();
   for(const a of applications){
    const n=line(pa,a.full_name||'Pemohon',[a.email,a.phone,a.state,date(a.applied_at)].filter(Boolean).join(' · '));
    const buttons=node('div','ag-controls'),yes=node('button','ag-primary','Luluskan'),no=node('button','','Tolak');
    yes.onclick=async()=>{if(!confirm('Luluskan permohonan '+(a.full_name||'ejen')+' selepas semakan?'))return;yes.disabled=true;no.disabled=true;try{await request('review',{application_id:a.id,decision:'approve'});status('Permohonan diluluskan.');}catch(e){status(e.message,true)}finally{yes.disabled=false;no.disabled=false;await load()}};
    no.onclick=async()=>{const reason=prompt('Sebab penolakan (wajib):');if(!reason?.trim())return;yes.disabled=true;no.disabled=true;try{await request('review',{application_id:a.id,decision:'reject',reason:reason.trim()});status('Permohonan ditolak.');}catch(e){status(e.message,true)}finally{yes.disabled=false;no.disabled=false;await load()}};
    buttons.append(yes,no);n.append(buttons);
   }
   if(applications.length)content.prepend(pa);
   const pp=section(content,'Ayat Promosi Ejen (5 Pilihan)','Tulis dan terbitkan ayat yang ejen guna bila kongsi kereta. Guna {model}, {tahun}, {harga} — sistem isi automatik ikut kereta.','promosi');
   const aiBtn=node('button','','📋 Salin Prompt AI (5 Ayat)');aiBtn.type='button';
   aiBtn.onclick=async()=>{const t='Jana tepat 5 ayat promosi kereta terpakai AbeDin Auto dalam Bahasa Melayu. Setiap ayat maksimum 500 aksara dan wajib mengandungi {model}, {tahun}, {harga}. Gaya berlainan, menarik dan profesional. Jangan mereka-reka diskaun, kelulusan pinjaman, jaminan, keadaan kereta atau stok. Nomborkan 1 hingga 5.';try{await navigator.clipboard.writeText(t);status('Prompt AI disalin. Tampal dalam ChatGPT/Claude.')}catch{prompt('Salin prompt ini:',t)}};
   pp.append(aiBtn);
   const {data:promos,error:promoErr}=await client.from('agent_promo_copy_v20').select('slot,draft,published').order('slot');
   if(promoErr)pp.append(node('p','','Gagal memuat ayat promosi: '+promoErr.message));
   for(const entry of promos||[]){
    const box=node('div','ag-promo-slot');
    const head=node('div','ag-promo-head');head.append(node('strong','','Pilihan '+entry.slot));
    const live=entry.published&&entry.published===entry.draft;
    head.append(node('span',entry.published?(live?'ag-read':'ag-unread'):'ag-unread',entry.published?(live?'Diterbitkan':'Ada perubahan belum diterbit'):'Belum diterbitkan'));
    const area=node('textarea');area.value=entry.draft||'';area.maxLength=500;area.rows=3;
    const cnt=node('small','ag-promo-count',(area.value.length)+'/500');area.oninput=()=>{cnt.textContent=area.value.length+'/500'};
    const btns=node('div','ag-controls');
    for(const publish of [false,true]){
     const b=node('button',publish?'ag-primary':'',publish?'Terbitkan kepada ejen':'Simpan draf');b.type='button';
     b.onclick=async()=>{if(publish&&!/\{model\}|\{tahun\}|\{harga\}/.test(area.value)&&!confirm('Ayat ini tiada {model}/{tahun}/{harga}. Terbitkan juga?'))return;b.disabled=true;
      try{const {error}=await client.rpc('save_agent_promo_v20',{p_slot:entry.slot,p_draft:area.value,p_publish:publish});if(error)throw error;status(publish?'Ayat Pilihan '+entry.slot+' diterbitkan kepada ejen.':'Draf disimpan.');await load()}
      catch(e){status(e.message,true);b.disabled=false}};
     btns.append(b);
    }
    box.append(head,area,cnt,btns);pp.append(box);
   }
   const pb=section(content,'Lead daripada Ejen','Lead masuk melalui pautan promosi atau pendaftaran manual. Owner mengesahkan jualan sebelum komisen.','lead');
   if(!agentLeads.length)pb.append(node('p','','Belum ada lead ejen.'));
   for(const a of agentLeads.slice(0,60))compactLead(pb,a,a.car,ownerRead,true);
   const pc=section(content,'Pertanyaan Pembeli Terus','Lead tanpa ejen, tidak layak untuk komisen ejen.','lead');
   if(!directLeads.length)pc.append(node('p','','Belum ada pertanyaan terus.'));
   for(const a of directLeads.slice(0,60))compactLead(pc,a,carMap.get(a.vehicle_id),ownerRead,false);
   const po=section(content,'Komisen Ejen Setiap Kereta','Tetapkan amaun komisen untuk setiap kereta. Amaun ini terus dipaparkan kepada ejen di kad kereta dalam portal mereka. Dibayar hanya selepas jualan disahkan.','komisen');
   const live=vehicles.filter(v=>!['sold','deleted','archived'].includes(String(v.status||'').toLowerCase()));
   const bulk=node('div','ag-config'),bLabel=node('label','','Isi semua kereta yang belum ada komisen (RM)'),bAmt=node('input');bAmt.type='number';bAmt.min='0';bAmt.step='50';bAmt.placeholder='cth 300';bLabel.append(bAmt);
   const bBtn=node('button','ag-primary','Guna untuk semua kosong');bBtn.type='button';bulk.append(bLabel,bBtn);po.append(bulk);
   const filter=node('input');filter.type='search';filter.placeholder='Cari kereta / ID…';filter.className='ag-com-search';po.append(filter);
   const list=node('div','ag-com-list');po.append(list);
   const rows=[];
   async function saveOffer(v,amount,cat,on){
    await request('commission_offer_set',{vehicle_id:v.id,category:cat,amount:Number(amount||0).toFixed(2),active:on});
    v.offer={...(v.offer||{}),indicative_amount:Number(amount||0),category:cat,active:on};
   }
   for(const v of live){
    const r=node('div','ag-com-row');r.dataset.search=[v.vehicle_id,v.make,v.model,v.model_year].join(' ').toLowerCase();
    const t=node('div','ag-com-name');t.append(node('strong','',[v.make,v.model,v.model_year].filter(Boolean).join(' ')),node('small','',v.vehicle_id+' · '+(v.status||'')));
    const a=node('input');a.type='number';a.min='0';a.max='100000';a.step='50';a.inputMode='decimal';a.placeholder='RM';a.value=v.offer?.indicative_amount??'';
    const c=node('select');for(const [val,lab] of [['standard','Standard'],['premium','Premium'],['special','Khas']]){const o=node('option','',lab);o.value=val;c.append(o)}c.value=v.offer?.category||'standard';
    const onL=node('label','ag-com-on'),on=node('input');on.type='checkbox';on.checked=v.offer?v.offer.active!==false:true;onL.append(on,document.createTextNode(' Papar'));
    const b=node('button','ag-primary','Simpan');b.type='button';
    const st=node('small','ag-com-st',v.offer?.indicative_amount>0?'✓ RM '+Number(v.offer.indicative_amount).toLocaleString('ms-MY'):'Belum ditetapkan');
    b.onclick=async()=>{if(a.value===''||Number(a.value)<0||Number(a.value)>100000){a.focus();return}b.disabled=true;
     try{await saveOffer(v,a.value,c.value,on.checked);st.textContent='✓ Disimpan RM '+Number(a.value).toLocaleString('ms-MY')+(on.checked?'':' (disorok)');status('Komisen '+v.vehicle_id+' disimpan.')}
     catch(e){st.textContent='Gagal';status(e.message,true)}finally{b.disabled=false}};
    a.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();b.click()}});
    r.append(t,a,c,onL,b,st);list.append(r);rows.push({v,a,c,on,st});
   }
   if(!live.length)list.append(node('p','','Tiada kereta dalam stok.'));
   filter.oninput=()=>{const q=filter.value.trim().toLowerCase();for(const el of list.children)el.hidden=q&&!String(el.dataset.search||'').includes(q)};
   bBtn.onclick=async()=>{const val=Number(bAmt.value);if(!(val>0)){bAmt.focus();return}
    const empty=rows.filter(x=>!(Number(x.v.offer?.indicative_amount)>0));if(!empty.length){status('Semua kereta sudah ada komisen.');return}
    if(!confirm('Tetapkan RM '+val.toLocaleString('ms-MY')+' untuk '+empty.length+' kereta yang belum ada komisen?'))return;
    bBtn.disabled=true;let ok=0;
    for(const x of empty){try{await saveOffer(x.v,val,x.c.value,true);x.a.value=val;x.st.textContent='✓ RM '+val.toLocaleString('ms-MY');ok++;status('Menyimpan… '+ok+'/'+empty.length)}catch(e){x.st.textContent='Gagal'}}
    bBtn.disabled=false;status(ok+' kereta dikemas kini dengan komisen RM '+val.toLocaleString('ms-MY')+'.')};
   const pk=section(content,'Kelulusan Lead, Komisen & Payout','Padankan lead dengan jualan, luluskan komisen, sediakan dan luluskan payout. Tiada pindahan wang dibuat di sini.','kelulusan');
   const act=async(payload,okMsg,btn)=>{btn.disabled=true;try{await request(payload.action,payload);status(okMsg);await load()}catch(e){status(e.message,true);btn.disabled=false}};
   const agentName=id=>{const g=agents.find(x=>x.agent_profile_id===id);return g?(g.name||'Ejen')+' ('+(g.agent_code||'—')+')':'Ejen '+String(id||'').slice(0,8)};
   const unlinked=leads.leads||[];
   const hasCommission=new Set(commissions.map(c=>c.sale_id));
   const wonLeads=(fin.leads||[]).filter(l=>l.status==='won'&&!hasCommission.has(l.linked_sale_id));
   const approved=commissions.filter(c=>c.status==='approved');
   const drafts=payouts.filter(p=>p.status==='draft'),waitHr=payouts.filter(p=>p.status==='approved');
   if(!unlinked.length&&!wonLeads.length&&!approved.length&&!drafts.length&&!waitHr.length)pk.append(node('p','','Tiada tindakan menunggu.'));
   for(const l of unlinked){
    const n=line(pk,'🔗 '+(l.customer_name||'Pelanggan')+' · '+(l.customer_phone||''),agentName(l.agent_id)+' · '+(l.lead_source==='public_referral'?'Melalui link ejen':'Daftar manual ejen'));
    const b=node('button','ag-primary','Padankan dengan jualan');b.type='button';
    b.onclick=()=>{const sale_id=prompt('ID jualan (UUID) dalam sistem:');if(!sale_id)return;const reason=prompt('Bukti persetujuan & pengesahan padanan (min. 15 aksara):');if(!reason||reason.trim().length<15)return status('Sebab terlalu pendek (min. 15 aksara).',true);
     act({action:'link_lead',lead_id:l.id,sale_id:sale_id.trim(),reason:reason.trim()},'Lead dipadankan dengan jualan.',b)};
    n.append(b);
   }
   for(const l of wonLeads){
    const n=line(pk,'✅ Komisen menunggu: '+(l.customer_name||''),agentName(l.agent_id)+' · Jualan '+String(l.linked_sale_id||'').slice(0,8));
    const b=node('button','ag-primary','Luluskan komisen');b.type='button';
    b.onclick=()=>{const amount=prompt('Amaun komisen (RM, cth 300.00):');if(!amount)return;const reason=prompt('Sebab & bukti semakan (bayaran penuh, tiada refund) — min. 20 aksara:');if(!reason||reason.trim().length<20)return status('Sebab terlalu pendek (min. 20 aksara).',true);
     if(!confirm('Luluskan komisen RM '+amount+' untuk '+agentName(l.agent_id)+'?'))return;
     act({action:'approve_commission',lead_id:l.id,amount:amount.trim(),reason:reason.trim(),finance_reconciled:true},'Komisen diluluskan.',b)};
    n.append(b);
   }
   for(const c of approved){
    const n=line(pk,'💵 Komisen '+amount(c.agreed_amount)+' diluluskan',agentName(c.agent_id)+' · sedia untuk payout');
    const b=node('button','ag-primary','Sediakan payout');b.type='button';
    b.onclick=()=>{const reason=prompt('Sebab penyediaan payout (min. 15 aksara):');if(!reason||reason.trim().length<15)return status('Sebab terlalu pendek (min. 15 aksara).',true);
     act({action:'prepare_payout',commission_id:c.id,reason:reason.trim()},'Payout disediakan.',b)};
    n.append(b);
   }
   for(const p of drafts){
    const n=line(pk,'🧾 Payout '+amount(p.amount)+' (draf)',agentName(p.agent_id));
    const b=node('button','ag-primary','Luluskan payout');b.type='button';
    b.onclick=()=>{const reason=prompt('Sebab kelulusan payout (min. 15 aksara):');if(!reason||reason.trim().length<15)return status('Sebab terlalu pendek (min. 15 aksara).',true);
     act({action:'approve_payout',payout_id:p.id,reason:reason.trim()},'Payout diluluskan. Menunggu HR sahkan bayaran bank.',b)};
    n.append(b);
   }
   for(const p of waitHr)line(pk,'⏳ Payout '+amount(p.amount)+' diluluskan',agentName(p.agent_id)+' · menunggu HR sahkan bayaran bank');
   const pd=section(content,'Ringkasan Komisen & Payout','Bayaran kekal memerlukan kelulusan owner dan pengesahan HR yang berasingan.','kelulusan');
   if(!commissions.length&&!payouts.length)pd.append(node('p','','Belum ada komisen atau payout.'));
   for(const c of commissions.slice(0,20))line(pd,'Komisen '+amount(c.agreed_amount),['Status '+c.status,agentName(c.agent_id),date(c.created_at)].join(' · '));
   for(const p of payouts.slice(0,20))line(pd,'Payout '+amount(p.amount),['Status '+p.status,agentName(p.agent_id),date(p.created_at)].join(' · '));
   const unreadLeads=agentLeads.filter(x=>!x.owner_read_at).length+directLeads.filter(x=>!x.owner_read_at).length;
   const pendingApprove=(leads.leads||[]).length+(fin.leads||[]).filter(l=>l.status==='won'&&!new Set(commissions.map(c=>c.sale_id)).has(l.linked_sale_id)).length+commissions.filter(c=>c.status==='approved').length+payouts.filter(p=>p.status==='draft').length;
   tabify({ejen:applications.length,kelulusan:pendingApprove,lead:unreadLeads,komisen:vehicles.filter(v=>!['sold','deleted','archived'].includes(String(v.status||'').toLowerCase())&&!(Number(v.offer?.indicative_amount)>0)).length});
   status('Dikemas kini.');
  }catch(e){status(e?.message||'Gagal memuat rekod ejen.',true)}
  finally{loading=false;refresh.disabled=false}
 }
 refresh.onclick=()=>load();
 void load();
 return()=>{disposed=true;host.replaceChildren()};
}
