import { assertEquals } from 'jsr:@std/assert@1.0.11';
import { signRolePayload, verifyRolePayload } from './event_signature.ts';
const secret = 'a'.repeat(40);
Deno.test('valid HMAC accepted',async()=>{
 const payload='{"revision":2}'; const sig=await signRolePayload(secret,payload);
 assertEquals(await verifyRolePayload(secret,payload,sig),true);
});
Deno.test('modified payload rejected',async()=>{
 const sig=await signRolePayload(secret,'{"revision":2}');
 assertEquals(await verifyRolePayload(secret,'{"revision":3}',sig),false);
});
Deno.test('wrong secret rejected',async()=>{
 const sig=await signRolePayload(secret,'hello');
 assertEquals(await verifyRolePayload('b'.repeat(40),'hello',sig),false);
});
Deno.test('invalid signature rejected',async()=>{
 assertEquals(await verifyRolePayload(secret,'hello','xyz'),false);
});
Deno.test('short signing secret rejected',async()=>{
 let rejected=false;try {await signRolePayload('weak','hello');}catch{rejected=true;}
 assertEquals(rejected,true);
});
