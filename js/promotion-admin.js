// Owner-only promotion editor: Supabase RLS also enforces owner access.
const names=[
 ['badge','Label promosi',100],['headline','Tajuk utama',80],['highlight','Teks besar / nilai jimat',80],
 ['subtitle','Subtajuk',160],['description','Penerangan promosi',650],['button_text','Teks butang',70],
 ['whatsapp_text','Mesej WhatsApp pelanggan',450],['whatsapp_number','Nombor WhatsApp penerima',15],
 ['disclaimer','Terma ringkas',350]
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountPromotionEditor(host,{client,profile}={}){
 if(!host||profile?.role!=='owner'||profile?.enabled!==true)return;
 host.innerHTML=`<style>
 .ada-pm{border:1px solid #d4e0eb;border-radius:16px;background:#fff!important;color:#142335!important;padding:16px;margin:0 0 18px;font:14px system-ui,sans-serif;color-scheme:light}
 .ada-pm h3{color:#142335!important;margin:0 0 6px!important;font-size:19px}
 .ada-pm p{color:#52657c!important;margin:0 0 15px}
 .ada-pm-toggle{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;background:#f0f5fa;border-radius:11px;margin-bottom:12px;color:#142335}
 .ada-pm-toggle input{width:23px;height:23px;accent-color:#168453}
 .ada-pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
 .ada-pm label{display:grid;gap:6px;color:#283b50!important;font-weight:650;font-size:12px}
 .ada-pm input:not([type=checkbox]),.ada-pm textarea{width:100%;min-width:0;box-sizing:border-box;background:#fff!important;color:#142335!important;-webkit-text-fill-color:#142335!important;border:1px solid #b6c5d3!important;border-radius:9px;padding:11px;font:14px system-ui;opacity:1}
 .ada-pm textarea{min-height:77px;resize:vertical}
 .ada-pm .wide{grid-column:1/-1}
 .ada-pm-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:15px}
 .ada-pm button{border:0;border-radius:10px;background:#1762a8!important;color:#fff!important;padding:12px 16px;font-weight:800;cursor:pointer}
 .ada-pm button:disabled{opacity:.55}
 .ada-pm-status{color:#334155!important;margin-top:9px;min-height:20px}
 @media(max-width:650px){.ada-pm-grid{grid-template-columns:1fr}.ada-pm .wide{grid-column:auto}.ada-pm{padding:13px}}
 </style>
 <section class="ada-pm"><h3>Pengurusan Promosi Katalog</h3><p>ON/OFF popup dan ubah teks promosi seterusnya. Perubahan akan dipaparkan kepada pelawat baharu tanpa perlu ubah kod.</p><form id="ada-pm-form">
 <label class="ada-pm-toggle"><span><strong>Aktifkan popup promosi</strong><small style="display:block;color:#52657c">OFF untuk sembunyikan promosi pada katalog awam</small></span><input name="enabled" type="checkbox"></label>
 <div class="ada-pm-grid">${names.map(([key,label,max])=>`<label class="${['description','whatsapp_text','disclaimer'].includes(key)?'wide':''}">${esc(label)}${['description','whatsapp_text','disclaimer'].includes(key)?`<textarea name="${key}" maxlength="${max}" required></textarea>`:`<input name="${key}" maxlength="${max}" required>`}</label>`).join('')}</div>
 <div class="ada-pm-actions"><button type="submit">Simpan Promosi</button></div>
 <div id="ada-pm-status" class="ada-pm-status" role="status">Memuatkan tetapan...</div></form></section>`;
 const form=host.querySelector('#ada-pm-form'),status=host.querySelector('#ada-pm-status'),save=form.querySelector('[type=submit]');
 const {data,error}=await client.from('catalogue_promotion_settings').select('*').eq('id',true).single();
 if(!host.isConnected)return;
 if(error||!data){status.textContent='Tidak dapat muat tetapan: '+(error?.message||'Rekod tiada');save.disabled=true;return}
 for(const [key] of names)form.elements[key].value=data[key]??'';
 form.elements.enabled.checked=!!data.enabled;
 status.textContent=data.enabled?'Status: promosi aktif':'Status: promosi dimatikan';
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const vals={enabled:form.elements.enabled.checked};
  for(const [key] of names)vals[key]=String(form.elements[key].value||'').trim();
  if(!/^60[0-9]{8,11}$/.test(vals.whatsapp_number)){status.textContent='Nombor WhatsApp mesti bermula 60, contoh 601156366925.';return}
  save.disabled=true;status.textContent='Menyimpan promosi...';
  try{
   const {data:updated,error}=await client.from('catalogue_promotion_settings').update({...vals,updated_at:new Date().toISOString()}).eq('id',true).select('id,enabled').single();
   if(error)throw error;if(!updated)throw Error('Perubahan tidak disimpan.');
   status.textContent='Berjaya disimpan. Popup '+(updated.enabled?'ON':'OFF')+'. Pelawat baharu akan melihat tetapan terbaru.';
  }catch(err){status.textContent='Gagal simpan: '+(err.message||err)}
  finally{save.disabled=false}
 });
}
