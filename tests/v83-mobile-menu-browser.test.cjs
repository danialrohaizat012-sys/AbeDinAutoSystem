// Chromium mobile smoke test for native Semua Menu. Uses the real HTML/CSS/module.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const app=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/admin-menu.css'),'utf8');
const moduleSrc=fs.readFileSync(path.resolve(__dirname,'../js/admin-menu.js'),'utf8');
const nav=app.match(/<nav class="cloud-bottom"[^>]*>[\s\S]*?<\/nav>/)?.[0];
const aside=app.match(/<aside class="cloud-side">[\s\S]*?<\/aside>/)?.[0];
assert.ok(nav&&aside);
const baseCSS='body{margin:0;background:#0d1213;color:#fff;font-family:Arial,sans-serif}#ada-cloud-gate .cloud-bottom{display:none}#ada-cloud-panel{display:block}';
async function setup(page,enhanced){
 const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
 baseCSS+css+'</style></head><body><div id="ada-cloud-gate"><section id="ada-cloud-panel" data-user-role="owner">'+aside+nav+'</section></div></body></html>';
 await page.setContent(html);
 await page.evaluate(()=>{
   window.visited=[];
   window.adaCloudNavigate=page=>{window.visited.push(page);return true};
   document.querySelectorAll('button[data-cloud-page]').forEach(b=>b.addEventListener('click',()=>window.adaCloudNavigate(b.dataset.cloudPage)));
 });
 if(enhanced)await page.addScriptTag({type:'module',content:moduleSrc.replace(/^export /m,'')+'\nmountAdminMenu();'});
}
test('native Semua Menu opens on 375px iPhone without enhancer JavaScript',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  await setup(page,false);
  await page.locator('#ada-admin-more summary').tap();
  assert.equal(await page.locator('#ada-admin-more').evaluate(e=>e.open),true);
  assert.equal(await page.locator('.ada-native-menu-list').isVisible(),true);
  const bounds=await page.locator('.ada-native-menu-list').boundingBox();
  assert.ok(bounds&&bounds.width>200&&bounds.x>=0&&bounds.x+bounds.width<=377,'dropdown fits phone width');
  await page.locator('.ada-native-menu-list button[data-cloud-page="puspakom"]').tap();
  assert.deepEqual(await page.evaluate(()=>window.visited),['puspakom']);
  await page.close();
 }finally{await browser.close()}
});
test('enhanced menu retains all 15 pages, closes after navigation, handles staff',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await setup(page,true);
  await page.locator('#ada-admin-more summary').tap();
  assert.equal(await page.locator('.ada-native-menu-list button[data-cloud-page]').count(),15);
  await page.locator('.ada-native-menu-list button[data-cloud-page="runner"]').tap();
  assert.deepEqual(await page.evaluate(()=>window.visited),['runner']);
  assert.equal(await page.locator('#ada-admin-more').evaluate(e=>e.open),false);
  await page.locator('#ada-cloud-panel').evaluate(e=>{e.dataset.userRole='operations';document.querySelector('.cloud-side button[data-cloud-page="sales"]').hidden=true;window.adaAdminMenuRefresh()});
  await page.locator('#ada-admin-more summary').tap();
  assert.equal(await page.locator('.ada-native-menu-list button[data-cloud-page="sales"]').isVisible(),false);
  assert.equal(await page.locator('.ada-native-menu-list button[data-cloud-page="puspakom"]').isVisible(),true);
  await page.close();
 }finally{await browser.close()}
});
