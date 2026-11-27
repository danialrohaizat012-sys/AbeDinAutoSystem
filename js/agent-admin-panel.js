// Native Agent Network panel; owner-only server authorization remains mandatory.
const API='https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/agent-portal-admin';
// Data terakhir disimpan dalam memori supaya buka semula tab Ejen terus papar (kemudian dikemas kini senyap).
let CACHE=null;
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
 const call=node('a','ag-link ag-c-blue','📞 Hubungi Telefon');call.href='tel:+'+phone;
 const wa=node('a','ag-link ag-c-green','💬 WhatsApp Pelanggan');wa.target='_blank';wa.rel='noopener noreferrer';
 wa.href='https://wa.me/'+phone+'?text='+encodeURIComponent(
  'Salam '+String(lead.customer_name||'')+', saya dari AbeDin Auto. Terima kasih kerana berminat dengan '+String(carLabel||'kereta kami')+'. Boleh kami bantu?');
 buttons.append(wa,call);row.append(buttons);
}
function congratsLink(name,phone,code){
 const p=phoneLink(phone);if(!p)return null;
 const msg=['Assalamualaikum & Tahniah '+(String(name||'').trim()||'')+'! 🎉','',
  'Permohonan anda telah DILULUSKAN. Anda kini *Ejen Rasmi AbeDin Auto*.',
  code?'Kod ejen anda: *'+code+'*':'',
  '','Log masuk Portal Ejen untuk dapatkan link promosi peribadi, katalog kereta dan semak komisen anda:',
  'https://abedinauto.my/agent.html','',
  'Selamat datang ke pasukan AbeDin Auto. Semoga murah rezeki! 🚗🤝'].filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n');
 return 'https://wa.me/'+p+'?text='+encodeURIComponent(msg);
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
 if(car?.vehicle_id){const link=node('a','ag-link ag-c-purple','🚗 Lihat Kereta');const url=new URL('/',location.origin);url.searchParams.set('car',car.vehicle_id);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';body.append(link)}
 contactControls(body,a,model);
 if(!a.owner_read_at){const btn=node('button','ag-c-teal','✓ Tandakan Sudah Baca');btn.type='button';btn.onclick=()=>onRead(a,agentLead?'agent':'direct');body.append(btn)}
 details.append(summary,body);parent.append(details);
}
function section(parent,title,desc,tab){const a=node('section','ag-card');if(tab)a.dataset.tab=tab;a.append(node('h3','',title),node('p','ag-desc',desc));parent.append(a);return a}
// Dipaparkan sekali sahaja; diletakkan pada body supaya tidak hilang apabila senarai dimuat semula.
function showTempPassword(g,r){
 document.getElementById('ada-temp-password')?.remove();
 const wrap=node('div');wrap.id='ada-temp-password';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
 wrap.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.65)';
 const box=node('div');box.style.cssText='width:100%;max-width:420px;max-height:90vh;overflow:auto;background:#fff;color:#16242e;border-radius:16px;padding:20px;font-size:14px;line-height:1.5';
 const title=node('h3','','Kata laluan sementara');title.style.cssText='margin:0 0 8px;color:#16242e';
 const info=node('p','',(g.name||'Ejen')+' · '+r.email);info.style.cssText='margin:0 0 12px;color:#465a69;overflow-wrap:anywhere';
 const code=node('div','',r.temporary_password);code.style.cssText='font:700 22px/1.4 ui-monospace,Menlo,monospace;text-align:center;padding:14px;border:1px dashed #8aa0b0;border-radius:10px;background:#f4f7f9;color:#16242e;user-select:all;overflow-wrap:anywhere';
 const note=node('p','','Salin atau hantar sekarang — ia tidak boleh dilihat semula selepas ditutup. Minta ejen terus tukar kata laluan dalam Portal Ejen.');note.style.cssText='margin:12px 0;color:#7a4b12';
 const row=node('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
 const css='flex:1 1 110px;padding:12px;border:0;border-radius:10px;font:700 14px inherit;font-family:inherit;text-align:center;text-decoration:none;cursor:pointer;';
 const copy=node('button','','Salin');copy.type='button';copy.style.cssText=css+'background:#1762a8;color:#fff';
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(r.temporary_password);copy.textContent='Disalin ✓'}catch{copy.textContent='Tekan lama untuk salin'}};
 row.append(copy);
 const phone=phoneLink(g.phone);
 if(phone){
  const wa=node('a','','WhatsApp Ejen');wa.target='_blank';wa.rel='noopener noreferrer';wa.style.cssText=css+'background:#146848;color:#fff';
  wa.href='https://wa.me/'+phone+'?text='+encodeURIComponent(['Salam '+String(g.name||'')+', ini maklumat log masuk Portal Ejen AbeDin Auto anda.',
   'E-mel: '+r.email,'Kata laluan sementara: '+r.temporary_password,'',
   'Log masuk di https://abedinauto.my/agent.html dan terus tukar kata laluan (Tukar kata laluan). Jangan kongsi dengan sesiapa.'].join('\n'));
  row.append(wa);
 }
 const close=node('button','','Tutup');close.type='button';close.style.cssText=css+'background:#e8eef3;color:#23445b';close.onclick=()=>wrap.remove();
 row.append(close);
 box.append(title,info,code,note,row);wrap.append(box);document.body.append(wrap);
}
export function mountAgentAdmin(host,{client,profile}={}){
 host.replaceChildren();
 if(profile?.role!=='owner'||profile?.enabled!==true){host.append(node('p','muted','Hanya owner aktif boleh mengurus ejen.'));return}
 let loading=false,disposed=false,justApproved=null;
 host.className='ada-agent-owner';
 const style=node('style');style.textContent='.ada-agent-owner .ag-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:15px}.ada-agent-owner h2{margin:0;font-size:24px}.ada-agent-owner h3{margin:0 0 7px;font-size:17px}.ada-agent-owner p{margin:5px 0 12px;color:#66788b;font-size:13px;line-height:1.5}.ada-agent-owner .ag-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.ada-agent-owner .ag-stat,.ada-agent-owner .ag-card{padding:16px;background:var(--card-bg,#fff);border:1px solid #d9e3ec;border-radius:14px}.ada-agent-owner .ag-stat b{display:block;font-size:25px}.ada-agent-owner .ag-stat small{color:#597188;font-size:12px}.ada-agent-owner .ag-sections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ada-agent-owner .ag-line{padding:12px 0;border-bottom:1px solid #e5eaf0;overflow-wrap:anywhere}.ada-agent-owner .ag-line:last-child{border:0}.ada-agent-owner .ag-line strong{display:block;font-size:14px}.ada-agent-owner .ag-line small{display:block;color:#687d90;font-size:12px;margin-top:4px}.ada-agent-owner .ag-controls{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.ada-agent-owner button,.ada-agent-owner .ag-link{padding:10px 13px;border-radius:9px;border:0;background:#e8eff7;color:#194e81;font:inherit;font-size:13px;font-weight:750;text-decoration:none;cursor:pointer}.ada-agent-owner .ag-primary{background:#1762a8!important;color:#fff!important}.ada-agent-owner .ag-whatsapp{background:#116d4a!important;color:white!important}.ada-agent-owner .ag-mini{border:1px solid #dce4ed;border-radius:10px;margin:7px 0;background:#fff}.ada-agent-owner .ag-mini-head{list-style:none;cursor:pointer;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}.ada-agent-owner .ag-mini-head::-webkit-details-marker{display:none}.ada-agent-owner .ag-mini-title{display:grid;gap:4px;min-width:0}.ada-agent-owner .ag-mini-title small{font-size:12px;color:#63778a}.ada-agent-owner .ag-mini-body{padding:12px;border-top:1px solid #e3e9ef}.ada-agent-owner .ag-read,.ada-agent-owner .ag-unread{white-space:nowrap;padding:5px 8px;border-radius:20px;font-size:11px}.ada-agent-owner .ag-read{background:#dcf0e3;color:#16603c}.ada-agent-owner .ag-unread{background:#fff0d6;color:#855b1b}.ada-agent-owner .ag-bank{font-weight:700;color:#4ade80}.ada-agent-owner .ag-bank.none{color:#fbbf24}.ada-agent-owner .ag-manual{margin:0 0 14px}.ada-agent-owner .ag-manual-form{margin-top:10px;padding:14px;border:1px dashed rgba(245,158,11,.55);border-radius:14px;background:rgba(245,158,11,.06);display:flex;flex-direction:column;gap:10px}.ada-agent-owner .ag-mf{display:flex;flex-direction:column;gap:5px;font-weight:700;font-size:13px}.ada-agent-owner .ag-mf select,.ada-agent-owner .ag-mf input,.ada-agent-owner .ag-mf textarea{width:100%;font-weight:400}.ada-agent-owner .ag-mf-sale{display:flex;flex-direction:column;gap:6px}.ada-agent-owner .ag-mf-chk{display:flex;gap:8px;align-items:center;font-size:13px}.ada-agent-owner .ag-config{display:grid;grid-template-columns:1.5fr 1fr 1fr auto;gap:8px;align-items:end}.ada-agent-owner .ag-config label{display:grid;gap:5px;font-size:12px}.ada-agent-owner .ag-config select,.ada-agent-owner .ag-config input{border:1px solid #cdd9e4;border-radius:9px;padding:10px;max-width:100%;min-width:0}.ada-agent-owner .ag-config input[type=checkbox]{width:auto}@media(max-width:650px){.ada-agent-owner .ag-config{grid-template-columns:1fr 1fr}.ada-agent-owner .ag-config label:first-child{grid-column:1/-1}}.ada-agent-owner .ag-status{border-radius:9px;background:#eaf3fc;color:#1c527d;padding:11px;font-size:13px}.ada-agent-owner .ag-status.bad{background:#ffefe9;color:#8a422b}@media(max-width:850px){.ada-agent-owner .ag-sections{grid-template-columns:1fr}.ada-agent-owner .ag-counts{grid-template-columns:repeat(2,minmax(0,1fr))}}';
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
 .ada-agent-owner button:not(.ag-primary):not([class*=ag-c-]):not(.ag-tab):not(.ag-chip),.ada-agent-owner .ag-link:not(.ag-primary):not(.ag-whatsapp):not([class*=ag-c-]){
   background:var(--ag-soft)!important;color:var(--ag-soft-ink)!important;
   -webkit-text-fill-color:var(--ag-soft-ink)!important;border:1px solid var(--ag-border)!important;
 }
 .ada-agent-owner .ag-primary{
   background:var(--ag-accent)!important;color:var(--ag-accent-ink)!important;
   -webkit-text-fill-color:var(--ag-accent-ink)!important;border:1px solid transparent!important
 }
 .ada-agent-owner .ag-whatsapp{background:#146848!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
 .ada-agent-owner .ag-congrats{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 18px;margin:0 0 16px;border-radius:16px;background:linear-gradient(135deg,#e9fbf1,#fff7e0);border:1px solid #b9e8cc;box-shadow:0 6px 18px rgba(20,104,72,.12)}
 .ada-agent-owner .ag-congrats-ic{font-size:34px;line-height:1}
 .ada-agent-owner .ag-congrats-tx{flex:1 1 220px;display:flex;flex-direction:column;gap:3px}.ada-agent-owner .ag-congrats-tx strong{font-size:16px;color:#0f5132}.ada-agent-owner .ag-congrats-tx small{color:#3d5a4a}
 .ada-agent-owner .ag-congrats-bt{display:flex;gap:8px;flex-wrap:wrap}.ada-agent-owner .ag-congrats-wa{font-weight:700;padding:11px 16px!important;border-radius:12px!important}
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
 .ada-agent-owner .ag-com-st.loss{color:#f08a72!important;font-weight:600}
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
 .ada-agent-owner .ag-muted-note{display:block;color:var(--ag-muted);font-size:12px;margin-top:4px}
 .ada-agent-owner .ag-lb{display:grid;gap:4px}
 .ada-agent-owner .ag-lb-row{display:grid;grid-template-columns:34px minmax(0,1fr) repeat(4,52px);align-items:center;gap:6px;padding:8px 10px;border-radius:10px;background:var(--ag-raised);border:1px solid var(--ag-border)}
 .ada-agent-owner .ag-lb-head{background:transparent;border:0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ag-muted);padding:2px 10px}
 .ada-agent-owner .ag-lb-row.top{border-color:var(--ag-accent)}
 .ada-agent-owner .ag-lb-row.idle{opacity:.55}
 .ada-agent-owner .ag-lb-rk{font-weight:800;text-align:center;font-size:16px}
 .ada-agent-owner .ag-lb-name strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ada-agent-owner .ag-lb-name small{color:var(--ag-muted);font-size:11px}
 .ada-agent-owner .ag-lb-n{text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
 @media(max-width:500px){.ada-agent-owner .ag-lb-row{grid-template-columns:28px minmax(0,1fr) repeat(4,40px);font-size:13px}}
 .ada-agent-owner .ag-ai-new{outline:2px solid var(--ag-accent)}
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
 /* ---- Warna-warni butang ---- */
 .ada-agent-owner [class*=ag-c-]{color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid transparent!important;font-weight:700!important;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:filter .15s,transform .1s}
 .ada-agent-owner [class*=ag-c-]:hover{filter:brightness(1.08)}.ada-agent-owner [class*=ag-c-]:active{transform:scale(.97)}
 .ada-agent-owner [class*=ag-c-]:disabled{opacity:.55;filter:grayscale(.3)}
 .ada-agent-owner .ag-c-gold{background:linear-gradient(135deg,#f0cf74,#d6a93c)!important;color:#1d1a10!important;-webkit-text-fill-color:#1d1a10!important}
 .ada-agent-owner .ag-c-green{background:linear-gradient(135deg,#27b36f,#168a52)!important}
 .ada-agent-owner .ag-c-blue{background:linear-gradient(135deg,#3b8cf0,#2166c9)!important}
 .ada-agent-owner .ag-c-orange{background:linear-gradient(135deg,#f59e3c,#de7517)!important}
 .ada-agent-owner .ag-c-red{background:linear-gradient(135deg,#ec5b5b,#c73636)!important}
 .ada-agent-owner .ag-c-purple{background:linear-gradient(135deg,#9d6cf7,#7442e0)!important}
 .ada-agent-owner .ag-c-teal{background:linear-gradient(135deg,#1fb8b0,#128a85)!important}
 .ada-agent-owner .ag-c-gray{background:#4a565c!important}
 html.ada-light .ada-agent-owner .ag-c-gray{background:#7b8a93!important}
 /* ---- Tab berwarna ---- */
 .ada-agent-owner button.ag-tab{--tc:var(--ag-accent)}
 .ada-agent-owner button.ag-tab[data-t=ejen]{--tc:#d6a93c}.ada-agent-owner button.ag-tab[data-t=komisen]{--tc:#1f9d63}
 .ada-agent-owner button.ag-tab[data-t=kelulusan]{--tc:#2f7de1}.ada-agent-owner button.ag-tab[data-t=lead]{--tc:#e8892b}
 .ada-agent-owner button.ag-tab[data-t=promosi]{--tc:#8b5cf6}
 .ada-agent-owner button.ag-tab:not(.on):hover{background:color-mix(in srgb,var(--tc) 14%,transparent)!important}
 .ada-agent-owner button.ag-tab.on{background:var(--tc)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 3px 10px color-mix(in srgb,var(--tc) 45%,transparent)!important}
 .ada-agent-owner button.ag-tab.on .ag-badge{background:#fff;color:#1d1a10;-webkit-text-fill-color:#1d1a10}
 .ada-agent-owner .ag-tab-ic{font-size:15px}
 /* ---- Kad statistik ---- */
 .ada-agent-owner .ag-stat{position:relative;overflow:hidden;display:flex;align-items:center;gap:12px}
 .ada-agent-owner .ag-stat::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--sc)}
 .ada-agent-owner .ag-stat-ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-size:19px;background:color-mix(in srgb,var(--sc) 20%,transparent);flex:none}
 .ada-agent-owner .ag-stat b{color:var(--sc)!important}
 /* ---- Ranking ringkas ---- */
 .ada-agent-owner .ag-lb-row{padding:6px 10px!important;min-height:0}
 .ada-agent-owner .ag-lb-row.top{background:color-mix(in srgb,var(--ag-accent) 9%,var(--ag-raised))}
 .ada-agent-owner .ag-lb-row[hidden]{display:none!important}
 .ada-agent-owner .ag-lb-name strong{font-size:13.5px}
 .ada-agent-owner .ag-more{margin-top:8px;width:100%}
 /* ---- Senarai ejen grid ---- */
 .ada-agent-owner .ag-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}
 .ada-agent-owner .ag-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px}
 .ada-agent-owner .ag-toolbar input{flex:1 1 200px;min-height:38px;border-radius:9px;padding:0 12px;background:var(--ag-field);color:var(--ag-field-ink);border:1px solid var(--ag-field-border)}
 .ada-agent-owner button.ag-chip{padding:7px 12px!important;border-radius:999px!important;font-size:12.5px;font-weight:700;background:var(--ag-raised)!important;color:var(--ag-muted)!important;-webkit-text-fill-color:var(--ag-muted)!important;border:1px solid var(--ag-border)!important}
 .ada-agent-owner button.ag-chip.on{background:var(--cc,#d6a93c)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:transparent!important}
 .ada-agent-owner .ag-agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:8px;align-items:start}
 .ada-agent-owner .ag-agent-grid .ag-mini{margin:0!important}
 .ada-agent-owner .ag-agent-grid .ag-mini[open]{grid-column:1/-1}
 .ada-agent-owner .ag-agent-grid .ag-mini[hidden]{display:none!important}
 .ada-agent-owner .ag-av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;flex:none}
 .ada-agent-owner .ag-who{display:flex;align-items:center;gap:10px;min-width:0}
 .ada-agent-owner .ag-who .ag-mini-title strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px}
 .ada-agent-owner .ag-who .ag-mini-title small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .ada-agent-owner .ag-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin:0 0 10px}
 .ada-agent-owner .ag-kpi{padding:8px 10px;border-radius:9px;background:var(--ag-raised);border:1px solid var(--ag-border)}
 .ada-agent-owner .ag-kpi small{display:block;font-size:11px;color:var(--ag-muted)}.ada-agent-owner .ag-kpi b{font-size:15px}
 .ada-agent-owner form[hidden]{display:none!important}
 .ada-agent-owner .ag-empty-q{grid-column:1/-1;text-align:center;padding:14px}
 `;
 const top=node('div','ag-header'),heading=node('div');
 heading.append(node('h2','','Ejen'),node('p','ag-sub','Urus ejen, komisen, promosi dan kelulusan.'));
 const controls=node('div','ag-controls');
 const refresh=node('button','ag-icon ag-c-gold','↻');refresh.title='Muat semula';refresh.setAttribute('aria-label','Muat semula');refresh.type='button';
 controls.append(refresh);top.append(heading,controls);
 const msg=node('div','ag-status','Memuatkan rekod ejen...');msg.setAttribute('role','status');
 const counts=node('div','ag-counts'),tabsBar=node('nav','ag-tabs'),content=node('div','ag-sections');
 tabsBar.setAttribute('role','tablist');
 let activeTab=(()=>{try{return localStorage.getItem('ada-agent-tab')||'ejen'}catch{return 'ejen'}})();
 const TABS=[['ejen','Ejen','👥'],['komisen','Komisen','💰'],['kelulusan','Kelulusan','✅'],['lead','Lead','📞'],['promosi','Promosi','📣']];
 function tabify(badges={}){
  tabsBar.replaceChildren();
  for(const [id,label,ic] of TABS){
   const b=node('button','ag-tab'+(id===activeTab?' on':''));b.type='button';b.dataset.t=id;b.append(node('span','ag-tab-ic',ic),document.createTextNode(label));b.setAttribute('role','tab');b.setAttribute('aria-selected',String(id===activeTab));
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
 function stat(title,value,ic,color){const a=node('div','ag-stat');a.style.setProperty('--sc',color);const t=node('div');t.append(node('small','',title),node('b','',value));a.append(node('div','ag-stat-ic',ic),t);return a}
 async function ownerRead(a,type){
  try{await request('owner_lead_mark_read',{lead_id:a.id,lead_type:type});status('Status dibaca disimpan.');await load()}
  catch(e){status(e.message,true)}
 }
 // Semua data diambil SERENTAK (dulu ada 4 langkah menunggu satu demi satu).
 async function fetchAll(){
  const bundleP=request('bundle').catch(async e=>{
   if(!/unknown action/i.test(String(e?.message)))throw e;
   const acts=['list','lead_list','direct_inquiry_list','finance_list','lead_contact_list','commission_vehicle_list'];
   const r=await Promise.all(acts.map(a=>request(a)));return Object.fromEntries(acts.map((a,i)=>[a,r[i]]));
  });
  const [b,agentRes,lb,pr,cv,ci,cd]=await Promise.all([bundleP,client.rpc('owner_agent_list_v1'),client.rpc('owner_agent_leaderboard_v1'),
   client.from('agent_promo_copy_v20').select('slot,draft,published').order('slot'),
   client.from('vehicles').select('id,purchase_cost,cost_transfer,cost_puspakom,cost_transport,cost_agent_commission,asking_price,promo_price'),
   client.from('checklist_inspections').select('vehicle_id,kos,created_at').order('created_at',{ascending:true}),
   client.rpc('owner_lead_sale_candidates_v1')]);
  return {apps:b.list,leads:b.lead_list,direct:b.direct_inquiry_list,fin:b.finance_list,contacts:b.lead_contact_list,vehicleData:b.commission_vehicle_list,
   agentRes:{data:agentRes.data,error:agentRes.error},lbRaw:lb.data,promos:pr.data,promoErr:pr.error,cv:cv.data,ci:ci.data,candRaw:cd.data};
 }
 let rendered=false;
 async function load(){
  if(loading||disposed)return;loading=true;refresh.disabled=true;
  try{
   if(CACHE&&!rendered){rendered=true;render(CACHE);status('Mengemas kini data…')}else status('Menyemak data ejen...');
   const D=await fetchAll();if(disposed)return;CACHE=D;rendered=true;render(D);status('Dikemas kini.');
  }catch(e){status(e?.message||'Gagal memuat rekod ejen.',true)}
  finally{loading=false;refresh.disabled=false}
 }
 function render(D){
  {
   const {apps,leads,direct,fin,contacts,vehicleData,agentRes}=D;
   const agents=Array.isArray(agentRes?.data)?agentRes.data:[];
   if(disposed)return;
   const applications=apps.applications||[],agentLeads=contacts.leads||[],directLeads=direct.inquiries||[],commissions=fin.commissions||[],payouts=fin.payouts||[];
   const vehicles=vehicleData.vehicles||[],carMap=new Map(vehicles.map(v=>[v.id,v]));
   counts.replaceChildren(stat('Ejen aktif',agents.filter(x=>x.agent_status==='active').length,'👥','#d6a93c'),stat('Lead',agentLeads.length+directLeads.length,'📞','#e8892b'),stat('Komisen belum bayar',commissions.filter(c=>c.status!=='paid').length,'💰','#1f9d63'));
   content.replaceChildren();
   const lbRaw=D.lbRaw;const lb=Array.isArray(lbRaw)?lbRaw:[];
   const plb=section(content,'🏆 Prestasi Bulan Ini','Kedudukan ikut jualan, kemudian lead, kemudian klik. Kadar = lead ÷ klik.','ejen');
   if(!lb.length)plb.append(node('p','','Tiada ejen aktif.'));
   const tbl=node('div','ag-lb');
   const head=node('div','ag-lb-row ag-lb-head');for(const h of ['#','Ejen','Klik','Lead','Jual','Kadar'])head.append(node('span','',h));tbl.append(head);
   for(const x of lb){const r=node('div','ag-lb-row'+(x.rank<=3&&(x.sales||x.leads||x.clicks)?' top':''));
    const medal=({1:'🥇',2:'🥈',3:'🥉'})[x.rank];
    r.append(node('span','ag-lb-rk',(x.sales||x.leads||x.clicks)&&medal?medal:String(x.rank)));
    const nm=node('span','ag-lb-name');nm.append(node('strong','',x.name||'Ejen'),node('small','',x.code||''));r.append(nm);
    for(const v of [x.clicks,x.leads,x.sales])r.append(node('span','ag-lb-n',String(v)));
    r.append(node('span','ag-lb-n',(x.conversion||0)+'%'));
    if(!x.clicks&&!x.leads&&!x.sales)r.classList.add('idle');
    tbl.append(r)}
   plb.append(tbl);
   const lbRows=[...tbl.querySelectorAll('.ag-lb-row:not(.ag-lb-head)')],LB_TOP=5;
   const idle=lb.filter(x=>!x.clicks&&!x.leads&&!x.sales).length;
   if(lbRows.length>LB_TOP){
    let open=false;const more=node('button','ag-more ag-c-gray');more.type='button';
    const paint=()=>{lbRows.forEach((r,i)=>r.hidden=!open&&i>=LB_TOP);more.textContent=open?'▲ Tutup senarai':'▼ Tunjuk semua '+lbRows.length+' ejen'+(idle?' ('+idle+' belum aktif bulan ini)':'')};
    more.onclick=()=>{open=!open;paint()};paint();plb.append(more);
   }else if(idle)plb.append(node('small','ag-muted-note',idle+' ejen belum aktif bulan ini (tiada klik).'));
   const pl=section(content,'Senarai Ejen ('+agents.length+')','Semua ejen berdaftar dan prestasi mereka. Tekan nama untuk butiran.','ejen');
   if(agentRes?.error)pl.append(node('p','','Gagal memuat senarai ejen: '+agentRes.error.message));
   else if(!agents.length)pl.append(node('p','','Belum ada ejen berdaftar.'));
   const label={active:'Aktif',suspended:'Tidak aktif',terminated:'Ditamatkan'};
   const AV=['#d6a93c','#2f7de1','#1f9d63','#8b5cf6','#e8892b','#14a3a3','#db4f9a','#d64545'];
   const tools=node('div','ag-toolbar'),q=node('input');q.type='search';q.placeholder='🔍 Cari nama, kod atau telefon…';tools.append(q);
   let fSt='all';const nAct=agents.filter(x=>x.agent_status==='active').length;
   const chips=[['all','Semua ('+agents.length+')','#d6a93c'],['active','Aktif ('+nAct+')','#1f9d63'],['off','Tidak aktif ('+(agents.length-nAct)+')','#e8892b']].map(([k,lab,c])=>{const b=node('button','ag-chip'+(k===fSt?' on':''),lab);b.type='button';b.style.setProperty('--cc',c);b.dataset.k=k;tools.append(b);return b});
   const grid=node('div','ag-agent-grid'),noHit=node('p','ag-empty-q','Tiada ejen sepadan.');noHit.hidden=true;
   if(agents.length)pl.append(tools,grid);
   const applyF=()=>{const s=q.value.trim().toLowerCase();let shown=0;for(const d of grid.querySelectorAll('.ag-mini')){const ok=(!s||d.dataset.q.includes(s))&&(fSt==='all'||(fSt==='active')===(d.dataset.st==='active'));d.hidden=!ok;if(ok)shown++}noHit.hidden=shown>0;chips.forEach(c=>c.classList.toggle('on',c.dataset.k===fSt))};
   q.oninput=applyF;chips.forEach(c=>c.onclick=()=>{fSt=c.dataset.k;applyF()});
   for(const g of agents){
    const d=node('details','ag-mini'),sm=node('summary','ag-mini-head'),t=node('div','ag-mini-title');
    d.dataset.q=[g.name,g.email,g.agent_code,g.phone,g.city,g.state].filter(Boolean).join(' ').toLowerCase();d.dataset.st=g.agent_status==='active'?'active':'off';
    t.append(node('strong','',g.name||g.email||'Ejen'),node('small','',[g.agent_code||'Tiada kod',g.phone,[g.city,g.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')));
    const act=g.agent_status==='active',st=act?'Aktif':g.application_status==='pending'?'Menunggu kelulusan':(label[g.agent_status]||g.application_status||g.agent_status);
    const nm=String(g.name||g.email||'E').trim(),av=node('div','ag-av',(nm[0]||'E').toUpperCase());av.style.background=AV[[...nm].reduce((h,c)=>h+c.charCodeAt(0),0)%AV.length];
    const who=node('div','ag-who');who.append(av,t);
    sm.append(who,node('span',act?'ag-read':'ag-unread',st));
    const b=node('div','ag-mini-body');
    const kp=node('div','ag-kpis');for(const [k,v] of [['Klik (30 hari)',g.clicks+' ('+g.clicks_30d+')'],['Lead',g.leads],['Komisen',g.commissions+' · '+amount(g.commission_total)],['Dibayar',amount(g.paid_total)]]){const c=node('div','ag-kpi');c.append(node('small','',k),node('b','',v));kp.append(c)}
    b.append(kp);
    b.append(node('p','','E-mel: '+(g.email||'—')+' · Mohon: '+date(g.applied_at)+' · Aktif sejak: '+date(g.activated_at)));
    b.append(node('p',g.bank_account_no?'ag-bank':'ag-bank none',g.bank_account_no?'🏦 '+(g.bank_name||'Bank')+' · '+g.bank_account_no+(g.bank_account_holder?' · '+g.bank_account_holder:''):'🏦 Akaun bank belum diisi oleh ejen (Portal Ejen → Profil)'));
    contactControls(b,{customer_phone:g.phone,customer_name:g.name},null);
    const wa=b.querySelector('a.ag-c-green');if(wa){wa.textContent='💬 WhatsApp Ejen';wa.href=wa.href.split('?')[0];}
    if(g.user_id){
     const ctl=node('div','ag-controls ag-agent-actions');
     const ed=node('button','ag-c-blue','✏️ Edit');ed.type='button';
     const form=node('form','ag-config ag-agent-edit');form.hidden=true;
     const fld=(lab,val,type='text')=>{const l=node('label','',lab),i=node('input');i.type=type;i.value=val||'';l.append(i);form.append(l);return i};
     const fN=fld('Nama',g.name),fP=fld('Telefon',g.phone,'tel'),fS=fld('Negeri',g.state),fC=fld('Bandar',g.city);
     const sv=node('button','ag-c-green','💾 Simpan');sv.type='submit';const cn=node('button','ag-c-gray','Batal');cn.type='button';form.append(sv,cn);
     ed.onclick=()=>{form.hidden=!form.hidden};cn.onclick=()=>{form.hidden=true};
     form.onsubmit=async e=>{e.preventDefault();sv.disabled=true;try{const {error}=await client.rpc('owner_agent_update_v1',{p_user_id:g.user_id,p_name:fN.value,p_phone:fP.value,p_state:fS.value,p_city:fC.value});if(error)throw error;status('Butiran ejen dikemas kini.');await load()}catch(err){status(err.message.includes('phone_check')?'Nombor telefon tidak sah (9–24 aksara).':err.message,true)}finally{sv.disabled=false}};
     ctl.append(ed);
     const unlock=node('button','ag-c-orange','Buka Kunci Profil');unlock.type='button';
     unlock.onclick=async()=>{
      if(!confirm('Benarkan '+(g.name||'ejen')+' mengisi semula profil sekali lagi? Profil akan dikunci selepas simpan.'))return;
      unlock.disabled=true;
      try{const {data,error}=await client.rpc('owner_unlock_agent_account_v1',{p_user_id:g.user_id});if(error)throw error;if(!data)throw Error('Ejen belum menyimpan profil.');status('Profil dibuka semula. Minta ejen muat semula Portal Ejen.');}
      catch(err){status(err.message,true)}finally{unlock.disabled=false}
     };
     ctl.append(unlock);
     if(g.agent_status==='active'){
      const temp=node('button','ag-c-teal','🔑 Set Kata Laluan Sementara');temp.type='button';
      temp.onclick=async()=>{
       if(!confirm('Tetapkan kata laluan sementara untuk '+(g.name||'ejen')+(g.email?' ('+g.email+')':'')+'?\n\nPastikan yang meminta memang ejen ini (hubungi nombor berdaftar). Kata laluan lama akan terus terbatal.'))return;
       temp.disabled=true;
       try{const r=await request('set_temp_password',{agent_user_id:g.user_id});showTempPassword(g,r);status('Kata laluan sementara ditetapkan.')}
       catch(err){status(err.message||'Gagal menetapkan kata laluan sementara.',true);alert(err.message||'Gagal menetapkan kata laluan sementara.')}
       finally{temp.disabled=false}
      };
      ctl.append(temp);
     }
     // E-mel: ejen tetapkan sendiri kata laluan melalui pautan pemulihan Supabase.
     if(g.agent_status==='active'&&g.email){
      const recovery=node('button','ag-c-purple','Reset Password Ejen');recovery.type='button';
      recovery.title='Hantar pautan reset kata laluan ke e-mel ejen';
      recovery.onclick=async()=>{
       const email=String(g.email).trim();
       if(!email||!confirm('Hantar pautan reset kata laluan kepada '+(g.name||'ejen')+' melalui '+email+'? Ejen akan menetapkan kata laluan sendiri.'))return;
       recovery.disabled=true;
       try{
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:'https://abedinauto.my/agent.html'});
        if(error)throw error;
        status('Permintaan reset dihantar. Minta ejen semak e-mel dan folder Spam.');
       }catch(err){status(err?.message||'Gagal meminta reset kata laluan.',true)}
       finally{recovery.disabled=false}
      };
      ctl.append(recovery);
     }
     if(g.agent_status==='active'){const href=congratsLink(g.name,g.phone,g.agent_code);if(href){const tw=node('a','ag-link ag-c-green','🎉 WhatsApp Tahniah');tw.href=href;tw.target='_blank';tw.rel='noopener noreferrer';ctl.append(tw);}}
     if(g.agent_profile_id){
      const isAct=g.agent_status==='active';
      const tg=node('button',isAct?'ag-c-orange':'ag-c-green',isAct?'⏸ Nyahaktif':'▶ Aktifkan');tg.type='button';
      tg.onclick=async()=>{if(!confirm((isAct?'Nyahaktifkan':'Aktifkan semula')+' ejen '+(g.name||'')+'?'+(isAct?'\nEjen tidak boleh guna portal dan link promosi sehingga diaktifkan semula.':'')))return;tg.disabled=true;
       try{const {error}=await client.rpc('owner_agent_set_status_v1',{p_user_id:g.user_id,p_status:isAct?'suspended':'active'});if(error)throw error;status('Status ejen dikemas kini.');await load()}catch(err){status(err.message,true);tg.disabled=false}};
      ctl.append(tg);
     }
     const del=node('button','ag-c-red','🗑 Padam');del.type='button';
     del.onclick=async()=>{if(!confirm('Padam ejen '+(g.name||'')+'?\nProfil ejen, permohonan dan link promosi akan dibuang. Akaun log masuk (dan akaun staff, jika ada) tidak terjejas.'))return;del.disabled=true;
      try{const {error}=await client.rpc('owner_agent_delete_v1',{p_user_id:g.user_id});if(error)throw error;status('Ejen dipadam.');await load()}catch(err){status(err.message,true);del.disabled=false}};
     ctl.append(del);b.append(ctl,form);
    }
    d.append(sm,b);grid.append(d);
   }
   grid.append(noHit);
   const pa=section(content,'Permohonan Ejen','Owner semak maklumat sebelum meluluskan permohonan.','ejen');
   if(!applications.length)pa.remove();
   for(const a of applications){
    const n=line(pa,a.full_name||'Pemohon',[a.email,a.phone,a.state,date(a.applied_at)].filter(Boolean).join(' · '));
    const buttons=node('div','ag-controls'),yes=node('button','ag-c-green','✅ Luluskan'),no=node('button','ag-c-red','✖ Tolak');
    yes.onclick=async()=>{if(!confirm('Luluskan permohonan '+(a.full_name||'ejen')+' selepas semakan?'))return;yes.disabled=true;no.disabled=true;try{await request('review',{application_id:a.id,decision:'approve'});justApproved={email:String(a.email||'').toLowerCase(),name:a.full_name,phone:a.phone};status('Permohonan diluluskan. Tekan butang WhatsApp untuk hantar ucapan tahniah.');}catch(e){status(e.message,true)}finally{yes.disabled=false;no.disabled=false;await load()}};
    no.onclick=async()=>{const reason=prompt('Sebab penolakan (wajib):');if(!reason?.trim())return;yes.disabled=true;no.disabled=true;try{await request('review',{application_id:a.id,decision:'reject',reason:reason.trim()});status('Permohonan ditolak.');}catch(e){status(e.message,true)}finally{yes.disabled=false;no.disabled=false;await load()}};
    buttons.append(yes,no);n.append(buttons);
   }
   if(applications.length)content.prepend(pa);
   if(justApproved){
    const ja=justApproved,g=agents.find(x=>String(x.email||'').toLowerCase()===ja.email)||{};
    const nm=g.name||ja.name||'Ejen',href=congratsLink(nm,g.phone||ja.phone,g.agent_code);
    const box=node('div','ag-congrats');
    box.append(node('div','ag-congrats-ic','🎉'));
    const tx=node('div','ag-congrats-tx');tx.append(node('strong','',nm+' kini Ejen Rasmi AbeDin Auto'),node('small','',href?'Hantar ucapan tahniah terus ke WhatsApp ejen'+(g.agent_code?' (kod '+g.agent_code+')':'')+'.':'Nombor telefon ejen tidak sah — kemas kini telefon dahulu untuk hantar WhatsApp.'));
    box.append(tx);
    const bt=node('div','ag-congrats-bt');
    if(href){const wa=node('a','ag-link ag-c-green ag-congrats-wa','💬 Hantar Tahniah WhatsApp');wa.href=href;wa.target='_blank';wa.rel='noopener noreferrer';wa.onclick=()=>{setTimeout(()=>{justApproved=null;box.remove()},400)};bt.append(wa);}
    const x=node('button','ag-c-gray','Tutup');x.type='button';x.onclick=()=>{justApproved=null;box.remove()};bt.append(x);
    box.append(bt);content.prepend(box);
   }
   const pp=section(content,'Ayat Promosi Ejen (5 Pilihan)','Jana dengan AI atau tulis sendiri, kemudian terbitkan. Ejen juga boleh jana ayat AI sendiri untuk setiap kereta. Guna {model}, {tahun}, {harga}.','promosi');
   const aiBtn=node('button','ag-c-teal','📋 Salin Prompt AI (5 Ayat)');aiBtn.type='button';
   aiBtn.onclick=async()=>{const t='Jana tepat 5 ayat promosi kereta terpakai AbeDin Auto dalam Bahasa Melayu. Setiap ayat maksimum 500 aksara dan wajib mengandungi {model}, {tahun}, {harga}. Gaya berlainan, menarik dan profesional. Jangan mereka-reka diskaun, kelulusan pinjaman, jaminan, keadaan kereta atau stok. Nomborkan 1 hingga 5.';try{await navigator.clipboard.writeText(t);status('Prompt AI disalin. Tampal dalam ChatGPT/Claude.')}catch{prompt('Salin prompt ini:',t)}};
   const genBtn=node('button','ag-c-purple','✨ Jana 5 ayat baru dengan AI');genBtn.type='button';
   const promoAreas=[];
   genBtn.onclick=async()=>{genBtn.disabled=true;const old=genBtn.textContent;genBtn.textContent='AI sedang menulis…';
    try{const {data:ss}=await client.auth.getSession();const r=await fetch('https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/agent-promo-ai',{method:'POST',headers:{'content-type':'application/json',apikey:'sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0',authorization:'Bearer '+(ss?.session?.access_token||'')},body:JSON.stringify({mode:'owner5'})});
     const j=await r.json().catch(()=>({}));if(!r.ok||!Array.isArray(j.ayat))throw Error(j.error||'AI gagal menjana ayat.');
     j.ayat.forEach((t,i)=>{const a=promoAreas[i];if(a){a.value=t;a.dispatchEvent(new Event('input'));a.classList.add('ag-ai-new')}});
     status('5 ayat baru dijana. Semak, kemudian tekan "Terbitkan kepada ejen" pada ayat yang anda mahu.')}
    catch(e){status(e.message,true)}finally{genBtn.disabled=false;genBtn.textContent=old}};
   const genRow=node('div','ag-controls');genRow.append(genBtn,aiBtn);pp.append(genRow);
   const promos=D.promos,promoErr=D.promoErr;
   if(promoErr)pp.append(node('p','','Gagal memuat ayat promosi: '+promoErr.message));
   for(const entry of promos||[]){
    const box=node('div','ag-promo-slot');
    const head=node('div','ag-promo-head');head.append(node('strong','','Pilihan '+entry.slot));
    const live=entry.published&&entry.published===entry.draft;
    head.append(node('span',entry.published?(live?'ag-read':'ag-unread'):'ag-unread',entry.published?(live?'Diterbitkan':'Ada perubahan belum diterbit'):'Belum diterbitkan'));
    const area=node('textarea');area.value=entry.draft||'';area.maxLength=500;area.rows=3;promoAreas.push(area);
    const cnt=node('small','ag-promo-count',(area.value.length)+'/500');area.oninput=()=>{cnt.textContent=area.value.length+'/500'};
    const btns=node('div','ag-controls');
    for(const publish of [false,true]){
     const b=node('button',publish?'ag-c-green':'ag-c-blue',publish?'🚀 Terbitkan kepada ejen':'💾 Simpan draf');b.type='button';
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
   const po=section(content,'Komisen Ejen Setiap Kereta','Amaun dipaparkan kepada ejen. Bila komisen diluluskan, ia automatik ditolak sebagai kos kereta dalam Jejak Kewangan & laporan untung.','komisen');
   const costMap=new Map();
   try{const cv={data:D.cv},ci={data:D.ci};
    const rep=new Map();for(const r of ci.data||[])rep.set(r.vehicle_id,Number(r.kos||0));
    for(const v of cv.data||[]){const promo=Number(v.promo_price||0),ask=Number(v.asking_price||0);costMap.set(v.id,{sell:promo>0&&promo<ask?promo:ask,cost:Number(v.purchase_cost||0)+Number(v.cost_transfer||0)+Number(v.cost_puspakom||0)+Number(v.cost_transport||0)+(rep.get(v.id)||0),approved:Number(v.cost_agent_commission||0)})}}catch(_){}
   const fmt=n=>(n<0?'−':'')+'RM '+Math.abs(Math.round(n)).toLocaleString('ms-MY');
   function margin(v,amt){const c=costMap.get(v.id);if(!c||!c.cost)return '';const com=Math.max(Number(amt||0),c.approved);const before=c.sell-c.cost,after=before-com;return ' · Untung anggaran: '+fmt(before)+' → selepas komisen '+fmt(after)+(after<0?' ⚠️ RUGI':'')}
   const live=vehicles.filter(v=>!['sold','deleted','archived'].includes(String(v.status||'').toLowerCase()));
   const bulk=node('div','ag-config'),bLabel=node('label','','Isi semua kereta yang belum ada komisen (RM)'),bAmt=node('input');bAmt.type='number';bAmt.min='0';bAmt.step='50';bAmt.placeholder='cth 300';bLabel.append(bAmt);
   const bBtn=node('button','ag-c-orange','⚡ Guna untuk semua kosong');bBtn.type='button';bulk.append(bLabel,bBtn);po.append(bulk);
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
    const b=node('button','ag-c-green','💾 Simpan');b.type='button';
    const st=node('small','ag-com-st',(v.offer?.indicative_amount>0?'✓ RM '+Number(v.offer.indicative_amount).toLocaleString('ms-MY'):'Belum ditetapkan')+margin(v,v.offer?.indicative_amount));
    a.addEventListener('input',()=>{st.textContent=(a.value?'RM '+Number(a.value).toLocaleString('ms-MY')+' (belum disimpan)':'Belum ditetapkan')+margin(v,a.value);st.classList.toggle('loss',/RUGI/.test(st.textContent))});if(/RUGI/.test(st.textContent))st.classList.add('loss');
    b.onclick=async()=>{if(a.value===''||Number(a.value)<0||Number(a.value)>100000){a.focus();return}b.disabled=true;
     try{await saveOffer(v,a.value,c.value,on.checked);st.textContent='✓ Disimpan RM '+Number(a.value).toLocaleString('ms-MY')+(on.checked?'':' (disorok)')+margin(v,a.value);status('Komisen '+v.vehicle_id+' disimpan.')}
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
   // V125: komisen manual — ejen jual tanpa link
   {const mbox=node('div','ag-manual');const mt=node('button','ag-c-orange','➕ Rekod komisen manual (ejen jual tanpa link)');mt.type='button';
    const mform=node('div','ag-manual-form');mform.hidden=true;mbox.append(mt,mform);pk.append(mbox);
    mt.onclick=async()=>{if(!mform.hidden){mform.hidden=true;return}mform.hidden=false;mform.replaceChildren(node('p','ag-muted-note','Memuatkan senarai ejen & jualan…'));
     let opt;try{opt=await request('manual_commission_options')}catch(e){mform.replaceChildren(node('p','ag-muted-note','Gagal: '+e.message));return}
     mform.replaceChildren();
     const fld=(lab,el)=>{const l=node('label','ag-mf');l.append(node('span','',lab),el);mform.append(l);return el};
     const selA=node('select');selA.append(Object.assign(node('option','','— Pilih ejen —'),{value:''}));
     for(const g of opt.agents||[]){const o=node('option','',(g.name||'Ejen')+' · '+(g.code||'—')+(g.phone?' · '+g.phone:''));o.value=g.id;selA.append(o)}
     fld('1. Ejen yang menjual',selA);const bk=node('small','ag-muted-note','');mform.append(bk);selA.addEventListener('change',()=>{bk.textContent=selA.value?bankOf(selA.value):''});
     const q=node('input');q.type='search';q.placeholder='Cari plat / model / pelanggan…';
     const selS=node('select');selS.size=Math.min(6,Math.max(3,(opt.sales||[]).length));
     const sl=(opt.sales||[]);const lab=x=>{const c=x.car||{};return [(c.plate||c.vehicle_id||'-'),[c.make,c.model,c.model_year].filter(Boolean).join(' '),(x.customer||'Pelanggan'),(x.sold_at?new Date(x.sold_at).toLocaleDateString('ms-MY',{day:'numeric',month:'short',year:'numeric'}):''),'Dibayar RM '+Number(x.paid||0).toLocaleString('ms-MY')].join(' · ')};
     const fill=()=>{const t=q.value.trim().toLowerCase();selS.replaceChildren();for(const x of sl){const L=lab(x);if(t&&!L.toLowerCase().includes(t))continue;const o=node('option','',L);o.value=x.id;selS.append(o)}if(!selS.options.length)selS.append(Object.assign(node('option','',sl.length?'Tiada padanan carian':'Tiada jualan SOLD yang belum ada komisen'),{value:'',disabled:true}))};
     fill();q.oninput=fill;
     const wrapS=node('div','ag-mf-sale');wrapS.append(q,selS);fld('2. Kereta yang dijual (jualan SOLD tanpa komisen)',wrapS);
     const amt=node('input');amt.type='number';amt.min='1';amt.max='100000';amt.step='0.01';amt.inputMode='decimal';amt.placeholder='cth 300';fld('3. Amaun komisen (RM)',amt);
     const hint=node('small','ag-muted-note','');mform.append(hint);
     selS.onchange=()=>{const x=sl.find(y=>y.id===selS.value);if(!x)return;if(x.offer>0&&!amt.value)amt.value=x.offer;hint.textContent=x.offer>0?'Komisen ditetapkan untuk kereta ini: RM '+Number(x.offer).toLocaleString('ms-MY'):'Komisen kereta ini belum ditetapkan — isi amaun yang dipersetujui.'};
     const rs=node('textarea');rs.rows=2;rs.placeholder='cth: Ejen bawa pelanggan terus ke kedai tanpa guna link promosi.';rs.value='Ejen jual terus kepada pelanggan tanpa melalui link promosi.';fld('4. Sebab / catatan (min. 20 aksara)',rs);
     const pl=node('label','ag-mf-chk'),pc=node('input');pc.type='checkbox';pc.checked=true;pl.append(pc,document.createTextNode(' Terus sediakan & luluskan payout (HR sahkan bila bayaran bank dibuat)'));mform.append(pl);
     const go=node('button','ag-c-green','✅ Rekod komisen & tolak sebagai kos kereta');go.type='button';mform.append(go);
     go.onclick=async()=>{const x=sl.find(y=>y.id===selS.value);const a=Number(amt.value);
      if(!selA.value)return status('Pilih ejen dahulu.',true);if(!x)return status('Pilih kereta/jualan.',true);
      if(!(a>0)||a>100000)return status('Amaun komisen tidak sah.',true);if(rs.value.trim().length<20)return status('Sebab terlalu pendek (min. 20 aksara).',true);
      const ag=(opt.agents||[]).find(g=>g.id===selA.value);
      if(!confirm('Rekod komisen RM '+a.toLocaleString('ms-MY')+' untuk '+(ag?.name||'ejen')+' ('+(ag?.code||'')+')\nKereta: '+lab(x)+'\n\nAmaun ini akan ditolak sebagai kos kereta (untung rugi dikemas kini).'+(pc.checked?'\nPayout akan diluluskan dan menunggu HR sahkan bayaran bank.':'')))return;
      go.disabled=true;try{await request('manual_commission',{agent_id:selA.value,sale_id:x.id,amount:a.toFixed(2),reason:rs.value.trim(),prepare:pc.checked});status('Komisen manual direkod & ditolak sebagai kos kereta.'+(pc.checked?' Payout menunggu HR sahkan bayaran bank.':''));await load()}
      catch(e){status(e.message,true);go.disabled=false}};
    };
   }
   const bankOf=id=>{const g=agents.find(x=>x.agent_profile_id===id);return g&&g.bank_account_no?'🏦 '+(g.bank_name||'Bank')+' · '+g.bank_account_no+(g.bank_account_holder?' ('+g.bank_account_holder+')':''):'🏦 Akaun bank belum diisi'};
   const agentName=id=>{const g=agents.find(x=>x.agent_profile_id===id);return g?(g.name||'Ejen')+' ('+(g.agent_code||'—')+')':'Ejen '+String(id||'').slice(0,8)};
   const unlinked=leads.leads||[];
   const hasCommission=new Set(commissions.map(c=>c.sale_id));
   const wonLeads=(fin.leads||[]).filter(l=>l.status==='won'&&!hasCommission.has(l.linked_sale_id));
   const approved=commissions.filter(c=>c.status==='approved');
   const drafts=payouts.filter(p=>p.status==='draft'),waitHr=payouts.filter(p=>p.status==='approved');
   if(!unlinked.length&&!wonLeads.length&&!approved.length&&!drafts.length&&!waitHr.length)pk.append(node('p','','Tiada tindakan menunggu.'));
   const candRaw=D.candRaw;
   const cands=Array.isArray(candRaw)?candRaw:[];
   const dShort=d=>d?new Date(d).toLocaleDateString('ms-MY',{day:'numeric',month:'short'}):'';
   for(const l of unlinked){
    const mine=cands.filter(c=>c.lead_id===l.id);
    const car=carMap.get(l.vehicle_id);const carLbl=car?[car.make,car.model,car.model_year].filter(Boolean).join(' ')+' ('+car.vehicle_id+')':'Kereta';
    const n=line(pk,'🔗 '+(l.customer_name||'Pelanggan')+' · '+carLbl,agentName(l.agent_id)+' · '+(l.customer_phone||'')+' · '+(l.lead_source==='public_referral'?'melalui link ejen':'daftar manual ejen'));
    if(!mine.length){n.append(node('small','ag-muted-note','Belum ada jualan untuk kereta ini. Bila jualan direkod, butang padanan akan muncul di sini.'));continue}
    const box=node('div','ag-controls');
    for(const c of mine){
     const b=node('button',c.phone_match?'ag-c-blue':'ag-c-gray','🔗 Padan: '+(c.customer_name||'Pelanggan')+' · '+(c.sale_status==='sold'?'Sold':'Reserved')+' · '+dShort(c.sale_date)+(c.phone_match?' ✓ telefon sepadan':' ⚠ telefon berbeza'));b.type='button';
     b.onclick=()=>{if(!c.phone_match){alert('Telefon pelanggan jualan tidak sama dengan telefon lead. Sistem hanya benarkan padanan jika telefon sepadan — kemas kini telefon pelanggan dalam jualan dahulu jika ia orang yang sama.');return}
      if(!confirm('Padankan lead '+(l.customer_name||'')+' ('+agentName(l.agent_id)+') dengan jualan '+(c.customer_name||'')+' untuk '+c.car+'?'))return;
      act({action:'link_lead',lead_id:l.id,sale_id:c.sale_id,reason:'Disahkan owner: kereta & telefon pelanggan sepadan dengan lead ejen.'},'Lead dipadankan dengan jualan.',b)};
     box.append(b);
    }
    n.append(box);
   }
   for(const l of wonLeads){
    const offer=Number(carMap.get(l.vehicle_id)?.offer?.indicative_amount||0);
    const car=carMap.get(l.vehicle_id);const carLbl=car?[car.make,car.model,car.model_year].filter(Boolean).join(' '):'';
    const n=line(pk,'✅ Komisen menunggu: '+(l.customer_name||'')+(carLbl?' · '+carLbl:''),agentName(l.agent_id)+(offer?' · Komisen ditetapkan RM '+offer.toLocaleString('ms-MY'):' · Komisen kereta belum ditetapkan'));
    const b=node('button','ag-c-green',offer?'✅ Luluskan RM '+offer.toLocaleString('ms-MY'):'Luluskan komisen');b.type='button';
    b.onclick=()=>{const amount=prompt('Amaun komisen (RM). Diisi dari tetapan kereta — ubah jika perlu:',offer?offer.toFixed(2):'');if(!amount)return;
     if(!/^\d+(\.\d{1,2})?$/.test(amount.trim())||Number(amount)<=0)return status('Amaun tidak sah.',true);
     if(!confirm('Sahkan: bayaran jualan sudah diterima penuh dan tiada refund.\nLuluskan komisen RM '+Number(amount).toLocaleString('ms-MY')+' untuk '+agentName(l.agent_id)+'?\nAmaun ini akan ditolak sebagai kos kereta.'))return;
     act({action:'approve_commission',lead_id:l.id,amount:Number(amount).toFixed(2),reason:'Owner sahkan bayaran jualan penuh diterima, tiada refund. Komisen ikut tetapan kereta.',finance_reconciled:true},'Komisen diluluskan & ditolak sebagai kos kereta.',b)};
    n.append(b);
   }
   for(const c of approved){
    const n=line(pk,'💵 Komisen '+amount(c.agreed_amount)+' diluluskan',agentName(c.agent_id)+' · '+bankOf(c.agent_id)+' · sedia untuk payout');
    const b=node('button','ag-c-blue','🧾 Sediakan payout');b.type='button';
    b.onclick=()=>{const reason=prompt('Sebab penyediaan payout:','Komisen diluluskan, sedia untuk bayaran kepada ejen.');if(!reason||reason.trim().length<15)return status('Sebab terlalu pendek (min. 15 aksara).',true);
     act({action:'prepare_payout',commission_id:c.id,reason:reason.trim()},'Payout disediakan.',b)};
    n.append(b);
   }
   for(const p of drafts){
    const n=line(pk,'🧾 Payout '+amount(p.amount)+' (draf)',agentName(p.agent_id)+' · '+bankOf(p.agent_id));
    const b=node('button','ag-c-green','✅ Luluskan payout');b.type='button';
    b.onclick=()=>{const reason=prompt('Sebab kelulusan payout:','Owner luluskan payout komisen ejen untuk dibayar.');if(!reason||reason.trim().length<15)return status('Sebab terlalu pendek (min. 15 aksara).',true);
     act({action:'approve_payout',payout_id:p.id,reason:reason.trim()},'Payout diluluskan. Menunggu HR sahkan bayaran bank.',b)};
    n.append(b);
   }
   for(const p of waitHr)line(pk,'⏳ Payout '+amount(p.amount)+' diluluskan',agentName(p.agent_id)+' · '+bankOf(p.agent_id)+' · menunggu HR sahkan bayaran bank');
   const pd=section(content,'Ringkasan Komisen & Payout','Bayaran kekal memerlukan kelulusan owner dan pengesahan HR yang berasingan.','kelulusan');
   if(!commissions.length&&!payouts.length)pd.append(node('p','','Belum ada komisen atau payout.'));
   for(const c of commissions.slice(0,20))line(pd,'Komisen '+amount(c.agreed_amount),['Status '+c.status,agentName(c.agent_id),date(c.created_at)].join(' · '));
   for(const p of payouts.slice(0,20))line(pd,'Payout '+amount(p.amount),['Status '+p.status,agentName(p.agent_id),date(p.created_at)].join(' · '));
   const unreadLeads=agentLeads.filter(x=>!x.owner_read_at).length+directLeads.filter(x=>!x.owner_read_at).length;
   const pendingApprove=new Set(cands.map(c=>c.lead_id)).size+(fin.leads||[]).filter(l=>l.status==='won'&&!new Set(commissions.map(c=>c.sale_id)).has(l.linked_sale_id)).length+commissions.filter(c=>c.status==='approved').length+payouts.filter(p=>p.status==='draft').length;
   tabify({ejen:applications.length,kelulusan:pendingApprove,lead:unreadLeads,komisen:vehicles.filter(v=>!['sold','deleted','archived'].includes(String(v.status||'').toLowerCase())&&!(Number(v.offer?.indicative_amount)>0)).length});
  }
 }
 refresh.onclick=()=>load();
 void load();
 return()=>{disposed=true;host.replaceChildren()};
}
