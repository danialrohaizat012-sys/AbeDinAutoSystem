-- V64: Edit jualan, rekod bayaran dan maklumat pelanggan (dari butang Edit di halaman Jualan)
-- Jalankan sekali dalam Supabase > SQL Editor. Selamat dijalankan semula.
--
--   update_sale_details      : tukar pelanggan, harga dipersetujui, tarikh jualan  (Owner)
--   update_payment_record    : betulkan jenis, jumlah, no. rujukan, nota, tarikh   (Owner)
--   update_customer_details  : tukar nama, telefon, email pelanggan                (Owner / Sales Advisor)
--
-- Status jualan dan kenderaan TIDAK diubah oleh fungsi ini.

create or replace function public.ada_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text from public.profiles p
   where p.id = auth.uid() and coalesce(p.enabled, true)
$$;

-- 1. Maklumat jualan --------------------------------------------------------
create or replace function public.update_sale_details(
  p_sale_id text, p_customer_id text, p_agreed_price numeric, p_sale_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid numeric;
  v_n int;
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
end
$$;

-- 2. Rekod bayaran -----------------------------------------------------------
create or replace function public.update_payment_record(
  p_payment_id text, p_kind text, p_amount numeric, p_reference_no text, p_notes text, p_paid_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale text;
  v_price numeric;
  v_other numeric;
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

  select s.agreed_price into v_price from public.sales s where s.id::text = v_sale;
  select coalesce(sum(amount), 0) into v_other from public.payments where sale_id::text = v_sale and id::text <> p_payment_id;
  if v_other + p_amount > v_price then
    raise exception 'Jumlah bayaran melebihi harga jualan (baki maksimum RM %).', v_price - v_other;
  end if;

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
$$;

-- 3. Maklumat pelanggan ------------------------------------------------------
create or replace function public.update_customer_details(
  p_customer_id text, p_full_name text, p_phone text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  if coalesce(public.ada_current_role(), '') not in ('owner', 'sales_advisor') then
    raise exception 'Tiada kebenaran untuk edit pelanggan.';
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'Nama pelanggan diperlukan.';
  end if;
  update public.customers
     set full_name = trim(p_full_name),
         phone     = nullif(trim(p_phone), ''),
         email     = nullif(trim(p_email), '')
   where id::text = p_customer_id;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Pelanggan tidak dijumpai.'; end if;
end
$$;

revoke all on function public.ada_current_role() from public, anon;
revoke all on function public.update_sale_details(text, text, numeric, date) from public, anon;
revoke all on function public.update_payment_record(text, text, numeric, text, text, date) from public, anon;
revoke all on function public.update_customer_details(text, text, text, text) from public, anon;
grant execute on function public.ada_current_role() to authenticated;
grant execute on function public.update_sale_details(text, text, numeric, date) to authenticated;
grant execute on function public.update_payment_record(text, text, numeric, text, text, date) to authenticated;
grant execute on function public.update_customer_details(text, text, text, text) to authenticated;

-- Semak: tiga fungsi patut wujud
select proname from pg_proc where proname in ('update_sale_details', 'update_payment_record', 'update_customer_details');
