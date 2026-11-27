// HR dashboard read-only. Dates and counts are Malaysia-local; no payroll mutation.
const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const localDay = (now = new Date()) => new Date(now.getTime()+8*3600000).toISOString().slice(0,10);
export function period(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Bulan tidak sah');
  const [y,m]=month.split('-').map(Number); if(y<2000||y>2099) throw new Error('Tahun tidak sah');
  const next=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
  return {start:month+'-01',end:next,from:month+'-01T00:00:00+08:00',to:next+'T00:00:00+08:00'};
}
export const dayEnd = d => new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10);
export const sources = (month, today) => {const p=period(month); return {
  sales:['sales','id,advisor_id','id',[['eq','status','sold'],['gte','sold_at',p.from],['lt','sold_at',p.to]]],
  inspections:['inspections','id,inspected_by','id',[['eq','status','completed'],['gte','completed_at',p.from],['lt','completed_at',p.to]]],
  runner:['runner_trips','id,assigned_to','id',[['gte','trip_date',p.start],['lt','trip_date',p.end]]],
  followups:['tiktok_lead_followups','id,created_by','id',[['gte','created_at',p.from],['lt','created_at',p.to]]],
  punches:['attendance_punches','id,staff_id','id',[['eq','kind','in'],['gte','punched_at',today+'T00:00:00+08:00'],['lt','punched_at',dayEnd(today)+'T00:00:00+08:00']]],
  contracts:['staff_hr','staff_id,contract_end','staff_id',[['gte','contract_end',today],['lte','contract_end',new Date(Date.parse(today+'T00:00:00Z')+30*86400000).toISOString().slice(0,10)]]]
};};
export async function readAll(client, spec, pageSize=200, max=10000) {
  const [table,cols,key,filters]=spec; const rows=[]; const ids=new Set();
  for(let offset=0;offset<max;offset+=pageSize){let q=client.from(table).select(cols); for(const [op,k,v] of filters) q=q[op](k,v); const {data,error}=await q.order(key,{ascending:true}).range(offset,offset+pageSize-1);
    if(error)throw new Error(error.message||'Bacaan gagal'); if(!Array.isArray(data))throw new Error('Respons tidak sah');
    for(const r of data){if(r[key]==null||ids.has(r[key]))throw new Error('Rekod berubah semasa bacaan; muat semula');ids.add(r[key]);rows.push(r);}
    if(data.length<pageSize)return rows;
  } throw new Error('Had bacaan dicapai; kecilkan tempoh atau gunakan agregat pelayan');
}
export async function loadDashboard(client, profile, month, today=localDay()) {
  if(profile?.role!=='owner')throw new Error('Akses Owner diperlukan');
  const entries=await Promise.all(Object.entries(sources(month,today)).map(async ([k,s])=>{try{return [k,{rows:await readAll(client,s)}]}catch(e){return [k,{error:e.message}]}}));
  return {...Object.fromEntries(entries), tasks:{error:"Polisi RLS hanya membenarkan tugasan sendiri; KPI pasukan belum tersedia"}};
}
const fields={sales:'advisor_id',inspections:'inspected_by',runner:'assigned_to',followups:'created_by',tasks:'staff_id'};
export function summarize(data, staff) {
  const active=(staff||[]).filter(s=>s.enabled===true); const ids=new Set(active.map(s=>s.id));
  const counts={};const unknown={};for(const [k,field] of Object.entries(fields)){const rows=data[k]?.rows; if(!rows){counts[k]=null;unknown[k]=null;continue;}const m=new Map();let u=0;for(const row of rows){const id=row[field];if(!ids.has(id)){u++;continue;}m.set(id,(m.get(id)||0)+1);}counts[k]=m;unknown[k]=u;}
  return {active:active.length,punched:data.punches?.rows?new Set(data.punches.rows.map(r=>r.staff_id).filter(id=>ids.has(id))).size:null,contracts:data.contracts?.rows?new Set(data.contracts.rows.map(r=>r.staff_id).filter(id=>ids.has(id))).size:null,unknown,staff:active.map(s=>({name:s.full_name,role:s.role,...Object.fromEntries(Object.keys(fields).map(k=>[k,counts[k]===null?null:counts[k].get(s.id)||0]))}))};
}
const labels={sales:'Jualan selesai',inspections:'Pemeriksaan selesai',runner:'Trip ditugaskan',followups:'Catatan follow-up',tasks:'Tugasan selesai'};
export function renderDashboard(data,staff,month,today){const s=summarize(data,staff);const n=x=>x==null?'Tidak tersedia':String(x);const missing=Object.keys(data).filter(k=>data[k].error);return `<div class="sec"><div class="stats"><div class="stat"><small>Staf aktif</small><b>${s.active}</b></div><div class="stat"><small>Punch masuk hari ini</small><b>${n(s.punched)}</b></div><div class="stat"><small>Kontrak tamat ≤30 hari</small><b>${n(s.contracts)}</b></div></div><p class="mute">KPI ${esc(month)} · Kehadiran ${esc(today)}. Punch masuk bukan status hadir semasa. Trip mengikut tarikh tugasan, bukan pengesahan selesai.</p>${missing.length?'<p class="msg err">Sebahagian sumber tidak tersedia: '+missing.map(esc).join(', ')+'. Tiada nilai 0 diandaikan.</p>':''}<div class="tw" style="overflow:auto"><table><thead><tr><th>Staf aktif</th>${Object.values(labels).map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${s.staff.map(r=>'<tr><td>'+esc(r.name)+'</td>'+Object.keys(labels).map(k=>'<td>'+n(r[k])+'</td>').join('')+'</tr>').join('')}<tr><th>Tiada ID staf aktif / tidak diatribusi</th>${Object.keys(labels).map(k=>'<td>'+n(s.unknown[k])+'</td>').join('')}</tr></tbody></table></div><p class="mute">Kiraan aktiviti sahaja. Tiada skor, ranking, sasaran automatik atau kesan kepada gaji.</p></div>`;}
// Lazy: only load when owner clicks refresh. No polling or sensitive columns.
export function mountHRDashboard(el,ctx,staff){if(ctx.profile?.role!=='owner'){el.hidden=true;return;}const today=localDay();el.innerHTML=`<div class="sec"><div class="row"><h4 class="grow">Ringkasan HR & KPI</h4><input type="month" class="field" aria-label="Bulan KPI" value="${today.slice(0,7)}" min="2000-01" max="${today.slice(0,7)}" style="max-width:155px"><button type="button" class="btn sm" data-hr-refresh>Muat KPI</button></div><div data-hr-results aria-live="polite"><p class="mute">Muat secara manual untuk jimat penggunaan data.</p></div></div>`;const button=el.querySelector('button'), input=el.querySelector('input'),out=el.querySelector('[data-hr-results]');button.onclick=async()=>{const month=input.value;if(!month||month>today.slice(0,7)){out.textContent='Pilih bulan yang sah.';return;}button.disabled=true;input.disabled=true;out.textContent='Memuatkan KPI…';try{const data=await loadDashboard(ctx.client,ctx.profile,month,today);if(el.isConnected)out.innerHTML=renderDashboard(data,staff,month,today);}catch(e){out.textContent=e.message;}finally{button.disabled=false;input.disabled=false;}};}
