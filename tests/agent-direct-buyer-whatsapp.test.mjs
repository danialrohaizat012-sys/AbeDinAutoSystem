import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('agent-inquiry.html');
const api=read('supabase/functions/agent-public-inquiry/index.ts');
const admin=read('supabase/functions/agent-portal-admin/index.ts');
const portal=read('agent.html');
const sql=read('supabase/agent_direct_public_inquiries_v1.sql');
test('Buyer never sees a referral code field and can submit without agent',()=>{
 assert.match(html,/id="agentCode" name="ref" type="hidden"/);
 assert.doesNotMatch(html,/Kod rujukan ejen \(wajib\)/);
 assert.match(html,/if\(refCode&&/);
 assert.match(api,/ref\?"agent_submit_public_inquiry_gateway_v1":"agent_submit_direct_inquiry_gateway_v1"/);
 assert.match(api,/ref!==""/);
});
test('WhatsApp destination only appears after successful database response',()=>{
 assert.match(html,/if\(!res\.ok\)throw/);
 const n=html.indexOf("if(!res.ok)throw");
 const m=html.indexOf("window.open(waUrl");
 assert.ok(m>n);
 assert.match(html,/https:\/\/wa\.me\/601156366925/);
 assert.match(html,/No\. rujukan:/);
});
test('Direct leads never acquire agent commission rights',()=>{
 assert.match(sql,/catalogue_direct_inquiries/);
 assert.match(sql,/source text not null default 'public_direct'/);
 assert.match(sql,/revoke all on public\.catalogue_direct_inquiries/);
 assert.match(sql,/agent_leads/);
 assert.match(admin,/action==="direct_inquiry_list"/);
 assert.match(portal,/ownerDirectInquiries/);
});
