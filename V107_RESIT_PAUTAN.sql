-- Abe Din Auto V107: pautan rahsia Resit Bayaran untuk pelanggan (resit.html?t=token).
alter table public.sales add column if not exists share_token uuid;
create unique index if not exists sales_share_token_uidx on public.sales(share_token) where share_token is not null;
create or replace function public.sale_receipt_link(p_sale_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_tok uuid;
begin
  if auth.uid() is null or public.current_staff_role()::text not in ('owner','sales_advisor') then
    raise exception 'Tidak dibenarkan.';
  end if;
  select share_token into v_tok from public.sales where id = p_sale_id;
  if not found then raise exception 'Jualan tidak dijumpai.'; end if;
  if v_tok is null then
    v_tok := gen_random_uuid();
    update public.sales set share_token = v_tok where id = p_sale_id;
  end if;
  return v_tok;
end $$;
revoke all on function public.sale_receipt_link(uuid) from public, anon;
grant execute on function public.sale_receipt_link(uuid) to authenticated;
create or replace function public.get_sale_receipt(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'sale', jsonb_build_object('id', s.id, 'agreed_price', s.agreed_price, 'status', s.status, 'created_at', s.created_at, 'sold_at', s.sold_at),
    'vehicle', jsonb_build_object('model_year', v.model_year, 'make', v.make, 'model', v.model, 'plate', v.plate, 'vehicle_id', v.vehicle_id, 'mileage_km', v.mileage_km),
    'customer', jsonb_build_object('full_name', c.full_name, 'phone', c.phone, 'email', c.email),
    'payments', coalesce((select jsonb_agg(jsonb_build_object('kind', p.kind, 'amount', p.amount, 'reference_no', p.reference_no, 'confirmed_at', p.confirmed_at, 'notes', p.notes) order by p.confirmed_at) from public.payments p where p.sale_id = s.id), '[]'::jsonb))
  from public.sales s
  join public.vehicles v on v.id = s.vehicle_id
  left join public.customers c on c.id = s.customer_id
  where p_token is not null and s.share_token = p_token
    and lower(s.status::text) not in ('cancelled','canceled','void')
  limit 1
$$;
revoke all on function public.get_sale_receipt(uuid) from public;
grant execute on function public.get_sale_receipt(uuid) to anon, authenticated;
