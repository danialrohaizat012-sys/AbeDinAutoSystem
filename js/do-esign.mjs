// E-Sign: the server returns the exact archived PDF, never writes sales or vehicle data.
const ENDPOINT='https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/delivery-order-esign';
const KEY='sb_publishable_zuuNipsMpalN_38SJwXpFA_MRzQ6eZ0';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatTime=t=>new Intl.DateTimeFormat('ms-MY',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kuala_Lumpur'}).format(new Date(t));
export async function esignRequest(action,params={},jwt){
 const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,...(jwt?{Authorization:'Bearer '+jwt}:{})},body:JSON.stringify({action,...params}),cache:'no-store',referrerPolicy:'no-referrer'});
 let data;try{data=await res.json()}catch(_){throw Error('Perkhidmatan E-Sign tidak dapat dihubungi.')}
 if(!res.ok||data.error)throw Error(data.error||'Permintaan gagal.');return data;
}
function pdfFile(data){const bytes=Uint8Array.from(atob(data.pdf),c=>c.charCodeAt(0));const name='DO-'+String(data.fields?.plate||'jualan').replace(/[^a-z0-9_-]/gi,'')+'-'+String(data.fields?.no||'').replace(/^DO-/,'')+'.pdf';return new File([bytes],name,{type:'application/pdf'})}
function pdfActions(host,data,phone=''){
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
 const request=async(action,params={})=>{const {data}=await client.auth.getSession();const jwt=data.session?.access_token;if(!jwt)throw Error('Sila log masuk semula.');return esignRequest(action,{sale_id:saleId,...params},jwt)};
 const current=await request('staff_get');
 if(current.status==='signed'){
  const o=cloudModal('E-Sign DO - Sudah sign',STYLE+'<p class="es-good">Sudah ditandatangani: '+esc(formatTime(current.signed_at))+' MYT</p><p>PDF dikunci dan disimpan dalam sistem.</p><div class="es-actions" data-pdf></div>');
  o.querySelector('form').onsubmit=e=>e.preventDefault();pdfActions(o.querySelector('[data-pdf]'),current,phone);return;
 }
 const notice=current.status==='pending'?'Pautan aktif sehingga '+formatTime(current.expires_at)+'. Menjana pautan baharu membatalkan pautan lama.':current.status==='expired'?'Pautan lama telah tamat tempoh.':'Belum ditandatangani.';
 const o=cloudModal('E-Sign DO - '+a.plate,STYLE+'<p>'+esc(notice)+'</p><p class="es-muted">Pastikan butiran sebenar serahan tepat. Pelanggan akan melihat PDF ini sebelum tandatangan.</p><div class="cloud-notice">'+esc(a.name)+' · '+esc(a.model)+' · '+esc(a.plate)+'</div><div class="es-form">'+
 '<label>Tarikh serahan<input name="date" type="date" required></label><label>Masa serahan<input name="time" type="time" required></label>'+
 '<label>No. IC<input name="ic" maxlength="40" value="'+esc(a.ic)+'"></label><label>Alamat<textarea name="address" maxlength="180" rows="2">'+esc(a.address)+'</textarea></label>'+
 '<label>Mileage (km)<input name="mileage" type="number" min="0" max="999999999" step="1" value="'+esc(a.mileage)+'"></label>'+
 '<label>Keadaan kenderaan<select name="condition" required><option value="">Pilih</option><option value="baik">Baik</option><option value="perlu">Perlu Pemeriksaan</option></select></label>'+
 '<label>Bilangan kunci<select name="keys" required><option value="">Pilih</option><option>1</option><option>2</option></select></label>'+
 '<div>Dokumen diserahkan</div><div class="es-checks"><label><input type="checkbox" name="docs" value="geran">Geran/e-Geran</label><label><input type="checkbox" name="docs" value="insurans">Insurans</label><label><input type="checkbox" name="docs" value="lain">Lain-lain</label></div>'+
 '<label>Aksesori<input name="accessories" maxlength="35"></label><label>Catatan<textarea name="notes" maxlength="150" rows="2"></textarea></label></div><button type="submit">Jana pautan E-Sign (48 jam)</button><div data-result class="es-actions"></div>');
 const form=o.querySelector('form'),err=o.querySelector('.ada-form-error'),btn=form.querySelector('[type=submit]');
 form.onsubmit=async e=>{e.preventDefault();if(current.status==='pending'&&!confirm('Batalkan pautan lama dan jana pautan baharu?'))return;
 btn.disabled=true;err.textContent='Menjana...';try{const fd=new FormData(form),handover={...Object.fromEntries(fd),docs:fd.getAll('docs')};const result=await request('staff_issue',{handover});const link=location.origin+'/do-sign.html#t='+result.token;const text='Salam, sila semak borang serahan kenderaan Abe Din Auto dan tandatangan melalui pautan sulit ini: '+link+' (sah 48 jam).';
 const box=form.querySelector('[data-result]');box.innerHTML='<p class="es-good">Pautan berjaya dijana. Tamat: '+esc(formatTime(result.expires_at))+'</p><a class="es-green" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Sign pada telefon ini</a>'+(phone?'<a class="es-green" href="https://wa.me/'+esc(phone)+'?text='+encodeURIComponent(text)+'" target="_blank" rel="noopener noreferrer">Hantar pautan ke WhatsApp pelanggan</a>':'')+'<button type="button" data-copy>Salin pautan sulit</button><button type="button" data-refresh>Semak status tandatangan</button><p class="es-muted">Jangan kongsi pautan dengan pihak lain.</p>';
 box.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(link);err.textContent='Pautan disalin.'}catch(_){window.prompt('Salin pautan sulit ini:',link)}};
 box.querySelector('[data-refresh]').onclick=async()=>{try{const data=await request('staff_get');if(data.status==='signed'){box.innerHTML='<p class="es-good">Sudah ditandatangani: '+esc(formatTime(data.signed_at))+' MYT</p><div data-pdf class="es-actions"></div>';pdfActions(box.querySelector('[data-pdf]'),data,phone)}else err.textContent='Status: '+(data.status==='pending'?'Belum ditandatangani':'Pautan tamat tempoh.')}catch(e){err.textContent=e.message}};
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
 const a=data.fields,file=pdfFile(data),url=URL.createObjectURL(file);
 const labels=[['No. DO',a.no],['Tarikh',a.date+' '+a.time],['Pelanggan',a.name],['No. IC',a.ic],['Telefon',a.phone],['Alamat',a.address],['No. pendaftaran',a.plate],['Model',a.model],['Tahun',a.year],['Mileage',a.mileage],['Keadaan',a.condition==='baik'?'Baik':'Perlu Pemeriksaan'],['Kunci',a.keys],['Dokumen',(a.docs||[]).map(x=>({geran:'Geran/e-Geran',insurans:'Insurans',lain:'Lain-lain'}[x])).join(', ')||'Tiada ditanda'],['Aksesori',a.accessories],['Catatan',a.notes]];
 host.innerHTML='<h2>Semak borang serahan</h2><dl>'+labels.map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v===''||v==null?'-':v)+'</dd>').join('')+'</dl><a class="es-btn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Lihat DO PDF penuh</a><p>Saya mengesahkan bahawa kenderaan di atas telah diserahkan kepada saya dalam keadaan seperti yang dinyatakan dan saya telah menerima kenderaan serta dokumen/barang yang berkaitan. Sebarang perkara tambahan dinyatakan di bahagian catatan.</p><label class="accept"><input type="checkbox" data-accept> Saya telah menyemak maklumat dan bersetuju menandatangani borang serahan ini.</label><h3>Tandatangan pelanggan</h3><canvas width="640" height="240" aria-label="Ruang tandatangan"></canvas><button type="button" data-clear class="es-btn">Padam tandatangan</button><button type="button" data-sign class="es-green" disabled>Sahkan Tandatangan</button><p data-status role="status"></p><p class="es-muted">Tandatangan akan dikunci selepas disahkan. Jangan tandatangan sebelum kenderaan diterima.</p>';
 const accept=host.querySelector('[data-accept]'),btn=host.querySelector('[data-sign]'),status=host.querySelector('[data-status]');let ink=false,busy=false;
 const update=()=>btn.disabled=busy||!ink||!accept.checked;
 const pad=mountSignaturePad(host.querySelector('canvas'),has=>{ink=has;update()});accept.onchange=update;host.querySelector('[data-clear]').onclick=()=>{if(!busy)pad.clear()};
 btn.onclick=async()=>{if(busy||!accept.checked||!pad.get().length)return;busy=true;update();status.textContent='Menyimpan tandatangan...';try{const result=await esignRequest('buyer_sign',{token,accept:true,signature:pad.get()});URL.revokeObjectURL(url);signed(result)}catch(e){status.textContent=e.message+' Jika telah sign, muat semula halaman.';busy=false;update()}};
 window.addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
}
