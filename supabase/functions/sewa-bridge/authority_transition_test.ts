import { assertEquals } from 'jsr:@std/assert@1.0.11';
import { decideAuthorityUpdate } from './authority_transition.ts';
const id = '123e4567-e89b-42d3-a456-426614174000';
const other = '223e4567-e89b-42d3-a456-426614174000';
const owner = {mainUserId:id, revision:1, role:'owner' as const};
const evt = (revision:number, role:string, enabled=true, mainUserId=id) =>
  ({mainUserId,revision,role,enabled});
Deno.test('demotion removes owner access',()=>{
  assertEquals(decideAuthorityUpdate(owner,evt(2,'sales_advisor')),
    {status:'applied',state:{mainUserId:id,revision:2,role:'staf'}});
});
Deno.test('disable removes all access',()=>{
  assertEquals(decideAuthorityUpdate(owner,evt(2,'owner',false)),
    {status:'applied',state:{mainUserId:id,revision:2,role:null}});
});
Deno.test('old owner event cannot re-elevate after demotion',()=>{
  const after = decideAuthorityUpdate(owner,evt(3,'operations'));
  if (after.status !== 'applied') throw Error('expected applied');
  assertEquals(decideAuthorityUpdate(after.state,evt(2,'owner')),
    {status:'rejected',reason:'stale_revision'});
});
Deno.test('duplicate event rejected',()=>{
  assertEquals(decideAuthorityUpdate(owner,evt(1,'owner')),
    {status:'rejected',reason:'stale_revision'});
});
Deno.test('cross-user event rejected',()=>{
  assertEquals(decideAuthorityUpdate(owner,evt(2,'owner',true,other)),
    {status:'rejected',reason:'identity_mismatch'});
});
Deno.test('invalid role rejected',()=>{
  assertEquals(decideAuthorityUpdate(owner,evt(2,'superadmin')),
    {status:'rejected',reason:'invalid_event'});
});
Deno.test('newer owner event accepted after staff',()=>{
  assertEquals(decideAuthorityUpdate({...owner,role:'staf'},evt(2,'owner')),
    {status:'applied',state:{mainUserId:id,revision:2,role:'owner'}});
});
