/**
 * Server-side decision support for AbeDin Auto agent commissions.
 * A pass means "ready for owner review", NOT automatic commission approval.
 * Do not expose sales, costs, customer details or payments to agent browsers.
 * Sale and payment snapshots must be loaded from trusted database queries.
 */
export function assessSaleForCommission({ sale, payments, expectedAgentId, lead }) {
  const reasons = [];
  if (!sale || typeof sale !== 'object') return { readyForReview: false, reasons: ['sale_missing'] };
  if (sale.status !== 'sold') reasons.push('sale_not_sold');
  if (!sale.sold_at) reasons.push('sale_completion_date_missing');
  if (!sale.id || !sale.vehicle_id || !sale.customer_id) reasons.push('sale_identity_incomplete');
  if (!lead || lead.linked_sale_id !== sale.id) reasons.push('lead_not_attributed_to_sale');
  if (!expectedAgentId || lead?.agent_id !== expectedAgentId) reasons.push('agent_mismatch');
  if (lead?.vehicle_id && lead.vehicle_id !== sale.vehicle_id) reasons.push('vehicle_mismatch');
  if (!Array.isArray(payments)) {
    reasons.push('payment_evidence_missing');
  } else {
    const valid = payments.every(p =>
      p && p.sale_id === sale.id &&
      (p.kind === 'deposit' || p.kind === 'full_payment') &&
      Number.isSafeInteger(p.amount_sen) && p.amount_sen >= 0 &&
      typeof p.confirmed_by === 'string' && p.confirmed_by.length > 0 &&
      typeof p.confirmed_at === 'string' && p.confirmed_at.length > 0
    );
    if (!valid) reasons.push('payment_evidence_invalid');
    if (!payments.some(p => p.kind === 'full_payment')) reasons.push('full_payment_missing');
    if (!Number.isSafeInteger(sale.agreed_price_sen) || sale.agreed_price_sen <= 0) {
      reasons.push('agreed_price_invalid');
    } else if (valid) {
      let total = 0;
      for (const p of payments) {
        total += p.amount_sen;
        if (!Number.isSafeInteger(total)) { reasons.push('payment_total_overflow'); break; }
      }
      if (Number.isSafeInteger(total) && total < sale.agreed_price_sen) reasons.push('payment_shortfall');
    }
  }
  return Object.freeze({ readyForReview: reasons.length === 0, reasons });
}
