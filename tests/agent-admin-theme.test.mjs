import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=readFileSync(new URL('../js/agent-admin-panel.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.html',import.meta.url),'utf8');
test('dark and light themes both use scoped readable color tokens',()=>{
 assert.match(source,/--ag-bg:#161b1e/);
 assert.match(source,/html\.ada-light \.ada-agent-owner/);
 assert.match(source,/--ag-bg:#ffffff/);
 assert.match(source,/--ag-ink:#f1f2ee/);
 assert.match(source,/--ag-ink:#21323b/);
 assert.match(source,/color-scheme:dark/);
 assert.match(source,/color-scheme:light/);
});
test('cards, compact leads, inputs and labels inherit consistent palette',()=>{
 for(const marker of ['background:var(--ag-bg)!important','background:var(--ag-field)!important','color:var(--ag-field-ink)!important','background:var(--ag-accent)!important','color:var(--ag-muted)!important','background:var(--ag-raised)!important'])assert.ok(source.includes(marker),marker);
 assert.doesNotMatch(source,/Explicit light-surface palette/);
 assert.doesNotMatch(source,/--ag-surface:#ffffff/);
 assert.doesNotMatch(source,/color-scheme:light\}/);
});
test('browser uses cache-busted agent module and JavaScript is valid',()=>{
 assert.match(app,/agent-admin-panel\.js\?v=\d+/);
 execFileSync(process.execPath,['--check',new URL('../js/agent-admin-panel.js',import.meta.url).pathname],{stdio:'pipe'});
});
