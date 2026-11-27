const test=require('node:test'),assert=require('node:assert/strict');
test('refresh only expired or invalid session once',async()=>{
 const {withSalesSession}=await import('../js/do-esign.mjs');let refreshed=0,calls=[];
 const client={auth:{getSession:async()=>({data:{session:{access_token:'old'}}}),refreshSession:async()=>{refreshed++;return {data:{session:{access_token:'new'}}}}}};
 const result=await withSalesSession(client,async jwt=>{calls.push(jwt);if(jwt==='old')throw Object.assign(Error('expired'),{status:401});return 'ok'});
 assert.equal(result,'ok');assert.equal(refreshed,1);assert.deepEqual(calls,['old','new']);
 await assert.rejects(withSalesSession(client,async()=>{throw Object.assign(Error('denied'),{status:403})}),/denied/);assert.equal(refreshed,1);
});