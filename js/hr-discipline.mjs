export const labels={notice:'Notis / tunjuk sebab',response:'Jawapan pekerja',review:'Semakan / siasatan',outcome:'Keputusan bertulis',pip:'Pelan penambahbaikan',pip_update:'Semakan pelan',close:'Penutupan kes'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const klDay=(date=new Date())=>new Date(date.getTime()+8*3600000).toISOString().slice(0,10);
export function validDay(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day;}
export function allowed(history,role,today=klDay()){
 const last=history.at(-1);if(!last)return role==='owner'?['notice']:[];
 if(role==='staff')return ['notice','response','review'].includes(last.kind)?['response']:[];
 if(role!=='owner')return [];
 if(last.kind==='notice')return today>last.response_due?['review']:[];
 if(last.kind==='response')return ['review'];
 if(last.kind==='review')return today>history[0].response_due?['review','outcome']:['review'];
 if(last.kind==='outcome')return ['pip','close'];
 if(['pip','pip_update'].includes(last.kind))return ['pip_update','close'];
 return [];
}
export function makeEvent({staffId,caseId,history=[],kind,body,due=null,role,today=klDay()}){
 if(!uuid.test(staffId)||!uuid.test(caseId))throw Error('ID tidak sah');
 if(!allowed(history,role,today).includes(kind))throw Error('Tindakan tidak dibenarkan pada peringkat ini');
 if(typeof body!=='string'||body.trim().length<10||body.trim().length>10000)throw Error('Catatan mesti 10–10000 aksara');
 if(kind==='notice'&&(!validDay(due)||due<=today))throw Error('Tarikh jawapan mesti selepas hari ini');
 if(history.some((e,i)=>e.staff_id!==staffId||e.case_id!==caseId||e.seq!==i+1))throw Error('Sejarah tidak sepadan');
 return {staff_id:staffId,case_id:caseId,seq:history.length+1,kind,body:body.trim(),response_due:kind==='notice'?due:null};
}
export function groups(rows){const m=new Map();for(const r of rows){if(!m.has(r.case_id))m.set(r.case_id,[]);m.get(r.case_id).push(r);}return [...m.values()].map(a=>a.sort((x,y)=>x.seq-y.seq)).sort((a,b)=>String(b[0].created_at).localeCompare(String(a[0].created_at)));}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountDiscipline(host,ctx,staff,self=false){
 const client=ctx.client,me=ctx.profile||{},role=self?'staff':'owner';
 if(!staff?.id||(!self&&me.role!=='owner')||(self&&me.id!==staff.id)){host.textContent='Akses tidak dibenarkan.';return;}
 let cases=[],busy=false,message='',loaded=false;
 const render=()=>{if(!host.isConnected)return;host.innerHTML=`<div class="sec"><div class="row"><h4 class="grow">Pengurusan kes & penambahbaikan</h4><button class="btn sm" data-reload ${busy?'disabled':''}>Muat semula</button></div><p class="note">Semua catatan dalam modul ini boleh dilihat pekerja berkenaan. Jangan masukkan maklumat sulit pihak ketiga. Tiada tindakan gaji automatik.</p><p class="note" role="status">${esc(message)}</p>${!loaded?'':`${!self&&me.id!==staff.id?form([],null):''}${cases.map(h=>`<details><summary>${esc(h[0].case_id.slice(0,8))} · ${esc(labels[h.at(-1).kind])}</summary>${h.map(e=>`<div class="sec"><b>${esc(labels[e.kind])}</b><p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(e.body)}</p><small>${esc(e.created_at)}${e.response_due?' · Jawapan sebelum/hingga '+esc(e.response_due):''}</small></div>`).join('')}${form(h,h[0].case_id)}</details>`).join('')||'<p class="note">Tiada kes.</p>'}`}</div>`;host.querySelector('[data-reload]').onclick=load;host.querySelectorAll('form').forEach(f=>f.onsubmit=async ev=>{ev.preventDefault();if(busy)return;const fd=new FormData(f),id=f.dataset.case||crypto.randomUUID(),h=cases.find(x=>x[0].case_id===id)||[];try{const p=makeEvent({staffId:staff.id,caseId:id,history:h,kind:fd.get('kind'),body:fd.get('body'),due:fd.get('due'),role});if(!confirm('Terbitkan catatan ini? Rekod tidak boleh dipadam melalui aplikasi.'))return;busy=true;f.querySelector('button').disabled=true;const {error}=await client.from('hr_discipline_events').insert(p);if(error)throw error;message='Catatan disimpan.';await load();}catch(e){message=e.message||String(e);busy=false;render();}});};
 function form(h,id){const a=allowed(h,role);if(!a.length)return '';return `<form data-case="${esc(id||'')}" class="sec"><label>Tindakan<select class="field" name="kind">${a.map(k=>`<option value="${k}">${esc(labels[k])}</option>`).join('')}</select></label>${!id?'<label>Tarikh akhir jawapan<input type="date" class="field" name="due" required></label>':''}<label>Butiran / alasan dan bukti berkaitan<textarea class="field" name="body" minlength="10" maxlength="10000" required></textarea></label><button class="btn sm pri" ${busy?'disabled':''}>Terbitkan catatan</button></form>`;}
 async function load(){busy=true;render();try{const {data,error}=await client.from('hr_discipline_events').select('case_id,staff_id,seq,kind,body,response_due,created_at').eq('staff_id',staff.id).order('created_at',{ascending:false}).limit(501);if(error)throw error;if((data||[]).length>500)throw Error('Terlalu banyak rekod. Penapisan/paginasi diperlukan sebelum boleh memaparkan sejarah lengkap.');cases=groups(data||[]);loaded=true;}catch(e){message=e.message||String(e);loaded=false;}finally{busy=false;render();}}
 load();
}
