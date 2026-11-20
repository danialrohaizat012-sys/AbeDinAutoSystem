const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
const src=fs.readFileSync(path.resolve(__dirname,'../js/admin-menu.js'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../css/admin-menu.css'),'utf8');
test('menu enhancer compiles and native menu is present without JS',()=>{
 assert.doesNotThrow(()=>new Function(src.replace(/^export /m,'')));
 const nav=html.match(/<nav class="cloud-bottom"[^>]*>[\s\S]*?<\/nav>/)?.[0]||'';
 assert.match(nav,/<details class="ada-native-more" id="ada-admin-more">/);
 assert.match(nav,/<summary aria-label="Buka Semua Menu">/);
 assert.equal((nav.match(/<section class="ada-native-menu-section">/g)||[]).length,4);
 assert.equal((nav.match(/<button type="button" data-cloud-page="/g)||[]).length,19);
});
test('native menu is styled as a real mobile expandable panel',()=>{
 assert.match(css,/\.ada-native-more\[open\] summary/);
 assert.match(css,/\.ada-native-menu-list\{/);
 assert.match(css,/position:fixed!important/);
 assert.match(css,/max-height:calc\(100dvh - 115px/);
});
test('staff access and direct route handler are preserved',()=>{
 assert.match(html,/window\.adaCloudNavigate=page=>\{if\(!profile\|\|!canPage\(profile,page\)\)return false/);
 assert.match(src,/if\(!source\|\|source\.hidden\)return false/);
 assert.match(src,/window\.adaCloudNavigate\(page\)===true/);
 assert.match(src,/btn\.hidden=!source\|\|source\.hidden/);
});
test('navigation enhancer does not delete native menu entries',()=>{
 assert.match(src,/bottom\.querySelectorAll\(':scope > button\[data-cloud-page\]'\)/);
 assert.match(src,/mobileList\?\.addEventListener\('click'/);
 assert.match(src,/if\(more\.open\)more\.open=false/);
 assert.doesNotMatch(src,/document\.body\.append\(overlay\)/);
});
test('fresh assets and service worker prioritize latest JS',()=>{
 assert.match(html,/admin-menu\.js\?v=83\.6/);
 assert.match(html,/admin-menu\.css\?v=83\.6/);
 const sw=fs.readFileSync(path.resolve(__dirname,'../service-worker.js'),'utf8');
 assert.match(sw,/abe-din-v83-6/);
 assert.match(sw,/u\.pathname\.endsWith\('\.js'\)\|\|u\.pathname\.endsWith\('\.css'\)/);
});
