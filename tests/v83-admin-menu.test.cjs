const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const js=fs.readFileSync(path.resolve(__dirname,'../js/admin-menu.js'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/admin-menu.css'),'utf8');
test('mobile navigation contains four quick links and native Semua Menu fallback',()=>{
 const nav=html.match(/<nav class="cloud-bottom"[^>]*>[\s\S]*?<\/nav>/)?.[0]||'';
 assert.ok(nav);
 assert.match(nav,/<details class="ada-native-more" id="ada-admin-more">/);
 for(const p of ['dashboard','inventory','sales','reports'])assert.match(nav,new RegExp('data-cloud-page="'+p+'"'));
 assert.match(css,/min-height:52px/);
 assert.match(css,/touch-action:manipulation/);
});
test('menu navigation continues to honor role-based permission visibility',()=>{
 assert.match(js,/querySelectorAll\('button\[data-cloud-page\]'\)/);
 assert.match(js,/btn\.hidden=!source\|\|source\.hidden/);
 assert.match(js,/\.filter\(page=>byPage\.get\(page\)&&!byPage\.get\(page\)\.hidden\)/);
 assert.match(html,/window\.adaAdminMenuRefresh\?\.\(\)/);
});
test('sidebar groups cover each page exactly once',()=>{
 const sidebar=html.match(/<aside class="cloud-side">[\s\S]*?<\/aside>/)?.[0]||'';
 const pages=[...sidebar.matchAll(/data-cloud-page="([^"]+)"/g)].map(m=>m[1]);
 const groups=js.match(/const GROUPS=\[([\s\S]*?)\];/)?.[1]||'';
 const configured=[...groups.matchAll(/pages:\[([^\]]*)\]/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
 assert.deepEqual(configured.slice().sort(),pages.slice().sort());
 assert.equal(new Set(configured).size,configured.length);
});
test('menu toggling is native and supports Escape',()=>{
 assert.match(js,/more\.addEventListener\('toggle'/);
 assert.match(js,/if\(e\.key==='Escape'&&more\.open\)/);
 assert.match(js,/document\.addEventListener\('click'/);
 assert.match(css,/\.ada-native-menu-section button\[hidden\]/);
});
