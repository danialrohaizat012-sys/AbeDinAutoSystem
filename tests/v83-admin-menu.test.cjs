// V83 menu usability regression tests - no production database access.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../app.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../js/admin-menu.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../css/admin-menu.css'),'utf8');
test('navigation module syntax is valid',()=>{
 assert.doesNotThrow(()=>new Function(js.replace(/^export /m,'')));
});
test('mobile navigation contains five accessible, easily tappable shortcuts',()=>{
 const nav=html.match(/<nav class="cloud-bottom"[^>]*>[\s\S]*?<\/nav>/)?.[0];
 assert.ok(nav,'bottom navigation exists');
 assert.equal((nav.match(/<button\b/g)||[]).length,5);
 for(const page of ['dashboard','inventory','sales','reports'])assert.match(nav,new RegExp('data-cloud-page="'+page+'"'));
 assert.match(nav,/id="ada-admin-more"[^>]*aria-haspopup="dialog"/);
 assert.match(css,/min-height:52px!important/);
 assert.match(css,/touch-action:manipulation/);
});
test('drawer reuses existing page handlers and respects permissions',()=>{
 assert.match(js,/querySelectorAll\('button\[data-cloud-page\]'\)/);
 assert.match(js,/\.filter\(b=>b&&!b.hidden\)/);
 assert.match(js,/source\.click\(\)/);
 assert.match(html,/window\.adaAdminMenuRefresh\?\.\(\)/);
});
test('menu groups cover every existing dashboard sidebar page exactly once',()=>{
 const sidebar=html.match(/<aside class="cloud-side">[\s\S]*?<\/aside>/)?.[0]||'';
 const pages=[...sidebar.matchAll(/data-cloud-page="([^"]+)"/g)].map(m=>m[1]);
 const groups=js.match(/const GROUPS=\[([\s\S]*?)\];/)?.[1]||'';
 const configured=[...groups.matchAll(/pages:\[([^\]]*)\]/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
 assert.deepEqual([...configured].sort(),[...pages].sort());
 assert.equal(new Set(configured).size,configured.length);
});
test('responsive CSS keeps hidden and inaccessible entries out of the menu',()=>{
 assert.match(css,/\.cloud-side button\[hidden\]/);
 assert.match(css,/\.cloud-bottom button\[hidden\]/);
 assert.match(css,/\.ada-admin-nav-group\[hidden\]/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/\.ada-admin-menu-overlay\[hidden\]/);
});
test('drawer has accessible close and escape handlers',()=>{
 assert.match(js,/aria-modal="true"/);
 assert.match(js,/aria-label="Tutup menu"/);
 assert.match(js,/e\.key==='Escape'/);
 assert.match(js,/aria-expanded/);
});
