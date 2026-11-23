// V83.6: Native mobile <details> menu. Works without this module loading.
// This module enhances desktop grouping and staff shortcuts, preserving the native fallback.
const GROUPS=[
 {label:'Utama',pages:['dashboard','inventory','sales','customers','reports','promosi']},
 {label:'Operasi',pages:['pemeriksaan','puspakom','runner','belanja','suppliers']},
 {label:'Sokongan',pages:['applications','agents','sewa','kehadiran','staf']},
 {label:'Akaun',pages:['profil','settings']}
];
const LABELS={dashboard:'Dashboard',inventory:'Inventori Kenderaan',sales:'Jualan Kereta',customers:'Pelanggan',reports:'Laporan Jualan',promosi:'Promosi Katalog',pemeriksaan:'Pemeriksaan',puspakom:'Puspakom',runner:'Runner',belanja:'Perbelanjaan',suppliers:'Pembekal',applications:'Permohonan',agents:'Pengurusan Ejen',sewa:'Sewa Kereta',kehadiran:'Kehadiran',staf:'Staf',profil:'Profil Saya',settings:'Tetapan'};
const ICONS={dashboard:'⌂',inventory:'▤',sales:'▣',customers:'♙',reports:'▥',promosi:'📣',pemeriksaan:'◎',puspakom:'✓',runner:'⛟',belanja:'🧾',suppliers:'▣',applications:'✎',agents:'♧',sewa:'⚿',kehadiran:'⏱',staf:'👥',profil:'☺',settings:'⚙'};
export function mountAdminMenu(){
 const panel=document.getElementById('ada-cloud-panel');
 const aside=panel?.querySelector('.cloud-side'),more=document.getElementById('ada-admin-more');
 if(!panel||!aside||!more||aside.dataset.adminMenuReady)return;
 aside.dataset.adminMenuReady='1';
 aside.setAttribute('aria-label','Menu pengurusan');
 const original=[...aside.querySelectorAll('button[data-cloud-page]')];
 const byPage=new Map(original.map(b=>[b.dataset.cloudPage,b]));
 const grouped=[];
 for(const g of GROUPS){
  const section=document.createElement('section');
  section.className='ada-admin-nav-group';
  section.dataset.navGroup=g.label.toLowerCase();
  const heading=document.createElement('h3');heading.textContent=g.label;section.append(heading);
  for(const page of g.pages){
   const btn=byPage.get(page);
   if(!btn)continue;
   btn.type='button';
   btn.setAttribute('aria-label',LABELS[page]||page);
   btn.classList.add('ada-admin-nav-link');
   btn.textContent=LABELS[page]||page;
   const icon=document.createElement('span');
   icon.className='ada-admin-nav-icon';icon.setAttribute('aria-hidden','true');
   icon.textContent=ICONS[page]||'•';
   btn.prepend(icon);
   section.append(btn);
  }
  grouped.push(section);
 }
 for(const section of grouped)aside.append(section);
 const bottom=panel.querySelector('.cloud-bottom');
 const mobileList=more.querySelector('.ada-native-menu-list');
 const staticSections=[...(mobileList?.querySelectorAll('.ada-native-menu-section')||[])];
 function navigate(page){
  const source=byPage.get(page);
  if(!source||source.hidden)return false;
  if(typeof window.adaCloudNavigate==='function')return window.adaCloudNavigate(page)===true;
  source.click();return true;
 }
 function close(){
  if(more.open)more.open=false;
  document.body.classList.remove('ada-admin-menu-open');
 }
 function refresh(){
  const isStaff=!!panel.dataset.userRole&&panel.dataset.userRole!=='owner';
  const dashboardLink=byPage.get('dashboard');
  if(dashboardLink){
   const label=isStaff?'Katalog Umum':'Dashboard';
   const textNode=[...dashboardLink.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
   if(textNode)textNode.textContent=label;
   dashboardLink.setAttribute('aria-label',label);
  }
  for(const section of grouped) section.hidden=![...section.querySelectorAll('button[data-cloud-page]')].some(b=>!b.hidden);
  // Native menu remains in HTML and works even if JavaScript imports fail.
  for(const btn of mobileList?.querySelectorAll('button[data-cloud-page]')||[]){
   const source=byPage.get(btn.dataset.cloudPage);
   btn.hidden=!source||source.hidden;
   if(btn.dataset.cloudPage==='dashboard')btn.textContent=isStaff?'Katalog Umum':'Dashboard';
  }
  for(const section of staticSections)section.hidden=![...section.querySelectorAll('button[data-cloud-page]')].some(b=>!b.hidden);
  const candidate=isStaff
   ?['kehadiran','inventory','belanja','pemeriksaan','puspakom','sales','applications','sewa','reports','profil','dashboard']
   :['dashboard','inventory','sales','reports'];
  const allowed=candidate.filter(page=>byPage.get(page)&&!byPage.get(page).hidden).slice(0,4);
  if(bottom){
   // Only replace direct quick links; do NOT remove nested menu items in <details>.
   for(const btn of [...bottom.querySelectorAll(':scope > button[data-cloud-page]')])btn.remove();
   for(const page of allowed){
    const button=document.createElement('button');button.type='button';button.dataset.cloudPage=page;
    const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=ICONS[page]||'•';
    const label=document.createElement('small');
    label.textContent=page==='dashboard'&&isStaff?'Katalog Umum':(LABELS[page]||page).replace(' Kenderaan','').replace(' Kereta','').replace(' Jualan','');
    button.append(icon,label);
    button.classList.toggle('active',byPage.get(page).classList.contains('active'));
    button.addEventListener('click',()=>{if(navigate(page))close()});
    bottom.insertBefore(button,more);
   }
  }
  if(more.open&&!mobileList?.querySelector('button[data-cloud-page]:not([hidden])'))close();
 }
 mobileList?.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-cloud-page]');
  if(!btn||btn.hidden)return;
  // The existing app.html click handler is already attached to these native buttons.
  close();
 });
 more.addEventListener('toggle',()=>document.body.classList.toggle('ada-admin-menu-open',more.open));
 document.addEventListener('click',e=>{if(more.open&&!more.contains(e.target))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&more.open){close();more.querySelector('summary')?.focus()}});
 window.adaAdminMenuRefresh=refresh;
 const navObserver=new MutationObserver(()=>{
  for(const btn of bottom?.querySelectorAll(':scope > button[data-cloud-page]')||[])
   btn.classList.toggle('active',byPage.get(btn.dataset.cloudPage)?.classList.contains('active')||false);
 });
 navObserver.observe(aside,{subtree:true,attributes:true,attributeFilter:['class']});
 refresh();
}
