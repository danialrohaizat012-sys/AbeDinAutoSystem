import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const app=readFileSync(new URL('../app.html',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/catalogue_interest_button_visibility_v1.sql',import.meta.url),'utf8');
test('owner-only admin switch exists and persists state',()=>{
 assert.match(app,/id="ada-interest-visibility-panel"/);
 assert.match(app,/id="ada-interest-visibility-switch"/);
 assert.match(app,/interestSwitch&&profile\?\.role==='owner'/);
 assert.match(app,/\.update\(\{enabled,updated_at:new Date\(\)\.toISOString\(\),updated_by:profile\.id\}\)/);
 assert.match(app,/\.eq\('id',true\)\.select\('enabled'\)\.single\(\)/);
});
test('public catalogue hides both card and car details when OFF',()=>{
 assert.match(app,/const showInterestButton=visibilityResult\.error\?true:visibilityResult\.data\?\.enabled!==false/);
 assert.match(app,/const referralButton=v=>showInterestButton&&publicStatus\(v\)==='available'/);
 assert.match(app,/if\(showInterestButton&&detailActions&&current&&publicStatus\(current\)==='available'\)/);
 assert.match(app,/client\.from\('catalogue_interest_button_settings'\)/);
});
test('RLS restricts update to active owner but permits public reading',()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/policy "public read interest visibility"/);
 assert.match(migration,/policy "owner update interest visibility"/);
 assert.match(migration,/p\.role='owner' and p\.enabled=true/);
 assert.match(migration,/grant select .* to anon,authenticated/);
 assert.doesNotMatch(migration,/grant insert .* to anon/);
});
test('deferred dashboard JavaScript parses',()=>{
 const script=app.match(/<script type="text\/plain" id="ada-deferred-cloud">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'deferred cloud script found');
 const dir=mkdtempSync(join(tmpdir(),'ada-interest-test-'));
 try {const p=join(dir,'cloud.mjs');writeFileSync(p,script);execFileSync(process.execPath,['--check',p],{stdio:'pipe'});}
 finally {rmSync(dir,{recursive:true,force:true})}
});
