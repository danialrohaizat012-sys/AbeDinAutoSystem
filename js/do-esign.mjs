// E-Sign: the server returns the exact archived PDF, never writes sales or vehicle data.
const ENDPOINT='https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/delivery-order-esign';
const KEY='sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatTime=t=>new Intl.DateTimeFormat('ms-MY',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kuala_Lumpur'}).format(new Date(t));
export async function esignRequest(action,params={},jwt){
 const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,...(jwt?{Authorization:'Bearer '+jwt}:{})},body:JSON.stringify({action,...params}),cache:'no-store',referrerPolicy:'no-referrer'});
 let data;try{data=await res.json()}catch(_){throw Error('Perkhidmatan E-Sign tidak dapat dihubungi.')}
 if(!res.ok||data.error)throw Object.assign(Error(data.error||'Permintaan gagal.'),{status:res.status});return data;
}
function pdfFile(data){const bytes=Uint8Array.from(atob(data.pdf),c=>c.charCodeAt(0));const name='DO-'+String(data.fields?.plate||'jualan').replace(/[^a-z0-9_-]/gi,'')+'-'+String(data.fields?.no||'').replace(/^DO-/,'')+'.pdf';return new File([bytes],name,{type:'application/pdf'})}
// The share sheet receives the actual PDF and editable text, not a public link.
// WhatsApp/OS decides whether it accepts the caption and which contact receives it.
export function deliveryShareMessage(fields={},signed=false,link=''){
 const name=String(fields.name||'').trim(),car=[fields.model,fields.plate&&'('+fields.plate+')'].filter(Boolean).join(' '),no=String(fields.no||'').trim();
 return ['Salam'+(name?' '+name:'')+',','','Terima kasih kerana memilih Abe Din Auto.',signed?'Bersama ini dilampirkan Borang Serahan Kenderaan (DO PDF) yang telah ditandatangani untuk simpanan dan rujukan anda.':'Bersama ini dilampirkan Borang Serahan Kenderaan (DO PDF) untuk semakan. Borang ini belum ditandatangani.','',car?'Kenderaan: '+car:'',no?'No. DO: '+no:'','','Terima kasih.','Abe Din Auto'].filter((v,i,a)=>v!==''||i===1||i===4||i===7).join('\n')+(link?'\n\nLihat atau muat turun DO PDF (sah 7 hari):\n'+link:'');
}
export function deliverySharePayload(file,text){return {files:[file],title:'DO Abe Din Auto',text:String(text??'')}}
export async function withSalesSession(client,call){
 const {data,error}=await client.auth.getSession();
 let jwt=data?.session?.access_token;
 if(error||!jwt)throw Error('Sila log masuk semula.');
 try{return await call(jwt)}catch(e){
  if(e?.status!==401)return Promise.reject(e);
  const refreshed=await client.auth.refreshSession();
  jwt=refreshed.data?.session?.access_token;
  if(refreshed.error||!jwt)throw Error('Sesi telah tamat. Sila log masuk semula.');
  return call(jwt);
 }
}
export async function issueDeliveryLink(client,saleId,signed,handover={}){
 return withSalesSession(client,async jwt=>{
 const res=await fetch(ENDPOINT.replace(/delivery-order-esign$/,'delivery-order-share'),{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+jwt},body:JSON.stringify({action:'issue',sale_id:saleId,signed,handover}),cache:'no-store',referrerPolicy:'no-referrer'});
 const out=await res.json();if(!res.ok||!/^[a-f0-9]{64}$/.test(out.token||''))throw Object.assign(Error(out.error||'Pautan PDF gagal dijana.'),{status:res.status});
 return 'https://abedinauto.my/do.html#t='+out.token;
 });
}
export function mountDeliveryShare(host,{file,fields={},phone='',signed=false,link=''}){
 const ph=String(phone||'').replace(/\D/g,'');
 const number=/^[1-9]\d{7,14}$/.test(ph)?ph:'';
 const url=URL.createObjectURL(file);
 host.innerHTML='<div class="cloud-notice">'+esc(fields.name||'Pelanggan')+(number?' · +'+esc(number):'')+' · '+(signed?'PDF sudah ditandatangani':'PDF belum ditandatangani')+'</div><label class="es-form">Mesej WhatsApp<textarea rows="8" data-do-message></textarea></label><button type="button" class="es-green ada-wa-btn" data-do-share>Hantar mesej + DO PDF</button><button type="button" class="es-btn secondary" data-do-copy>Salin mesej</button><button type="button" class="es-btn secondary" data-do-chat '+(number?'':'disabled')+'>Hantar WhatsApp (mesej + link PDF)</button><a class="es-btn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Lihat PDF</a><a class="es-btn" href="'+esc(url)+'" download="'+esc(file.name)+'">Muat turun PDF</a><p class="es-muted" role="status" data-do-status>Pilih WhatsApp dan nombor pelanggan dalam menu perkongsian. Semak mesej sebelum hantar.</p>';
 const q=s=>host.querySelector(s),message=q('[data-do-message]'),status=q('[data-do-status]'),share=q('[data-do-share]');
 message.value=deliveryShareMessage(fields,signed,link);
 const download=()=>{const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove()};
 q('[data-do-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(message.value);status.textContent='Mesej disalin. Tampal pada kapsyen PDF jika diperlukan.'}catch(_){message.focus();message.select();status.textContent='Salin mesej yang dipilih secara manual.'}};
 q('[data-do-chat]').onclick=()=>{if(number){const body=link&&!message.value.includes(link)?message.value+'\n\n'+link:message.value;window.location.assign('https://wa.me/'+number+'?text='+encodeURIComponent(body))}};
 share.onclick=async()=>{
  const payload=deliverySharePayload(file,message.value);
  try{
   if(typeof navigator.share!=='function'||!navigator.canShare?.(payload)){download();status.textContent='Peranti tidak menyokong perkongsian mesej dan fail serentak. PDF dimuat turun. Salin mesej dan lampirkan fail dalam WhatsApp.';return}
   share.disabled=true;await navigator.share(payload);
   status.textContent='Menu perkongsian selesai. Semak PDF, mesej dan penerima dalam WhatsApp. Jika teks tidak dibawa, gunakan Salin mesej.';
  }catch(e){if(e?.name!=='AbortError')status.textContent='Perkongsian tidak berjaya. Gunakan Muat turun PDF dan Salin mesej.'}
  finally{share.disabled=false}
 };
 const observer=new MutationObserver(()=>{if(!host.isConnected){URL.revokeObjectURL(url);observer.disconnect()}});
 observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('pagehide',()=>{URL.revokeObjectURL(url);observer.disconnect()},{once:true});
}
function pdfActions(host,data,phone='',staff=false,link=''){
 if(staff){mountDeliveryShare(host,{file:pdfFile(data),fields:data.fields,phone,signed:true,link});return;}
 const file=pdfFile(data),url=URL.createObjectURL(file);
 const href=esc(url),name=esc(file.name);
 host.innerHTML='<a class="es-btn" href="'+href+'" target="_blank" rel="noopener noreferrer">Lihat PDF</a><a class="es-btn" href="'+href+'" download="'+name+'">Muat turun PDF</a><button type="button" data-share class="es-green">Kongsi DO PDF ke WhatsApp</button>'+(phone?'<a class="es-btn" href="https://wa.me/'+esc(phone)+'?text='+encodeURIComponent('Salam, DO kenderaan anda telah ditandatangani. Kami akan kongsikan fail PDF.')+'" target="_blank" rel="noopener noreferrer">Buka WhatsApp pelanggan (mesej)</a>':'')+'<p class="es-muted" data-share-status>Untuk lampirkan PDF, pilih WhatsApp dan penerima dalam menu perkongsian.</p>';
 const status=host.querySelector('[data-share-status]');
 const download=()=>{const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove()};
 host.querySelector('[data-share]').onclick=async()=>{try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'DO Abe Din Auto'});status.textContent='Menu perkongsian selesai. Semak penghantaran dalam WhatsApp.'}else{download();status.textContent='PDF dimuat turun. Lampirkan fail secara manual dalam WhatsApp.'}}catch(e){if(e.name!=='AbortError')status.textContent='Perkongsian gagal. Gunakan Muat turun PDF.'}};
 window.addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
}
const STYLE='<style>.es-form{display:grid;gap:10px}.es-form label{display:grid;gap:5px}.es-form input,.es-form textarea,.es-form select{width:100%;min-width:0}.es-checks{display:flex;flex-wrap:wrap;gap:10px}.es-checks label{display:flex;align-items:center}.es-checks input{width:auto}.es-actions{display:grid;gap:9px;margin:12px 0}.es-btn,.es-green{box-sizing:border-box;display:block;text-align:center;border:1px solid #80808066;border-radius:10px;padding:12px;text-decoration:none;color:inherit;font:inherit;font-weight:650;cursor:pointer}.es-green{background:#15803d!important;color:#fff!important}.es-muted{font-size:12px;opacity:.85}.es-good{color:#39bc78;font-weight:750}</style>';
export async function mountStaffESign({client,cloudModal,saleId,fields:a,phone}){
 const request=(action,params={})=>withSalesSession(client,jwt=>esignRequest(action,{sale_id:saleId,...params},jwt));
 const current=await request('staff_get');
 if(current.status==='signed'){
  const o=cloudModal('E-Sign DO - Sudah sign',STYLE+'<p class="es-good">Sudah ditandatangani: '+esc(formatTime(current.signed_at))+' MYT</p><p>PDF dikunci dan disimpan dalam sistem.</p><div class="es-actions" data-pdf></div>');
  o.querySelector('form').onsubmit=e=>e.preventDefault();const host=o.querySelector('[data-pdf]');host.textContent='Menjana pautan PDF…';try{const link=await issueDeliveryLink(client,saleId,true);pdfActions(host,current,phone,true,link)}catch(e){pdfActions(host,current,phone,true);o.querySelector('.ada-form-error').textContent=e.message} return;
 }
 const notice=current.status==='pending'?'Pautan aktif sehingga '+formatTime(current.expires_at)+'. Menjana pautan baharu membatalkan pautan lama.':current.status==='expired'?'Pautan lama telah tamat tempoh.':'Belum ditandatangani.';
 const o=cloudModal('E-Sign DO - '+a.plate,STYLE+'<p>'+esc(notice)+'</p><p class="es-muted">Pastikan butiran sebenar serahan tepat. Pelanggan akan melihat PDF ini sebelum tandatangan.</p><div class="cloud-notice">'+esc(a.name)+' · '+esc(a.model)+' · '+esc(a.plate)+'</div><div class="es-form">'+
 '<label>Tarikh serahan<input name="date" type="date" required></label><label>Masa serahan<input name="time" type="time" required></label>'+
 '<label>No. IC<input name="ic" maxlength="40" value="'+esc(a.ic)+'"></label><label>Alamat<textarea name="address" maxlength="180" rows="2">'+esc(a.address)+'</textarea></label>'+
 '<label>Mileage (km)<input name="mileage" type="number" min="0" max="999999999" step="1" value="'+esc(a.mileage)+'"></label>'+
 '<label>Keadaan kenderaan<select name="condition" required><option value="">Pilih</option><option value="baik">Baik</option><option value="perlu">Perlu Pemeriksaan</option></select></label>'+
 '<label>Bilangan kunci<select name="keys" required><option value="">Pilih</option><option>1</option><option>2</option></select></label>'+
 '<div>Dokumen diserahkan</div><div class="es-checks"><label><input type="checkbox" name="docs" value="geran">Geran/e-Geran</label><label><input type="checkbox" name="docs" value="insurans">Insurans</label><label><input type="checkbox" name="docs" value="lain">Lain-lain</label></div>'+
 '<label>Aksesori<input name="accessories" maxlength="35"></label><label>Catatan / rujukan kecacatan dimaklumkan sebelum pembelian<textarea name="notes" maxlength="150" rows="2"></textarea></label></div><button type="submit">Jana pautan E-Sign (48 jam)</button><div data-result class="es-actions"></div>');
 const form=o.querySelector('form'),err=o.querySelector('.ada-form-error'),btn=form.querySelector('[type=submit]');
 form.onsubmit=async e=>{e.preventDefault();if(current.status==='pending'&&!confirm('Batalkan pautan lama dan jana pautan baharu?'))return;
 btn.disabled=true;err.textContent='Menjana...';try{const fd=new FormData(form),handover={...Object.fromEntries(fd),docs:fd.getAll('docs')};const result=await request('staff_issue',{handover});const link=location.origin+'/do-sign.html#t='+result.token;const text='Salam, sila semak borang serahan kenderaan Abe Din Auto dan tandatangan melalui pautan sulit ini: '+link+' (sah 48 jam).';
 const box=form.querySelector('[data-result]');box.innerHTML='<p class="es-good">Pautan berjaya dijana. Tamat: '+esc(formatTime(result.expires_at))+'</p><a class="es-green" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Sign pada telefon ini</a>'+(phone?'<a class="es-green" href="https://wa.me/'+esc(phone)+'?text='+encodeURIComponent(text)+'" target="_blank" rel="noopener noreferrer">Hantar pautan ke WhatsApp pelanggan</a>':'')+'<button type="button" data-copy>Salin pautan sulit</button><button type="button" data-refresh>Semak status tandatangan</button><p class="es-muted">Jangan kongsi pautan dengan pihak lain.</p>';
 box.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(link);err.textContent='Pautan disalin.'}catch(_){window.prompt('Salin pautan sulit ini:',link)}};
 box.querySelector('[data-refresh]').onclick=async()=>{try{const data=await request('staff_get');if(data.status==='signed'){box.innerHTML='<p class="es-good">Sudah ditandatangani: '+esc(formatTime(data.signed_at))+' MYT</p><div data-pdf class="es-actions"></div>';const host=box.querySelector('[data-pdf]');host.textContent='Menjana pautan PDF…';try{const link=await issueDeliveryLink(client,saleId,true);pdfActions(host,data,phone,true,link)}catch(e){pdfActions(host,data,phone,true);err.textContent=e.message}}else err.textContent='Status: '+(data.status==='pending'?'Belum ditandatangani':'Pautan tamat tempoh.')}catch(e){err.textContent=e.message}};
 err.textContent='';}catch(e){err.textContent=e.message;btn.disabled=false}};
}
export function mountSignaturePad(canvas,onChange){
 const ctx=canvas.getContext('2d');let strokes=[],active=null,pointer=null,points=0;
 const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#172f61';for(const s of strokes){if(s.length<2)continue;ctx.beginPath();ctx.moveTo(s[0][0]*canvas.width,s[0][1]*canvas.height);for(const p of s.slice(1))ctx.lineTo(p[0]*canvas.width,p[1]*canvas.height);ctx.stroke()}};
 const pos=e=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]};
 const stop=e=>{if(e.pointerId!==pointer)return;if(active?.length<2){strokes.pop();points--}active=null;pointer=null;draw();onChange(strokes.length>0)};
 canvas.addEventListener('pointerdown',e=>{if(pointer!==null||points>=1950||strokes.length>=80)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);active=[pos(e)];strokes.push(active);points++});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!active||points>=1950)return;e.preventDefault();const p=pos(e),last=active.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])<.002)return;active.push(p);points++;draw()});
 canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
 return {get:()=>strokes.filter(s=>s.length>=2),clear:()=>{strokes=[];active=null;pointer=null;points=0;draw();onChange(false)}};
}
export async function mountBuyerESign(host,token){
 if(!/^[0-9a-f]{64}$/.test(token))throw Error('Pautan tidak sah. Hubungi Abe Din Auto.');
 const get=()=>esignRequest('buyer_get',{token});let data=await get();
 const signed=d=>{host.innerHTML='<h2 class="es-good">Tandatangan disahkan</h2><p>Tarikh: '+esc(formatTime(d.signed_at))+' MYT</p><p>DO PDF telah disimpan. Muat turun atau kongsi salinan anda.</p><div class="es-actions" data-pdf></div>';pdfActions(host.querySelector('[data-pdf]'),d)};
 if(data.status==='signed'){signed(data);return}
 if(data.terms_version!==3||!data.terms||!Array.isArray(data.terms.clauses)||data.terms.clauses.length!==7)throw Error('Terma DO tidak dapat dimuatkan. Sila buka semula pautan.');
 const a=data.fields,file=pdfFile(data),url=URL.createObjectURL(file);
 const termsHtml='<h3>Pengakuan, persetujuan dan penerimaan kenderaan</h3><p>'+esc(data.terms.intro)+'</p><ol>'+data.terms.clauses.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol><p><strong>'+esc(data.terms.rights)+'</strong></p>';
 const labels=[['No. DO',a.no],['Tarikh',a.date+' '+a.time],['Pelanggan',a.name],['No. IC',a.ic],['Telefon',a.phone],['Alamat',a.address],['No. pendaftaran',a.plate],['Model',a.model],['Tahun',a.year],['Mileage',a.mileage],['Keadaan',a.condition==='baik'?'Baik':'Perlu Pemeriksaan'],['Kunci',a.keys],['Dokumen',(a.docs||[]).map(x=>({geran:'Geran/e-Geran',insurans:'Insurans',lain:'Lain-lain'}[x])).join(', ')||'Tiada ditanda'],['Aksesori',a.accessories],['Catatan / rujukan kecacatan dimaklumkan sebelum pembelian',a.notes]];
 host.innerHTML='<h2>Semak borang serahan</h2><dl>'+labels.map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v===''||v==null?'-':v)+'</dd>').join('')+'</dl><a class="es-btn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Lihat DO PDF penuh</a>'+termsHtml+'<label class="accept"><input type="checkbox" data-accept> Saya telah menyemak maklumat dan bersetuju menandatangani borang serahan ini.</label><h3>Tandatangan pelanggan</h3><canvas width="640" height="240" aria-label="Ruang tandatangan"></canvas><button type="button" data-clear class="es-btn">Padam tandatangan</button><button type="button" data-sign class="es-green" disabled>Sahkan Tandatangan</button><p data-status role="status"></p><p class="es-muted">Tandatangan akan dikunci selepas disahkan. Jangan tandatangan sebelum kenderaan diterima.</p>';
 const accept=host.querySelector('[data-accept]'),btn=host.querySelector('[data-sign]'),status=host.querySelector('[data-status]');let ink=false,busy=false;
 const update=()=>btn.disabled=busy||!ink||!accept.checked;
 const pad=mountSignaturePad(host.querySelector('canvas'),has=>{ink=has;update()});accept.onchange=update;host.querySelector('[data-clear]').onclick=()=>{if(!busy)pad.clear()};
 btn.onclick=async()=>{if(busy||!accept.checked||!pad.get().length)return;busy=true;update();status.textContent='Menyimpan tandatangan...';try{const result=await esignRequest('buyer_sign',{token,accept:true,terms_version:data.terms_version,signature:pad.get()});URL.revokeObjectURL(url);signed(result)}catch(e){status.textContent=e.message+' Jika telah sign, muat semula halaman.';busy=false;update()}};
 window.addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
}
