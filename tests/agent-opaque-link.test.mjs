import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const portal=read('agent.html');
const page=read('agent-inquiry.html');
const catalog=read('app.html');
const api=read('supabase/functions/agent-portal-catalog/index.ts');
const intake=read('supabase/functions/agent-public-inquiry/index.ts');
test('Only signed-in agents receive opaque promotional link tokens',()=>{
 assert.match(api,/admin|server\.auth\.getUser\(token\)/);
 assert.match(api,/agent_public_share_tokens/);
 assert.match(api,/share_token:share\.token/);
 assert.match(portal,/shareToken=body\.share_token/);
 assert.match(portal,/u\.searchParams\.set\('ref',shareToken\)/);
 assert.doesNotMatch(portal,/u\.searchParams\.set\('ref',agent\.agent_code\)/);
});
test('Buyer form hides referral and accepts direct or opaque link',()=>{
 assert.match(page,/id="agentCode" name="ref" type="hidden"/);
 assert.match(page,/\^\[a-f0-9\]\{32\}\$/);
 assert.match(page,/if\(refCode&&!/);
 assert.match(page,/wa\.me\/601156366925/);
 assert.match(page,/\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(page,/Kod rujukan ejen \(wajib\)/);
});
test('Public intake resolves opaque token server-side without returning agent ID',()=>{
 assert.match(intake,/tokenPattern/);
 assert.match(intake,/agent_public_share_tokens/);
 assert.match(intake,/privateAgentCode=agent\.agent_code/);
 assert.match(intake,/p_referral_code:privateAgentCode/);
 assert.doesNotMatch(intake,/agent_code:result\.agent_code/);
});
test('Public catalogue hides agent code in buttons and WhatsApp',()=>{
 assert.match(catalog,/Daftar Minat/);
 assert.doesNotMatch(catalog,/Kod rujukan ejen:/);
 assert.doesNotMatch(catalog,/Daftar Minat'\+\(agentReferralCode/);
});
