const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const src=fs.readFileSync(path.resolve(__dirname,'../js/admin-menu.js'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/admin-menu.css'),'utf8');
test('admin mobile menu code compiles',()=>{
 assert.doesNotThrow(()=>new Function(src.replace(/^export /m,'')));
});
test('Semua Menu button is wired and accessible on mobile',()=>{
 assert.match(html,/id="ada-admin-more" aria-haspopup="dialog" aria-expanded="false"/);
 assert.match(src,/more\.addEventListener\('click',e=>\{e\.preventDefault\(\);e\.stopPropagation\(\);overlay\.hidden\?open\(\):close\(\)\}\)/);
 assert.match(src,/overlay\.hidden=false/);
 assert.match(src,/overlay\.style\.display='flex'/);
 assert.match(src,/overlay\.hidden=true/);
 assert.match(src,/overlay\.style\.display='none'/);
 assert.match(src,/aria-modal="true"/);
 assert.match(css,/\.ada-admin-menu-overlay\{position:fixed/);
});
test('drawer navigates via authorized direct application route rather than hidden CSS button',()=>{
 assert.match(html,/window\.adaCloudNavigate=page=>\{if\(!profile\|\|!canPage\(profile,page\)\)return false/);
 assert.match(src,/if\(typeof window\.adaCloudNavigate==='function'\)return window\.adaCloudNavigate\(page\)===true/);
 assert.match(src,/b\.addEventListener\('click',\(\)=>\{if\(navigate\(page\)\)close\(\)\}\)/);
});
test('quick shortcuts and drawer use a single navigation handler',()=>{
 assert.match(src,/button\.addEventListener\('click',\(\)=>navigate\(page\)\)/);
 assert.match(html,/querySelectorAll\('\[data-cloud-page\]'\)\.forEach\(b=>b\.addEventListener\('click',\(\)=>window\.adaCloudNavigate\(b\.dataset\.cloudPage\)\)\)/);
});
test('menu still honors staff visibility and retains all groups',()=>{
 for(const group of ['Utama','Operasi','Sokongan','Akaun'])assert.match(src,new RegExp("label:'"+group+"'"));
 assert.match(src,/\.filter\(b=>b&&!b\.hidden\)/);
 assert.match(src,/if\(!source\|\|source\.hidden\)return false/);
});
test('mobile cache is refreshed to 83.5 without modifying modules',()=>{
 assert.match(html,/admin-menu\.js\?v=83\.5/);
 assert.match(html,/css\/admin-menu\.css\?v=83\.5/);
});
