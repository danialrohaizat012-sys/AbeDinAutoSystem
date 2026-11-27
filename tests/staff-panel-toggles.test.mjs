import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {panelEnabled} from '../js/staff-panel-settings.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=r=>({from:()=>{const q={select:()=>q,eq:()=>q,single:async()=>r};return q}});
test('OFF menyorok panel; ON atau gagal baca kekal papar',async()=>{
 assert.equal(await panelEnabled(client({data:{todo_enabled:false}}),'todo_enabled'),false);
 assert.equal(await panelEnabled(client({data:{todo_enabled:true}}),'todo_enabled'),true);
 assert.equal(await panelEnabled(client({error:{message:'x'}}),'todo_enabled'),true);
});
test('Dashboard Owner ada suis; paparan staf ikut tetapan',()=>{
 const app=read('app.html');
 assert.match(app,/ada-panel-toggles-host/);
 assert.match(app,/panelEnabled\(client,'todo_enabled'\)/);
 assert.match(app,/sharedProfile\.role==='owner'\?true:.*panelEnabled\(client,'makluman_enabled'\)/);
});
test('Hanya Owner boleh ubah tetapan di database',()=>{
 const sql=read('V132_PANEL_ON_OFF.sql');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/for update to authenticated\s+using \(\(select public\.current_staff_role\(\)\)::text = 'owner'\)/);
});
