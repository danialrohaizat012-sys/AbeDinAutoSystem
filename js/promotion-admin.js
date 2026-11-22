// Owner-only promotion editor (menu sendiri: Promosi Katalog). Supabase RLS also enforces owner access.
// Dirender dalam Shadow DOM dengan palet gelap sistem; js/shadow-theme.js tukar automatik untuk tema Terang.
const FIELDS=[
 ['badge','Label promosi',100,'input'],['headline','Tajuk utama',80,'input'],
 ['highlight','Teks besar / nilai jimat',80,'input'],['subtitle','Subtajuk',160,'input'],
 ['description','Penerangan promosi',650,'area'],['button_text','Teks butang',70,'input'],
 ['whatsapp_number','Nombor WhatsApp penerima',15,'input'],['whatsapp_text','Mesej WhatsApp pelanggan',450,'area'],
 ['disclaimer','Terma ringkas',350,'area']
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CSS=`:host{display:block;--card:#151412;--fg:#f4efe2;--mute:#a69f8c;--line:#2e2a20;--soft:#1e1c17;--field:#0f0e0c;--pri:#e8b10b;--pri-fg:#141000;--ok:#3fae6b;--bad:#e0473f;color-scheme:dark}
*{box-sizing:border-box}
.shell{color:var(--fg);font:15px/1.45 Inter,-apple-system,"Segoe UI",system-ui,sans-serif;background:#0a0a09;border:1px solid var(--line);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:14px}
.kick{font-size:11px;letter-spacing:.14em;color:var(--pri);font-weight:700}
h2{margin:2px 0 4px;font-size:21px;font-weight:800;color:var(--fg)}
p{margin:0}.mute{color:var(--mute);font-size:13.5px}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
.toggle{display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:pointer}
.toggle strong{display:block;font-size:15px}
.sw{position:relative;flex:none;width:52px;height:30px}
.sw input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.sw i{position:absolute;inset:0;border-radius:999px;background:#3a362c;transition:.2s}
.sw i::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#ffffff;transition:.2s}
.sw input:checked+i{background:var(--ok)}
.sw input:checked+i::after{transform:translateX(22px)}
.sw input:focus-visible+i{outline:2px solid var(--pri);outline-offset:2px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.wide{grid-column:1/-1}
label.f{display:grid;gap:6px;font-weight:700;font-size:12.5px;color:var(--mute)}
input:not([type=checkbox]),textarea{width:100%;min-width:0;background:var(--field);color:var(--fg);-webkit-text-fill-color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:11px 12px;font-size:14px;line-height:1.4;font-family:inherit;outline:none;opacity:1}
input::placeholder,textarea::placeholder{color:#6f685a;-webkit-text-fill-color:#6f685a}
input:focus,textarea:focus{border-color:var(--pri);box-shadow:0 0 0 3px #e8b10b33}
textarea{min-height:84px;resize:vertical}
.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}
.btn{border:1px solid var(--pri);background:var(--pri);color:var(--pri-fg);border-radius:10px;padding:11px 18px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit}
.btn:disabled{opacity:.5;cursor:default}
.msg{font-size:13.5px;color:var(--mute);min-height:20px}
.msg.ok{color:#8ce3ad}.msg.bad{color:#ffaaa4}
.chip{display:inline-block;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800}
.c-on{background:#12321f;color:#8ce3ad}.c-off{background:#2c2a25;color:#cfc8b6}
.pv-wrap{position:sticky;top:12px;display:flex;flex-direction:column;gap:8px}
.pv{background:#111;border:1px solid #5a4a14;border-radius:16px;padding:18px;text-align:center;display:flex;flex-direction:column;gap:6px}
.pv.off{opacity:.45;filter:grayscale(.7)}
.pv-badge{align-self:center;background:#3a2f0a;color:#ffd257;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:800;letter-spacing:.06em}
.pv-h{font-size:15px;font-weight:800;letter-spacing:.08em;color:var(--fg)}
.pv-big{font-size:28px;font-weight:900;color:var(--pri);line-height:1.1}
.pv-sub{font-weight:700;color:var(--fg)}
.pv-desc{font-size:13px;color:var(--mute)}
.pv-btn{margin-top:6px;background:#25d366;color:#ffffff;border-radius:10px;padding:10px;font-weight:800}
.pv-terms{font-size:11px;color:#8a8373}
@media(max-width:900px){.layout{grid-template-columns:1fr}.pv-wrap{position:static}}
@media(max-width:640px){.shell{border:0;border-radius:0;padding:4px 0 70px;background:transparent}.grid{grid-template-columns:1fr}.wide{grid-column:auto}h2{font-size:18px}}`;

export async function mountPromotionEditor(host,{client,profile}={}){
 if(!host||profile?.role!=='owner'||profile?.enabled!==true)return;
 const root=host.shadowRoot||host.attachShadow({mode:'open'});
 const field=([key,label,max,kind])=>`<label class="f ${kind==='area'?'wide':''}">${esc(label)}${kind==='area'?`<textarea name="${key}" maxlength="${max}" required></textarea>`:`<input name="${key}" maxlength="${max}" ${key==='whatsapp_number'?'inputmode="numeric" placeholder="601156366925"':''} required>`}</label>`;
 root.innerHTML=`<style>${CSS}</style><section class="shell">
 <div><div class="kick">KATALOG AWAM</div><h2>Promosi Katalog</h2><p class="mute">ON/OFF popup dan ubah teks promosi. Perubahan dipaparkan kepada pelawat baharu tanpa perlu ubah kod.</p></div>
 <div class="layout"><form id="f" class="card" novalidate>
  <label class="toggle card" style="margin-bottom:14px;background:var(--soft)"><span><strong>Aktifkan popup promosi</strong><span class="mute">OFF untuk sembunyikan promosi pada katalog awam</span></span><span class="sw"><input name="enabled" type="checkbox" aria-label="Aktifkan popup promosi"><i></i></span></label>
  <div class="grid">${FIELDS.map(field).join('')}</div>
  <div class="actions"><button class="btn" type="submit">Simpan Promosi</button><span id="chip"></span></div>
  <div id="msg" class="msg" role="status" style="margin-top:8px">Memuatkan tetapan...</div>
 </form>
 <div class="pv-wrap"><div class="kick">PRATONTON POPUP</div><div id="pv" class="pv"></div><p class="mute" style="font-size:12px">Anggaran rupa popup pada katalog.</p></div></div>
 </section>`;
 const form=root.getElementById('f'),msg=root.getElementById('msg'),chip=root.getElementById('chip'),pv=root.getElementById('pv'),save=form.querySelector('[type=submit]');
 const say=(t,c='')=>{msg.textContent=t;msg.className='msg '+c};
 const val=k=>String(form.elements[k]?.value||'').trim();
 const preview=()=>{
  const on=form.elements.enabled.checked;
  pv.classList.toggle('off',!on);
  pv.innerHTML=`${val('badge')?`<span class="pv-badge">${esc(val('badge'))}</span>`:''}<div class="pv-h">${esc(val('headline'))}</div><div class="pv-big">${esc(val('highlight'))}</div><div class="pv-sub">${esc(val('subtitle'))}</div><div class="pv-desc">${esc(val('description'))}</div><div class="pv-btn">${esc(val('button_text')||'Butang')}</div><div class="pv-terms">${esc(val('disclaimer'))}</div>`;
  chip.innerHTML=on?'<span class="chip c-on">● Popup ON</span>':'<span class="chip c-off">○ Popup OFF</span>';
 };
 form.addEventListener('input',preview);form.addEventListener('change',preview);
 const {data,error}=await client.from('catalogue_promotion_settings').select('*').eq('id',true).single();
 if(!host.isConnected)return;
 if(error||!data){say('Tidak dapat muat tetapan: '+(error?.message||'Rekod tiada'),'bad');save.disabled=true;return}
 for(const [key] of FIELDS){form.elements[key].value=data[key]??'';form.elements[key].defaultValue=data[key]??''}
 form.elements.enabled.checked=form.elements.enabled.defaultChecked=!!data.enabled;
 preview();say(data.enabled?'Status: promosi aktif':'Status: promosi dimatikan');
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const vals={enabled:form.elements.enabled.checked};
  for(const [key,label] of FIELDS){vals[key]=val(key);if(!vals[key]){say(label+' wajib diisi.','bad');form.elements[key].focus();return}}
  if(!/^60[0-9]{8,11}$/.test(vals.whatsapp_number)){say('Nombor WhatsApp mesti bermula 60, contoh 601156366925.','bad');form.elements.whatsapp_number.focus();return}
  save.disabled=true;say('Menyimpan promosi...');
  try{
   const {data:updated,error}=await client.from('catalogue_promotion_settings').update({...vals,updated_at:new Date().toISOString()}).eq('id',true).select('id,enabled').single();
   if(error)throw error;if(!updated)throw Error('Perubahan tidak disimpan.');
   for(const [key] of FIELDS)form.elements[key].defaultValue=vals[key];
   form.elements.enabled.defaultChecked=vals.enabled;
   say('Berjaya disimpan. Popup '+(updated.enabled?'ON':'OFF')+'. Pelawat baharu akan melihat tetapan terbaru.','ok');
  }catch(err){say('Gagal simpan: '+(err.message||err),'bad')}
  finally{save.disabled=false}
 });
}
