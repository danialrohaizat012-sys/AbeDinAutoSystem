/** Pure calculation helpers. Values are integer sen, never browser-controlled entitlements. */
const assertSen = (n) => {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('Invalid amount in sen');
  return n;
};
export function toSen(amount) {
  if (typeof amount !== 'string' || !/^(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(amount)) throw new RangeError('Invalid monetary amount');
  const [ringgit, cents = ''] = amount.split('.');
  return assertSen(Number(ringgit) * 100 + Number(cents.padEnd(2,'0')));
}
export function formatRM(sen) {
  assertSen(sen);
  return (Math.floor(sen/100)) + '.' + String(sen%100).padStart(2,'0');
}
export function calculateCommission(rule, sale) {
  if (!rule || !sale || sale.status !== 'sold' || sale.confirmed !== true) throw new Error('Sale is not confirmed');
  const method = rule.method;
  if (method === 'fixed') return assertSen(rule.fixedSen);
  if (!['sale_percent','net_profit_percent'].includes(method)) throw new Error('Unknown method');
  const basis = method === 'sale_percent' ? assertSen(sale.salePriceSen) : assertSen(sale.netProfitSen);
  const bps = rule.basisPoints;
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000) throw new RangeError('Invalid commission rate');
  return assertSen(Math.round(basis * bps / 10000));
}
export function checkPayout({agentId, commissions, payoutSen}) {
  assertSen(payoutSen);
  if (!agentId || !Array.isArray(commissions) || !commissions.length) throw new Error('Empty payout');
  const seen = new Set();
  let total = 0;
  for (const c of commissions) {
    if (!c || c.agentId !== agentId) throw new Error('Cross-agent payout forbidden');
    if (c.status !== 'approved') throw new Error('Commission is not approved');
    if (!c.id || seen.has(c.id)) throw new Error('Duplicate commission');
    seen.add(c.id);
    total += assertSen(c.agreedSen);
    assertSen(total);
  }
  if (total <= 0 || total !== payoutSen) throw new Error('Payout sum does not match');
  return true;
}
