import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const main=read("agent.html");
const admin=read("supabase/functions/agent-portal-admin/index.ts");
const verifier=read("supabase/functions/agent-payout-verifier/index.ts");
function parseBrowser(page){
 const body=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(body,"browser module script missing");
 const dir=mkdtempSync(join(tmpdir(),"ada-agent-"));
 try{
   const p=join(dir,"portal.mjs");
   writeFileSync(p,body);
   execFileSync(process.execPath,["--check",p],{stdio:"pipe"});
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test("agent portal JavaScript parses and owner cannot mark paid",()=>{
 parseBrowser(main);
 assert.match(main,/agent-portal-admin/);
 assert.match(main,/agent-payout-verify.html/);
 assert.doesNotMatch(main,/action:'confirm_payout'/);
 assert.match(main,/Menunggu pengesahan oleh HR Aiman/);
});
test("owner edge function may approve but not finalize payout",()=>{
 assert.match(admin,/payload.action==="approve_payout"/);
 assert.match(admin,/admin.auth.getUser\(token\)/);
 assert.match(admin,/owner\?\.role!=="owner"/);
 assert.doesNotMatch(admin,/payload.action==="confirm_payout"/);
});
test("HR edge requires verified JWT and independent authority",()=>{
 assert.match(verifier,/admin.auth.getUser\(bearer\)/);
 assert.match(verifier,/agent_payout_verifiers/);
 assert.match(verifier,/independent_bank_reconciliation!==true/);
 assert.match(verifier,/p_actor:user.id/);
 assert.doesNotMatch(verifier,/SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']/);
});
test("HR payout UI uses actual bank timestamp, not fixed noon",()=>{
 const page=read("agent-payout-verify.html");
 parseBrowser(page);
 assert.match(page,/HH:MM/);
 assert.doesNotMatch(page,/T12:00:00\+08:00/);
});
