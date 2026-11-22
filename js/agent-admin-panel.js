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
  if(error||!data?.session?.access_token)throw Error('Sesi admin tamat. Sila log masuk semula.');
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,...params})});
  const payload=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(payload.error||'Gagal memuat data ejen');
  return payload;
 }
 function stat(title,value){const a=node('div','ag-stat');a.append(node('small','',title),node('b','',value));return a}
 async function ownerRead(a,type){
  try{await request('owner_lead_mark_read',{lead_id:a.id,lead_type:type});status('Status dibaca disimpan.');await load()}
  catch(e){status(e.message,true)}
 }
 async function load(){
  if(loading||disposed)return;loading=true;refresh.disabled=true;status('Menyemak data ejen...');
  try{
   const [apps,leads,direct,fin,contacts,vehicleData]=await Promise.all([request('list'),request('lead_list'),request('direct_inquiry_list'),request('finance_list'),request('lead_contact_list'),request('commission_vehicle_list')]);
   if(disposed)return;
   const applications=apps.applications||[],agentLeads=contacts.leads||[],directLeads=direct.inquiries||[],commissions=fin.commissions||[],payouts=fin.payouts||[];
   const vehicles=vehicleData.vehicles||[],carMap=new Map(vehicles.map(v=>[v.id,v]));
   counts.replaceChildren(stat('Permohonan menunggu',applications.length),stat('Jumlah lead ejen',agentLeads.length),stat('Pembeli terus',directLeads.length),stat('Komisen belum dibayar',commissions.filter(c=>c.status!=='paid').length));
   content.replaceChildren();
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
   const po=section(content,'Kategori Komisen Ejen Mengikut Kereta','Kategori dan amaun cadangan. Bukan komisen diluluskan dan bukan arahan pembayaran.');
   const form=node('form','ag-config'),vLabel=node('label','','Kereta'),vSelect=node('select');vSelect.required=true;
   for(const v of vehicles){const o=node('option','',[v.make,v.model,v.model_year,v.vehicle_id].filter(Boolean).join(' '));o.value=v.id;vSelect.append(o)}
   vLabel.append(vSelect);
   const typeLabel=node('label','','Kategori'),type=node('select');
   for(const [value,label] of [['standard','Standard'],['premium','Premium'],['special','Khas']]){const o=node('option','',label);o.value=value;type.append(o)}
   typeLabel.append(type);
   const amtLabel=node('label','','Cadangan (RM)'),amt=node('input');amt.type='number';amt.min='0';amt.max='100000';amt.step='0.01';amt.required=true;amtLabel.append(amt);
   const save=node('button','ag-primary','Simpan');save.type='submit';
   const activeLabel=node('label','','Paparkan kepada ejen'),active=node('input');active.type='checkbox';activeLabel.append(active);
   function fill(){const offer=carMap.get(vSelect.value)?.offer;type.value=offer?.category||'standard';amt.value=offer?.indicative_amount??0;active.checked=offer?.active!==false}
   vSelect.onchange=fill;fill();
   form.append(vLabel,typeLabel,amtLabel,save,activeLabel);
   form.onsubmit=async(e)=>{e.preventDefault();if(!form.reportValidity())return;save.disabled=true;try{
      await request('commission_offer_set',{vehicle_id:vSelect.value,category:type.value,amount:Number(amt.value).toFixed(2),active:active.checked});
      status('Kategori komisen cadangan berjaya disimpan.');await load();
     }catch(err){status(err.message,true)}finally{save.disabled=false}};
   po.append(form);
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
