import {templates,esc} from './hr-letters.mjs?v=1';
const e=esc;
const statuses={pending:'Menunggu Owner',approved:'Diluluskan',rejected:'Ditolak'};
const kinds={letter:'Draf surat',discipline:'Cadangan notis disiplin'};
const safeDate=d=>d?new Date(d).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}):'–';
const listFields='id,requester,staff_id,category,payload,state,created_at,decided_at,decision_note,result_id';
export async function hrAccess(client,uid){
 if(!uid)return false;
 const {data,error}=await client.from('hr_delegate_access').select('enabled').eq('staff_id',uid).maybeSingle();
 return !error&&data?.enabled===true;
}
const check=r=>{if(r.error)throw r.error;return r.data;};
function detail(r){
 const p=r.payload||{};
 return '<div class="note" style="margin-top:6px">'+e(r.category==='letter'?(templates[p.kind]?.[0]||p.kind):'Cadangan notis')+' · '+e(p.effective_date||p.response_due||'–')+'</div><p style="white-space:pre-wrap;overflow-wrap:anywhere"><b>'+e(p.subject||'')+'</b></p><div style="white-space:pre-wrap;overflow-wrap:anywhere">'+e(p.body||'')+'</div>'+(p.reason?'<p class="note">Sebab: '+e(p.reason)+'</p>':'');
}
export function mountHROwnerAccess(host,ctx,staff){
 if(ctx.profile?.role!=='owner'){host.textContent='Akses Owner diperlukan.';return;}
 const client=ctx.client,names=new Map((staff||[]).map(p=>[p.id,p.full_name||'Staf']));
 let busy=false,access=[],requests=[],message='',ready=false;
 host.innerHTML='<div class="sec"><h4>Akses HR khas</h4><p class="note">Peranan asal staf tidak berubah. Owner sahaja boleh beri atau tarik akses dan lulus permohonan.</p><button type="button" class="btn sm" data-refresh>Muat semula</button><p role="status" data-msg></p><div data-access></div><div data-requests></div></div>';
 const $=s=>host.querySelector(s),say=s=>{message=s;$('[data-msg]').textContent=s;};
 function render(){
  if(!host.isConnected)return;
  $('[data-msg]').textContent=message;
  $('[data-refresh]').disabled=busy;
  const rows=(staff||[]).filter(p=>p.role!=='owner');
  $('[data-access]').innerHTML=ready?rows.map(p=>{const on=access.some(a=>a.staff_id===p.id&&a.enabled);return '<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)"><div class="grow"><b>'+e(p.full_name||'Staf')+'</b><div class="note">'+(on?'Akses HR aktif':'Akses HR tidak aktif')+(p.enabled?'':' · Akaun tidak aktif')+'</div></div><button type="button" role="switch" aria-checked="'+on+'" aria-label="Akses HR '+e(p.full_name||'Staf')+'" data-toggle="'+e(p.id)+'" class="btn sm '+(on?'pri':'')+'" style="min-width:64px" '+(busy||(!on&&!p.enabled)?'disabled':'')+'>'+ (on?'ON':'OFF')+'</button></div>';}).join('')||'<p class="note">Tiada staf.</p>':'<p class="note">Akses belum dimuatkan.</p>';
  $('[data-requests]').innerHTML=ready?'<h4 style="margin-top:16px">Permohonan HR · '+requests.filter(r=>r.state==='pending').length+' menunggu</h4>'+requests.map((r,i)=>'<details style="margin:8px 0;padding:8px;border:1px solid var(--line);border-radius:8px"><summary><b>'+e(kinds[r.category]||r.category)+'</b> · '+e(names.get(r.staff_id)||'Staf')+' · '+e(statuses[r.state]||r.state)+'</summary><p class="note">Disediakan oleh '+e(names.get(r.requester)||'Staf')+' · '+e(safeDate(r.created_at))+'</p>'+detail(r)+(r.state==='pending'?'<p class="note">'+(r.category==='letter'?'Lulus akan cipta draf di profil staf; terbitkan secara berasingan.':'Lulus akan terbitkan notis kepada pekerja.')+'</p><form data-decide="'+i+'"><label>Nota keputusan<input class="field" name="note" required maxlength="1000"></label><div class="row"><button type="submit" class="btn sm pri" value="approve" '+(busy?'disabled':'')+'>Lulus</button><button type="submit" class="btn sm" value="reject" '+(busy?'disabled':'')+'>Tolak</button></div></form>':'<p class="note">'+e(r.decision_note||'')+'</p>')+'</details>').join(''):'';
  host.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{if(busy)return;const id=b.dataset.toggle,on=b.getAttribute('aria-checked')==='true';if(!confirm((on?'Tarik balik':'Aktifkan')+' akses HR untuk '+(names.get(id)||'staf')+'?'))return;busy=true;render();try{check(await client.rpc('hr_set_delegate',{p_staff:id,p_enabled:!on}));message='Akses HR dikemas kini.';await load();}catch(err){busy=false;say(err.message||String(err));render();}});
  host.querySelectorAll('[data-decide]').forEach(f=>f.onsubmit=async ev=>{ev.preventDefault();if(busy)return;const r=requests[Number(f.dataset.decide)],approve=ev.submitter?.value==='approve';const note=new FormData(f).get('note');if(!r||!String(note||'').trim()||!confirm(approve?'Lulus permohonan HR ini?':'Tolak permohonan ini?'))return;busy=true;render();try{check(await client.rpc('hr_delegate_decide',{p_request:r.id,p_approve:approve,p_note:note}));message=approve?'Permohonan diluluskan.':'Permohonan ditolak.';await load();}catch(err){busy=false;say(err.message||String(err));render();}});
 }
 async function load(){busy=true;ready=false;render();try{const r=await Promise.all([client.from('hr_delegate_access').select('staff_id,enabled,revision'),client.from('hr_delegate_requests').select(listFields).order('created_at',{ascending:false}).limit(100)]);access=check(r[0])||[];requests=check(r[1])||[];ready=true;}catch(err){message=err.message||String(err);}finally{busy=false;render();}}
 $('[data-refresh]').onclick=load;load();
}
export function mountHRDelegate(host,ctx){
 const client=ctx.client,uid=ctx.profile?.id;
 let busy=false,people=[],requests=[],ready=false,allowed=false,msg='';
 host.innerHTML='<div class="sec"><h4>Pengurusan HR khas</h4><p class="note">Sediakan draf untuk semakan Owner. Tiada surat atau notis diterbitkan tanpa kelulusan.</p><button type="button" class="btn sm" data-refresh>Muat semula</button><p role="status" data-msg></p><div data-content></div></div>';
 const $=s=>host.querySelector(s);
 function render(){
 if(!host.isConnected)return;
 $('[data-msg]').textContent=msg;$('[data-refresh]').disabled=busy;
 if(!ready||!allowed){$('[data-content]').textContent=ready?'Akses HR tidak aktif. Hubungi Owner.':'Memuatkan akses…';return;}
 const name=id=>people.find(p=>p.id===id)?.full_name||'Staf';
 $('[data-content]').innerHTML='<form data-new><label>Staf penerima<select class="field" name="staff" required><option value="">Pilih staf</option>'+people.map(p=>'<option value="'+e(p.id)+'">'+e(p.full_name)+'</option>').join('')+'</select></label><label>Jenis permohonan<select class="field" name="category"><option value="letter">Draf surat HR</option><option value="discipline">Cadangan notis disiplin</option></select></label><div data-letter><label>Jenis surat<select class="field" name="kind">'+Object.entries(templates).map(([k,t])=>'<option value="'+e(k)+'">'+e(t[0])+'</option>').join('')+'</select></label><label>Subjek<input class="field" name="subject" maxlength="200" required></label><label>Tarikh kuat kuasa<input type="date" class="field" name="effective_date"></label><label>Sebab<input class="field" name="reason" maxlength="1000" required></label></div><div data-discipline hidden><label>Tarikh akhir jawapan<input type="date" class="field" name="response_due" disabled></label></div><label>Kandungan / butiran<textarea class="field" name="body" rows="6" required maxlength="20000"></textarea></label><button class="btn pri" type="submit" '+(busy?'disabled':'')+'>Hantar kepada Owner</button></form><h4 style="margin-top:16px">Permohonan saya</h4>'+requests.map(r=>'<details style="margin:8px 0;padding:8px;border:1px solid var(--line);border-radius:8px"><summary>'+e(kinds[r.category]||r.category)+' · '+e(name(r.staff_id))+' · '+e(statuses[r.state]||r.state)+'</summary>'+detail(r)+'<p class="note">'+e(r.decision_note||'')+'</p></details>').join('');
 const f=$('[data-new]'),kind=f.elements.kind,category=f.elements.category,body=f.elements.body;
 function template(){if(category.value==='letter'){f.elements.subject.value=templates[kind.value][0];body.value=templates[kind.value][1];}}
 function mode(){const d=category.value==='discipline';$('[data-letter]').hidden=d;$('[data-discipline]').hidden=!d;for(const x of $('[data-letter]').querySelectorAll('input,select'))x.disabled=d;f.elements.response_due.disabled=!d;f.elements.response_due.required=d;body.maxLength=d?10000:20000;body.minLength=d?10:1;body.value='';if(!d)template();}
 category.onchange=mode;kind.onchange=template;mode();
 f.onsubmit=async ev=>{ev.preventDefault();if(busy)return;const fd=new FormData(f),cat=fd.get('category');const payload=cat==='letter'?{kind:fd.get('kind'),subject:fd.get('subject'),body:fd.get('body'),reason:fd.get('reason'),effective_date:fd.get('effective_date')||null}:{body:fd.get('body'),response_due:fd.get('response_due')};if(!confirm('Hantar cadangan kepada Owner?'))return;busy=true;f.querySelector('button[type=submit]').disabled=true;try{check(await client.rpc('hr_delegate_submit',{p_staff:fd.get('staff'),p_category:cat,p_payload:payload}));msg='Permohonan dihantar kepada Owner.';await load();}catch(err){busy=false;$('[data-msg]').textContent=err.message||String(err);f.querySelector('button[type=submit]').disabled=false;}};
 }
 async function load(){busy=true;ready=false;allowed=false;people=[];requests=[];render();try{allowed=await hrAccess(client,uid);if(allowed){const r=await Promise.all([client.rpc('hr_delegate_directory'),client.from('hr_delegate_requests').select(listFields).eq('requester',uid).order('created_at',{ascending:false}).limit(100)]);people=check(r[0])||[];requests=check(r[1])||[];}ready=true;}catch(err){msg=err.message||String(err);allowed=false;ready=true;}finally{busy=false;render();}}
 $('[data-refresh]').onclick=load;load();
}
