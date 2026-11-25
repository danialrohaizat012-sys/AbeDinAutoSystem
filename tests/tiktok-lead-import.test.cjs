const test=require('node:test');const assert=require('node:assert/strict');const {parse,phone,preview}=require('../js/tiktok-lead-import.js');
test('quoted CSV and BOM',()=>assert.deepEqual(parse('\uFEFFname,city\r\n"A, B","Klang"\r\n'),[['name','city'],['A, B','Klang']]));
test('phone normalization',()=>{assert.equal(phone('012-3456789'),'+60123456789');assert.equal(phone('+60 12 3456789'),'+60123456789');assert.equal(phone('123'),null);});
test('duplicate and invalid preview',()=>{const r=preview('name,phone,city\nA,0123456789,Klang\nB,+60123456789,KL\nC,123,KL');assert.equal(r[0].valid,true);assert.equal(r[1].duplicate,true);assert.equal(r[2].valid,false);});
test('missing columns and malformed CSV',()=>{assert.throws(()=>preview('city\nKL'));assert.throws(()=>parse('"unfinished'));});
