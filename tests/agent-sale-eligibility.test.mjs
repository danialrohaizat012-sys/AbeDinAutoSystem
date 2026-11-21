import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSaleForCommission } from '../js/agent-sale-eligibility.mjs';

function fixture() {
  const sale={id:'sale-1',vehicle_id:'vehicle-1',customer_id:'customer-1',
    status:'sold',sold_at:'2026-11-20T05:00:00Z',agreed_price_sen:1600000};
  const lead={id:'lead-1',agent_id:'agent-1',linked_sale_id:'sale-1',vehicle_id:'vehicle-1'};
  const payments=[
    {sale_id:'sale-1',kind:'deposit',amount_sen:100000,confirmed_by:'owner-1',confirmed_at:'2026-11-20T04:00:00Z'},
    {sale_id:'sale-1',kind:'full_payment',amount_sen:1500000,confirmed_by:'owner-1',confirmed_at:'2026-11-20T05:00:00Z'}
  ];
  return {sale,lead,payments,expectedAgentId:'agent-1'};
}
const run = (change) => { const f=fixture(); change?.(f); return assessSaleForCommission(f); };
test('confirmed fully paid sold vehicle goes to owner review, not auto-approved',()=>{
  assert.deepEqual(run(),{readyForReview:true,reasons:[]});
});
test('booking or not finalized sale is not eligible',()=>{
  const r=run(f=>{f.sale.status='reserved';f.sale.sold_at=null;});
  assert.equal(r.readyForReview,false);assert.ok(r.reasons.includes('sale_not_sold'));
});
test('deposit alone cannot release agent commission',()=>{
  const r=run(f=>{f.payments.pop();});
  assert.ok(r.reasons.includes('full_payment_missing'));
  assert.ok(r.reasons.includes('payment_shortfall'));
});
test('short payment is rejected even if labeled full_payment',()=>{
  const r=run(f=>{f.payments[1].amount_sen=250000;});
  assert.ok(r.reasons.includes('payment_shortfall'));
});
test('cross-sale payment reference is rejected',()=>{
  const r=run(f=>{f.payments[1].sale_id='other-sale';});
  assert.ok(r.reasons.includes('payment_evidence_invalid'));
});
test('lead must be assigned to matching sale and agent',()=>{
  const r=run(f=>{f.lead.linked_sale_id='sale-x';f.lead.agent_id='agent-2';});
  assert.ok(r.reasons.includes('lead_not_attributed_to_sale'));
  assert.ok(r.reasons.includes('agent_mismatch'));
});
test('lead vehicle cannot differ from sale vehicle',()=>{
  const r=run(f=>{f.lead.vehicle_id='different-car';});
  assert.ok(r.reasons.includes('vehicle_mismatch'));
});
test('unconfirmed or malformed payment evidence is rejected',()=>{
  const r=run(f=>{f.payments[1].confirmed_at='';});
  assert.ok(r.reasons.includes('payment_evidence_invalid'));
});
test('missing payment data cannot approve commission',()=>{
  const r=run(f=>{f.payments=null;});
  assert.ok(r.reasons.includes('payment_evidence_missing'));
});
test('missing sale cannot approve commission',()=>{
  const r=run(f=>{f.sale=null;});
  assert.ok(r.reasons.includes('sale_missing'));
});
