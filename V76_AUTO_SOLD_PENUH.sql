-- V76: Status kereta ikut jumlah bayaran, bukan jenis bayaran.
-- Jumlah dibayar >= harga dipersetujui -> jualan & kereta 'sold'.
-- Jumlah dibayar <  harga dipersetujui -> kekal 'reserved' (deposit sahaja).

create or replace function public.record_sale_payment(p_sale_id uuid, p_kind payment_kind, p_amount numeric, p_reference_no text, p_notes text default null::text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_role public.staff_role;
  v_payment uuid;
  v_sale public.sales%rowtype;
  v_total numeric;
begin
  v_role := public.current_staff_role();
  if v_role not in ('owner','sales_advisor') then raise exception 'Not authorized'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than 0'; end if;
  if coalesce(trim(p_reference_no),'')='' then raise exception 'Reference number is required'; end if;
  select * into v_sale from public.sales where id=p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;
  if v_sale.status <> 'reserved' then raise exception 'Only reserved sales can receive payment'; end if;
  if p_kind='full_payment' and exists(select 1 from public.payments where sale_id=p_sale_id and kind='full_payment') then
    raise exception 'Full payment already recorded';
  end if;
  insert into public.payments(sale_id,kind,amount,reference_no,confirmed_by,notes)
  values(p_sale_id,p_kind,p_amount,trim(p_reference_no),auth.uid(),p_notes) returning id into v_payment;
  select coalesce(sum(amount),0) into v_total from public.payments where sale_id=p_sale_id;
  if p_kind='full_payment' and v_total < v_sale.agreed_price then
    raise exception 'Total confirmed payment is below agreed price';
  end if;
  if v_total >= v_sale.agreed_price then
    update public.sales set status='sold',sold_at=now() where id=p_sale_id;
    update public.vehicles set status='sold',updated_at=now() where id=v_sale.vehicle_id;
  else
    update public.vehicles set status='reserved',updated_at=now() where id=v_sale.vehicle_id;
  end if;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
  values(auth.uid(),'payment_recorded','payment',v_payment::text,jsonb_build_object('sale_id',p_sale_id,'kind',p_kind,'amount',p_amount,'reference_no',trim(p_reference_no)));
  return v_payment;
end $function$;

-- Edit jualan (Owner): kira semula status bila harga diubah.
create or replace function public.update_sale_details(p_sale_id text, p_customer_id text, p_agreed_price numeric, p_sale_date date)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_paid numeric;
  v_n int;
  v_vehicle uuid;
begin
  if public.ada_current_role() is distinct from 'owner' then
    raise exception 'Hanya Owner boleh edit jualan.';
  end if;
  if p_agreed_price is null or p_agreed_price <= 0 then
    raise exception 'Harga dipersetujui mesti lebih daripada 0.';
  end if;
  if p_customer_id is not null and not exists (select 1 from public.customers c where c.id::text = p_customer_id) then
    raise exception 'Pelanggan tidak dijumpai.';
  end if;

  select coalesce(sum(amount), 0) into v_paid from public.payments where sale_id::text = p_sale_id;
  if v_paid > p_agreed_price then
    raise exception 'Harga baharu (RM %) kurang daripada jumlah yang sudah dibayar (RM %).', p_agreed_price, v_paid;
  end if;

  execute format(
    'update public.sales s set agreed_price = $1,
            customer_id = coalesce($2::%s, s.customer_id),
            created_at  = case when $3 is null then s.created_at
                               else ($3::date + (s.created_at at time zone ''Asia/Kuala_Lumpur'')::time) at time zone ''Asia/Kuala_Lumpur'' end
      where s.id::text = $4',
    (select format_type(atttypid, atttypmod) from pg_attribute
      where attrelid = 'public.sales'::regclass and attname = 'customer_id'))
  using p_agreed_price, p_customer_id, p_sale_date, p_sale_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Jualan tidak dijumpai.'; end if;

  select vehicle_id into v_vehicle from public.sales where id::text = p_sale_id;
  if v_paid >= p_agreed_price then
    update public.sales set status='sold', sold_at=coalesce(sold_at, now()) where id::text = p_sale_id and status <> 'sold';
    update public.vehicles set status='sold', updated_at=now() where id = v_vehicle and status <> 'sold';
  else
    update public.sales set status='reserved', sold_at=null where id::text = p_sale_id and status = 'sold';
    update public.vehicles set status='reserved', updated_at=now() where id = v_vehicle and status = 'sold';
  end if;
end
$function$;

-- Betulkan jualan sedia ada yang sudah dibayar penuh tetapi masih Reserved.
with paid as (
  select s.id, s.vehicle_id
  from public.sales s join public.payments p on p.sale_id = s.id
  where s.status = 'reserved'
  group by s.id, s.vehicle_id, s.agreed_price
  having sum(p.amount) >= s.agreed_price
), upd as (
  update public.sales s set status='sold', sold_at=now() from paid where s.id = paid.id returning s.vehicle_id
)
update public.vehicles v set status='sold', updated_at=now() from upd where v.id = upd.vehicle_id;
