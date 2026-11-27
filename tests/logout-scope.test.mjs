import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
// Butang Log keluar hanya menamatkan sesi pada peranti ini.
for(const [file,handler] of [
 ['app.html',/el\('ada-cloud-logout'\)\.addEventListener\('click',async\(\)=>\{await client\.auth\.signOut\(\{scope:'local'\}\)/],
 ['agent.html',/\$\('logout'\)\.onclick=async\(\)=>\{await supabase\.auth\.signOut\(\{scope:'local'\}\)/],
 ['agent-payout-verify.html',/\$\('logout'\)\.onclick=async\(\)=>\{await client\.auth\.signOut\(\{scope:'local'\}\)/],
 ['agent-v20.html',/logoutButton\.addEventListener\('click',async\(\)=>\{\+\+seq;await client\.auth\.signOut\(\{scope:'local'\}\)/],
 ['sewa-admin.html',/\$\('logout'\)\.addEventListener\('click', async \(\) => \{ await client\.auth\.signOut\(\{ scope: 'local' \}\)/],
])test(file+' log keluar peranti ini sahaja',()=>assert.match(read(file),handler));
