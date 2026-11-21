-- Abe Din Auto V105: jumlah bayaran boleh berbeza daripada harga jualan (harga dikunci dari inventori di app).
create or replace function public.update_payment_record(p_payment_id text, p_kind text, p_amount numeric, p_reference_no text, p_notes text, p_paid_date date)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare
  v_sale text;
  v_n int;
begin
  if public.ada_current_role() is distinct from 'owner' then
    raise exception 'Hanya Owner boleh edit rekod bayaran.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Jumlah bayaran mesti lebih daripada 0.';
  end if;
  if coalesce(trim(p_reference_no), '') = '' then
    raise exception 'No. rujukan diperlukan.';
  end if;
  select p.sale_id::text into v_sale from public.payments p where p.id::text = p_payment_id;
  if v_sale is null then raise exception 'Rekod bayaran tidak dijumpai.'; end if;
  execute format(
    'update public.payments p set kind = $1::%s, amount = $2, reference_no = $3, notes = $4,
            confirmed_at = case when $5 is null then p.confirmed_at
                                else ($5::date + (coalesce(p.confirmed_at, now()) at time zone ''Asia/Kuala_Lumpur'')::time) at time zone ''Asia/Kuala_Lumpur'' end
      where p.id::text = $6',
    (select format_type(atttypid, atttypmod) from pg_attribute
      where attrelid = 'public.payments'::regclass and attname = 'kind'))
  using p_kind, p_amount, trim(p_reference_no), nullif(trim(p_notes), ''), p_paid_date, p_payment_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Rekod bayaran tidak dijumpai.'; end if;
end
$function$;

-- V105b & V105c (sudah dipasang): buang sekatan "harga kurang daripada jumlah dibayar" dalam update_sale_details
-- dan sekatan "bayaran tidak boleh melebihi harga jualan" dalam create_vehicle_sale_with_details.
-- Jumlah dibayar boleh lebih atau kurang daripada harga inventori; status Sold/Reserved masih ikut sama ada dibayar >= harga.
