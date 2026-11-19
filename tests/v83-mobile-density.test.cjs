const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.resolve(__dirname,'../css/mobile-density.css'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
test('mobile density stylesheet is linked after existing application styles',()=>{
 const i=html.indexOf('css/staff-dashboard.css?v=83.2');
 const j=html.indexOf('css/mobile-density.css?v=83.4');
 assert.ok(i>=0&&j>i,'mobile density CSS should load last');
});
test('compact mode only applies to internal authenticated layout',()=>{
 assert.match(css,/@media\s*\(max-width:700px\)/);
 assert.match(css,/html\.ada-staff-route #ada-cloud-gate/);
 assert.doesNotMatch(css,/#ada-public-catalogue/);
 assert.doesNotMatch(css,/body\s*\{/);
 assert.doesNotMatch(css,/html\.ada-public-route/);
});
test('cards and headings are more compact for narrow screens',()=>{
 assert.match(css,/\.cloud-stat\{[\s\S]*?min-height:82px!important/);
 assert.match(css,/\.ada-kpi\{[\s\S]*?min-height:88px!important/);
 assert.match(css,/\.ada-dash-head h2\{[\s\S]*?font-size:21px!important/);
 assert.match(css,/\.cloud-car \.info\{[\s\S]*?padding:11px 12px 12px!important/);
 assert.match(css,/\.ada-v360-kpi\{[\s\S]*?padding:10px!important/);
});
test('iPhone form zoom prevention and minimum touch targets are preserved',()=>{
 assert.match(css,/font-size:16px!important/);
 assert.match(css,/\.ada-v360-tab\{[\s\S]*?min-height:44px!important/);
 assert.match(css,/\.ada-form button\{[\s\S]*?min-height:44px/);
 assert.match(css,/touch-action:manipulation/);
});
test('very narrow phones receive extra horizontal padding reduction',()=>{
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/padding-left:8px!important/);
 assert.match(css,/padding-right:8px!important/);
});
