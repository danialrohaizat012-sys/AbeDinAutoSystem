-- Abe Din Auto V104: padam rekod bayaran (Owner) + kawalan jumlah bayaran = harga jualan.
-- Bahagian 1 (sudah dipasang): delete_payment_record asas.
-- Bahagian 2 (V104b): kawalan pangkalan data — bayaran tidak boleh melebihi harga; jualan Sold mesti dibayar sama dengan harga.
create or replace function public.payments_price_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_paid numeric; v_price numeric;
begin
  if tg_op = 'UPDATE' and new.amount is not distinct from old.amount and new.sale_id is not distinct from old.sale_id then return null; end if;
  select coalesce(sum(amount),0) into v_paid from public.payments where sale_id = new.sale_id;
  select agreed_price into v_price from public.sales where id = new.sale_id;
  if v_price is not null and v_paid > v_price + 0.009 then
    raise exception 'Jumlah bayaran (RM %) melebihi harga jualan (RM %). Semak semula jumlah bayaran.', to_char(v_paid,'FM999,999,990.00'), to_char(v_price,'FM999,999,990.00');
  end if;
  return null;
end $$;
create or replace trigger payments_price_guard_trg after insert or update on public.payments
  for each row execute function public.payments_price_guard();
create or replace function public.sales_price_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_paid numeric;
begin
  if new.agreed_price is not distinct from old.agreed_price then return null; end if;
  select coalesce(sum(amount),0) into v_paid from public.payments where sale_id = new.id;
  if v_paid > new.agreed_price + 0.009 then
    raise exception 'Harga jualan (RM %) lebih rendah daripada jumlah yang sudah dibayar (RM %). Ubah jumlah bayaran dahulu.', to_char(new.agreed_price,'FM999,999,990.00'), to_char(v_paid,'FM999,999,990.00');
  end if;
  if lower(new.status::text) = 'sold' and abs(v_paid - new.agreed_price) > 0.009 then
    raise exception 'Jualan Sold: harga jualan (RM %) mesti sama dengan jumlah dibayar (RM %).', to_char(new.agreed_price,'FM999,999,990.00'), to_char(v_paid,'FM999,999,990.00');
  end if;
  return null;
end $$;
create or replace trigger sales_price_guard_trg after update of agreed_price on public.sales
  for each row execute function public.sales_price_guard();
create or replace function public.delete_payment_record(p_payment_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p record; v_paid numeric; v_price numeric; v_status text;
begin
  if public.current_staff_role()::text is distinct from 'owner' then
    raise exception 'Hanya Owner boleh padam rekod bayaran.';
  end if;
  select * into p from public.payments where id = p_payment_id;
  if not found then raise exception 'Rekod bayaran tidak dijumpai.'; end if;
  select agreed_price, lower(status::text) into v_price, v_status from public.sales where id = p.sale_id;
  select coalesce(sum(amount),0) - p.amount into v_paid from public.payments where sale_id = p.sale_id;
  if v_status = 'sold' and abs(v_paid - v_price) > 0.009 then
    raise exception 'Tidak boleh padam: jualan ini Sold, selepas dipadam dibayar RM % tetapi harga RM %. Ubah jumlah bayaran supaya sama dengan harga jualan.', to_char(v_paid,'FM999,999,990.00'), to_char(v_price,'FM999,999,990.00');
  end if;
  insert into public.audit_logs(action, entity_type, entity_id, actor_id, details)
  values ('payment_deleted', 'payment', p.id::text, auth.uid(),
          jsonb_build_object('sale_id', p.sale_id, 'kind', p.kind, 'amount', p.amount, 'reference_no', p.reference_no, 'confirmed_at', p.confirmed_at, 'notes', p.notes));
  delete from public.payments where id = p_payment_id;
  return jsonb_build_object('paid', v_paid, 'price', v_price, 'balance', coalesce(v_price,0) - v_paid);
end $$;
revoke all on function public.delete_payment_record(uuid) from public, anon;
grant execute on function public.delete_payment_record(uuid) to authenticated;
revoke all on function public.payments_price_guard() from public, anon, authenticated;
revoke all on function public.sales_price_guard() from public, anon, authenticated;
