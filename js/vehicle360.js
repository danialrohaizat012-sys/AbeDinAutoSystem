// V83 Vehicle 360: presentation-only enhancement of the existing inventory profile.
// No extra database queries, writes, or changes to the vehicle-sale workflow.
let selectedVehicle=null;
let activeTab='overview';

const fmtMoney=n=>'RM '+Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=v=>{
  if(!v)return '';
  const d=new Date(v);
  return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('ms-MY',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'short',day:'2-digit'}).format(d);
};
const newEl=(tag,className,html)=>{
  const el=document.createElement(tag);
  el.className=className;
  if(html!==undefined)el.innerHTML=html;
  return el;
};
function findSale(sales,id){
  return (sales||[]).filter(s=>s.vehicle_id===id&&!['cancelled','canceled','void','refunded'].includes(String(s.status||'').toLowerCase()))
    .sort((a,b)=>String(b.sold_at||b.created_at||'').localeCompare(String(a.sold_at||a.created_at||'')))[0]||null;
}
function buildHistory(vehicle,inspections,sale){
  const events=[];
  if(vehicle.created_at)events.push({date:vehicle.created_at,description:'Kereta didaftarkan dalam inventori'});
  const inspection=(inspections||[]).filter(i=>i.vehicle_id===vehicle.id).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0];
  if(inspection?.created_at)events.push({date:inspection.created_at,description:'Pemeriksaan direkod ('+String(inspection.status||'belum selesai')+')'});
  if(sale?.created_at)events.push({date:sale.created_at,description:'Transaksi jualan direkod'});
  if(sale?.sold_at)events.push({date:sale.sold_at,description:'Jualan selesai'});
  return events.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
export function mountVehicle360(root,{vehicle,role,sales=[],customers=[],payments=[],inspections=[],inspectionCosts={}}={}){
  if(!root||!vehicle)return;
  const grid=root.querySelector('.ada-vp-grid');
  const hero=root.querySelector('.ada-vp-hero');
  if(!grid||!hero||root.querySelector('.ada-v360-tabs'))return;
  if(selectedVehicle!==vehicle.id){selectedVehicle=vehicle.id;activeTab='overview';}
  const main=grid.firstElementChild,aside=grid.querySelector('aside');
  if(!main||!aside)return;
  const panes={overview:[],operations:[],sales:[],finance:[],history:[]};
  for(const section of [...main.querySelectorAll(':scope > .ada-vp-panel')]){
    const title=section.querySelector('h3')?.textContent?.toLowerCase()||'';
    if(section.classList.contains('ada-fin-trail'))panes.finance.push(section);
    else if(section.classList.contains('ada-vp-pk'))panes.operations.push(section);
    else if(title.includes('sales')||title.includes('payment'))panes.sales.push(section);
    else panes.overview.push(section);
  }
  panes.overview.push(aside);
  const sale=findSale(sales,vehicle.id);
  const history=buildHistory(vehicle,inspections,sale);
  const historyPanel=newEl('section','ada-vp-panel ada-v360-history-panel',
    '<h3>Sejarah Kenderaan</h3><p class="muted">Rekod aktiviti utama yang tersedia dalam sistem.</p>'+
    (history.length?'<ol class="ada-v360-history">'+history.map(e=>
      '<li><time>'+escapeText(fmtDate(e.date))+'</time><span>'+escapeText(e.description)+'</span></li>').join('')+'</ol>':
      '<p class="muted">Belum ada aktiviti bertarikh yang direkod.</p>'));
  main.append(historyPanel);
  panes.history.push(historyPanel);
  const isOwner=role==='owner';
  const isOperations=role==='operations';
  const tabs=[
    ['overview','Ringkasan'],['operations','Operasi'],
    ...(!isOperations&&panes.sales.length?[['sales','Jualan']]:[]),
    ...(isOwner&&panes.finance.length?[['finance','Kewangan']]:[]),
    ['history','Sejarah']
  ];
  const allowed=new Set(tabs.map(t=>t[0]));
  if(!allowed.has(activeTab))activeTab='overview';
  const heading=newEl('div','ada-v360-heading',
    '<span>INVENTORI / PROFIL KENDERAAN</span><h2>Vehicle 360°</h2>'+
    '<p>Maklumat kenderaan, operasi dan jualan di satu tempat.</p>');
  hero.before(heading);
  if(isOwner){
    const purchase=Number(vehicle.purchase_cost||0);
    const repairs=Number(inspectionCosts[vehicle.id]?.kos||0);
    const extra=Number(vehicle.cost_transfer||0)+Number(vehicle.cost_puspakom||0)+Number(vehicle.cost_transport||0);
    const completed=String(sale?.status||'').toLowerCase()==='sold';
    const paidAll=(payments||[]).filter(p=>p.sale_id===sale?.id).reduce((t,p)=>t+Number(p.amount||0),0);
    const revenue=completed?(paidAll>0?paidAll:Number(sale.agreed_price||0)):Number(vehicle.asking_price||0);
    const margin=revenue-purchase-repairs-extra;
    const complete=purchase>0&&revenue>0;
    const card=(label,value)=>'<div class="ada-v360-kpi"><small>'+label+'</small><strong>'+value+'</strong></div>';
    const cards=newEl('div','ada-v360-kpis',
      card(vehicle.acquisition_type==='consignment'?'Bayaran Kepada Tuan':'Modal Belian',fmtMoney(purchase))+
      card('Kos Tambahan Direkod',fmtMoney(repairs+extra))+
      card(completed?'Harga Dijual':'Harga Jual Sasaran',fmtMoney(revenue))+
      card(completed?'Margin Kasar Anggaran':'Potensi Margin Kasar',complete?fmtMoney(margin):'Belum lengkap'));
    hero.after(cards);
    cards.after(newEl('p','ada-v360-disclaimer',
      'Anggaran berdasarkan kos yang direkod. Tidak semestinya termasuk komisen, kos operasi atau cukai. Ini bukan keuntungan bersih.'));
  }
  const nav=newEl('nav','ada-v360-tabs');
  nav.setAttribute('role','tablist');
  nav.setAttribute('aria-label','Bahagian Vehicle 360');
  grid.before(nav);
  const buttons=[];
  for(const [id,label] of tabs){
    const btn=newEl('button','ada-v360-tab',escapeText(label));
    btn.type='button';
    btn.setAttribute('role','tab');
    btn.dataset.tab=id;
    nav.append(btn);
    buttons.push(btn);
    btn.addEventListener('click',()=>{activeTab=id;show(id);});
  }
  for(const [name,items] of Object.entries(panes))for(const node of items)node.dataset.v360Pane=name;
  function show(id){
    if(!allowed.has(id))id='overview';
    activeTab=id;
    for(const [name,items] of Object.entries(panes))for(const node of items)node.hidden=(name!==id);
    grid.classList.toggle('ada-v360-single',id!=='overview');
    for(const btn of buttons){
      const chosen=btn.dataset.tab===id;
      btn.classList.toggle('is-active',chosen);
      btn.setAttribute('aria-selected',String(chosen));
      btn.tabIndex=chosen?0:-1;
    }
  }
  show(activeTab);
}
