import { assertEquals } from 'jsr:@std/assert@1.0.11';
import { authenticateAuthorityMessage } from './authority_envelope.ts';
import { signRolePayload } from './event_signature.ts';
const secret='x'.repeat(40), now=1800000000;
const payload=(issuedAt=now,eventId='123e4567-e89b-42d3-a456-426614174001')=>JSON.stringify({
 eventId,issuedAt,event:{mainUserId:'123e4567-e89b-42d3-a456-426614174000',revision:2,role:'operations',enabled:true}
});
async function verify(body:string,time=now) {
 return authenticateAuthorityMessage(secret,body,await signRolePayload(secret,body),time);
}
Deno.test('valid signed envelope accepted',async()=>assertEquals((await verify(payload()))?.event.revision,2));
Deno.test('expired signed envelope rejected',async()=>assertEquals(await verify(payload(now-121)),null));
Deno.test('future signed envelope rejected',async()=>assertEquals(await verify(payload(now+31)),null));
Deno.test('invalid event id rejected',async()=>assertEquals(await verify(payload(now,'bad')),null));
Deno.test('tampered raw body rejected',async()=>{
 const body=payload();const sig=await signRolePayload(secret,body);
 assertEquals(await authenticateAuthorityMessage(secret,body.replace('operations','owner'),sig,now),null);
});
Deno.test('malformed signed JSON rejected',async()=>assertEquals(await verify('{'),null));
Deno.test('oversized body rejected',async()=>assertEquals(await verify(' '.repeat(8193)),null));
