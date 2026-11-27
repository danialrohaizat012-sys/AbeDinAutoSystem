// Only explicit, plausible fields; no inference or identity verification.
export function normalizeCustomer(raw) {
  const s=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
  const name=s(raw?.full_name,150).replace(/\s+/g,' ');
  const ic=s(raw?.ic,32).replace(/[\s-]/g,'');
  const phone=s(raw?.phone,40).replace(/[\s()-]/g,'');
  const email=s(raw?.email,150);
  return {
    full_name: name && /[\p{L}]/u.test(name) && !/\d/.test(name) ? name : '',
    ic: /^\d{12}$/.test(ic)?ic.slice(0,6)+'-'+ic.slice(6,8)+'-'+ic.slice(8):'',
    phone: /^(?:\+?60|0)1\d{8,9}$/.test(phone)?phone:'',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:''
  };
}
