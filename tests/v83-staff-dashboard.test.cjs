// V83.2 staff dashboard regression: permission-aware navigation and catalogue layout.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../js/admin-menu.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../css/staff-dashboard.css'),'utf8');
test('admin menu module remains valid JavaScript',()=>assert.doesNotThrow(()=>new Function(js.replace(/^export /m,''))));
test('staff role reaches menu before permitted navigation refresh',()=>{
 const role=app.indexOf("dataset.userRole=p.role");
 const refresh=app.indexOf("window.adaAdminMenuRefresh?.()",role);
 assert.ok(role>0&&refresh>role);
 assert.match(js,/panel\.dataset\.userRole&&panel\.dataset\.userRole!=='owner'/);
});
test('staff quick navigation chooses only permitted pages',()=>{
 assert.match(js,/candidate\.filter\(page=>byPage\.get\(page\)&&!byPage\.get\(page\)\.hidden\)\.slice\(0,4\)/);
 assert.match(js,/button\.addEventListener\('click',\(\)=>navigate\(page\)\)/);
 assert.match(js,/isStaff\?'Katalog Umum':'Dashboard'/);
});
test('catalogue has responsive contained iframe and accessible customer link',()=>{
 assert.match(app,/class="ada-staff-catalogue-frame"/);
 assert.match(app,/title="Katalog Umum Abe Din Auto"/);
 assert.match(app,/Lihat Katalog Pelanggan/);
 assert.match(css,/\.ada-staff-catalogue-frame iframe/);
 assert.match(css,/height:calc\(100dvh - 170px\)/);
});
test('mobile staff shortcuts maintain large buttons without horizontal menu scroll',()=>{
 assert.match(css,/overflow:visible!important/);
 assert.match(css,/min-width:0!important;flex:1 1 0!important/);
 assert.match(css,/-webkit-line-clamp:2/);
});
test('admin remains on existing menu and staff CSS is cache-busted',()=>{
 assert.match(app,/admin-menu\.js\?v=83\.5/);
 assert.match(app,/staff-dashboard\.css\?v=83\.2/);
 assert.match(js,/\:['dashboard','inventory','sales','reports']/);
});
