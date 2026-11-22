import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const html=readFileSync(new URL('../agent.html',import.meta.url),'utf8');
test('dashboard and application tabs hidden before login',()=>{
 assert.match(html,/<button data-view="dashboard" id="dashboardTab" hidden>/);
 assert.match(html,/<button data-view="application" id="applicationTab" hidden>/);
});
test('only active logged-in verified agent can open dashboard',()=>{
 assert.match(html,/id==='dashboard'&&!\(me\?\.email_confirmed_at&&agent\?\.status==='active'\)/);
 assert.match(html,/\$\('dashboardTab'\)\.hidden=profile\?\.status!=='active'/);
 assert.match(html,/if\(b\.hidden\)return;view\(b\.dataset\.view\)/);
 assert.match(html,/\$\('dashboardTab'\)\.hidden=true/);
});
test('no session renders login without auth session missing error',()=>{
 assert.match(html,/getSession\(\)/);
 assert.match(html,/if\(!sessionData\?\.session\?\.access_token\)return null/);
 assert.match(html,/if\(!me\)\{shareToken=''/);
 assert.match(html,/view\('account'\);return/);
 assert.match(html,/AuthSessionMissingError/);
});
test('owner tab stays owner only and application follows verified login',()=>{
 assert.match(html,/\$\('ownerTab'\)\.hidden=!owner/);
 assert.match(html,/\$\('applicationTab'\)\.hidden=false/);
});
test('browser module syntax parses',()=>{
 const js=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(js);
 const dir=mkdtempSync(join(tmpdir(),'agent-auth-'));
 try{const file=join(dir,'portal.mjs');writeFileSync(file,js);execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}
 finally{rmSync(dir,{recursive:true,force:true});}
});
