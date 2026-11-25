const test=require('node:test');
const assert=require('node:assert/strict');
globalThis.AdaTikTokImport=require('../js/tiktok-lead-import.js');
require('../js/tiktok-lead-review.js');
require('../js/tiktok-lead-screenshot-text.js');
test('invalid row does not block valid customer',()=>{
 const rows=AdaTikTokImport.preview('Name,Phone\n,0123456789\nDemo Customer,0123456789');
 assert.equal(rows[0].valid,false);assert.equal(rows[1].duplicate,false);
});
test('screenshot fields survive review and editing',()=>{
 const rows=AdaTikTokReview.review(AdaTikTokScreenshotText.extract('Name\nDemo Customer\nPhone number\n0123456789\nCity\nDemo City\nProvince/State\nDemo State\nGender\nMale\nJob title\nDemo Job'));
 assert.equal(rows[0].valid,true);assert.equal(rows[0].state,'Demo State');assert.equal(rows[0].occupation,'Demo Job');
 const edited=AdaTikTokReview.update(rows,0,{city:'Edited City'});
 assert.equal(edited[0].city,'Edited City');assert.equal(edited[0].occupation,'Demo Job');
});
test('CSV optional fields preserved',()=>{
 const rows=AdaTikTokReview.review(AdaTikTokImport.preview('Name,Phone,Province/State,Gender,Job title\nDemo,0123456789,Demo State,Male,Demo Job'));
 assert.equal(rows[0].state,'Demo State');assert.equal(rows[0].occupation,'Demo Job');
});
