// V83 admin navigation: grouped desktop menu + accessible mobile all-menu drawer.
// Reuses existing data-cloud-page buttons, role visibility, and click handlers.
const GROUPS=[
 {label:'Utama',pages:['dashboard','inventory','sales','customers','reports']},
 {label:'Operasi',pages:['pemeriksaan','puspakom','runner','suppliers']},
 {label:'Sokongan',pages:['applications','sewa','kehadiran']},
 {label:'Akaun',pages:['profil','settings']}
];
const LABELS={dashboard:'Dashboard',inventory:'Inventori Kenderaan',sales:'Jualan Kereta',customers:'Pelanggan',reports:'Laporan Jualan',pemeriksaan:'Pemeriksaan',puspakom:'Puspakom',runner:'Runner',suppliers:'Pembekal',applications:'Permohonan',sewa:'Sewa Kereta',kehadiran:'Kehadiran',profil:'Profil Saya',settings:'Tetapan'};
const ICONS={dashboard:'⌂',inventory:'▤',sales:'▣',customers:'♙',reports:'▥',pemeriksaan:'◎',puspakom:'✓',runner:'⛟',suppliers:'▣',applications:'✎',sewa:'⚿',kehadiran:'⏱',profil:'☺',settings:'⚙'};
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
   btn.type='button';btn.setAttribute('aria-label',LABELS[page]||page);
   btn.classList.add('ada-admin-nav-link');
   btn.textContent=LABELS[page]||page;
   btn.insertAdjacentHTML('afterbegin','<span class="ada-admin-nav-icon" aria-hidden="true">'+ICONS[page]+'</span>');
   section.append(btn);
  }
  grouped.push(section);
 }
 for(const section of grouped)aside.append(section);
 const overlay=document.createElement('div');
 overlay.className='ada-admin-menu-overlay';
 overlay.hidden=true;
 overlay.innerHTML='<div class="ada-admin-menu-backdrop" data-close-menu></div><div class="ada-admin-menu-drawer" role="dialog" aria-modal="true" aria-label="Semua Menu"><div class="ada-admin-menu-head"><div><small>ABE DIN AUTO</small><h2>Semua Menu</h2></div><button type="button" class="ada-admin-menu-close" data-close-menu aria-label="Tutup menu">✕</button></div><div class="ada-admin-menu-list"></div></div>';
 document.body.append(overlay);
 const list=overlay.querySelector('.ada-admin-menu-list');
 let lastFocus=null;
 function refresh(){
  for(const section of grouped){
   section.hidden=![...section.querySelectorAll('button[data-cloud-page]')].some(b=>!b.hidden);
  }
  // Staff gets a usable set of shortcuts selected from pages that role can actually access.
  const isStaff=panel.dataset.userRole&&panel.dataset.userRole!=='owner';
  const candidate=isStaff
   ?['dashboard','inventory','pemeriksaan','puspakom','sales','applications','sewa','kehadiran','reports','profil']
   :['dashboard','inventory','sales','reports'];
  const allowed=candidate.filter(page=>byPage.get(page)&&!byPage.get(page).hidden).slice(0,4);
  const bottom=panel.querySelector('.cloud-bottom'),moreBtn=bottom?.querySelector('#ada-admin-more');
  if(bottom&&moreBtn){
   for(const b of [...bottom.querySelectorAll('button[data-cloud-page]')])b.remove();
   for(const page of allowed){
    const button=document.createElement('button');button.type='button';button.dataset.cloudPage=page;
    const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=ICONS[page]||'•';
    const label=document.createElement('small');
    label.textContent=page==='dashboard'&&isStaff?'Katalog Umum':(LABELS[page]||page).replace(' Kenderaan','').replace(' Kereta','').replace(' Jualan','');
    button.append(icon,label);
    button.classList.toggle('active',byPage.get(page).classList.contains('active'));
    button.addEventListener('click',()=>{byPage.get(page)?.click()});
    bottom.insertBefore(button,moreBtn);
   }
  }
  if(!overlay.hidden)populate();
 }
 function populate(){
  list.replaceChildren();
  for(const g of GROUPS){
   const visible=g.pages.map(page=>byPage.get(page)).filter(b=>b&&!b.hidden);
   if(!visible.length)continue;
   const section=document.createElement('section');section.className='ada-admin-menu-section';
   const h=document.createElement('h3');h.textContent=g.label;section.append(h);
   for(const source of visible){
    const page=source.dataset.cloudPage;
    const b=document.createElement('button');b.type='button';b.className='ada-admin-drawer-link'+(source.classList.contains('active')?' is-active':'');
    const glyph=document.createElement('span');glyph.setAttribute('aria-hidden','true');glyph.textContent=ICONS[page]||'•';
    const label=document.createElement('span');label.textContent=LABELS[page]||page;
    b.append(glyph,label);
    b.addEventListener('click',()=>{close();source.click()});
    section.append(b);
   }
   list.append(section);
  }
 }
 function open(){
  refresh();populate();
  lastFocus=document.activeElement;
  overlay.hidden=false;
  more.setAttribute('aria-expanded','true');
  document.body.classList.add('ada-admin-menu-open');
  overlay.querySelector('.ada-admin-menu-close').focus();
 }
 function close(){
  if(overlay.hidden)return;
  overlay.hidden=true;
  document.body.classList.remove('ada-admin-menu-open');
  more.setAttribute('aria-expanded','false');
  if(lastFocus?.isConnected)lastFocus.focus();
 }
 more.addEventListener('click',()=>overlay.hidden?open():close());
 overlay.addEventListener('click',e=>{if(e.target.closest('[data-close-menu]'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();close()}});
 panel.querySelectorAll('[data-cloud-page]').forEach(b=>b.addEventListener('click',()=>{if(!overlay.hidden)close()}));
 window.adaAdminMenuRefresh=refresh;
 // Active shortcut must follow page transitions, even after dynamic shortcut creation.
 const navObserver=new MutationObserver(()=>{for(const b of panel.querySelectorAll('.cloud-bottom button[data-cloud-page]'))b.classList.toggle('active',byPage.get(b.dataset.cloudPage)?.classList.contains('active')||false)});
 navObserver.observe(aside,{subtree:true,attributes:true,attributeFilter:['class']});
 refresh();
}
