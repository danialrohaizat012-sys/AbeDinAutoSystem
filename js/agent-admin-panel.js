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
function section(parent,title,desc){const a=node('section','ag-card');a.append(node('h3','',title),node('p','',desc));parent.append(a);return a}
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
 `;
 const top=node('div','ag-header'),heading=node('div');
 heading.append(node('h2','','Pengurusan Ejen'),node('p','','Permohonan, lead, pembeli terus dan komisen dalam dashboard admin.'));
 const controls=node('div','ag-controls');
 const refresh=node('button','','↻ Muat Semula');refresh.type='button';
 const link=node('a','ag-link ag-primary','Urus Komisen & Payout');link.href='/agent.html';link.target='_blank';link.rel='noopener noreferrer';
 controls.append(refresh,link);top.append(heading,controls);
 const msg=node('div','ag-status','Memuatkan rekod ejen...');msg.setAttribute('role','status');
 const counts=node('div','ag-counts'),content=node('div','ag-sections');
 host.append(style,top,msg,counts,content);
 function status(v,bad=false){if(disposed)return;msg.textContent=v;msg.className='ag-status'+(bad?' bad':'')}
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
   counts.replaceChildren(stat('Ejen aktif',agents.filter(x=>x.agent_status==='active').length),stat('Permohonan menunggu',applications.length),stat('Jumlah lead ejen',agentLeads.length),stat('Pembeli terus',directLeads.length),stat('Komisen belum dibayar',commissions.filter(c=>c.status!=='paid').length));
   content.replaceChildren();
   const pl=section(content,'Senarai Ejen ('+agents.length+')','Semua ejen berdaftar dan prestasi mereka. Tekan nama untuk butiran.');
   if(agentRes?.error)pl.append(node('p','','Gagal memuat senarai ejen: '+agentRes.error.message));
   else if(!agents.length)pl.append(node('p','','Belum ada ejen berdaftar.'));
   const label={active:'Aktif',suspended:'Digantung',inactive:'Tidak aktif'};
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
    d.append(sm,b);pl.append(d);
   }
   const pa=section(content,'Permohonan Ejen','Owner semak maklumat sebelum meluluskan permohonan.');
   if(!applications.length)pa.append(node('p','','Tiada permohonan menunggu.'));
   for(const a of applications){
    const n=line(pa,a.full_name||'Pemohon',[a.email,a.phone,a.state,date(a.applied_at)].filter(Boolean).join(' · '));
    const buttons=node('div','ag-controls'),yes=node('button','ag-primary','Luluskan'),no=node('button','','Tolak');
    yes.onclick=async()=>{if(!confirm('Luluskan permohonan '+(a.full_name||'ejen')+' selepas semakan?'))return;yes.disabled=true;no.disabled=true;try{await request('review',{application_id:a.id,decision:'approve'});status('Permohonan diluluskan.');}catch(e){status(e.message,true)}finally{yes.disabled=false;no.disabled=false;await load()}};
    no.onclick=async()=>{const reason=prompt('Sebab penolakan (wajib):');if(!reason?.trim())return;yes.disabled=true;no.disabled=true;try{await request('review',{application_id:a.id,decision:'reject',reason:reason.trim()});status('Permohonan ditolak.');}catch(e){status(e.message,true)}finally{yes.disabled=false;no.disabled=false;await load()}};
    buttons.append(yes,no);n.append(buttons);
   }
   const pb=section(content,'Lead daripada Ejen','Lead masuk melalui pautan promosi atau pendaftaran manual. Owner mengesahkan jualan sebelum komisen.');
   if(!agentLeads.length)pb.append(node('p','','Belum ada lead ejen.'));
   for(const a of agentLeads.slice(0,60))compactLead(pb,a,a.car,ownerRead,true);
   const pc=section(content,'Pertanyaan Pembeli Terus','Lead tanpa ejen, tidak layak untuk komisen ejen.');
   if(!directLeads.length)pc.append(node('p','','Belum ada pertanyaan terus.'));
   for(const a of directLeads.slice(0,60))compactLead(pc,a,carMap.get(a.vehicle_id),ownerRead,false);
   const po=section(content,'Komisen Ejen Setiap Kereta','Tetapkan amaun komisen untuk setiap kereta. Amaun ini terus dipaparkan kepada ejen di kad kereta dalam portal mereka. Dibayar hanya selepas jualan disahkan.');
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
   const pd=section(content,'Ringkasan Komisen & Payout','Bayaran kekal memerlukan kelulusan owner dan pengesahan HR yang berasingan.');
   if(!commissions.length&&!payouts.length)pd.append(node('p','','Belum ada komisen atau payout.'));
   for(const c of commissions.slice(0,20))line(pd,'Komisen '+amount(c.agreed_amount),['Status '+c.status,'Ejen '+c.agent_id,date(c.created_at)].join(' · '));
   for(const p of payouts.slice(0,20))line(pd,'Payout '+amount(p.amount),['Status '+p.status,'Ejen '+p.agent_id,date(p.created_at)].join(' · '));
   status('Data ejen dikemas kini.');
  }catch(e){status(e?.message||'Gagal memuat rekod ejen.',true)}
  finally{loading=false;refresh.disabled=false}
 }
 refresh.onclick=()=>load();
 void load();
 return()=>{disposed=true;host.replaceChildren()};
}
