-- V83: create one sale and optional first payment in one transaction.
-- Matches the fields of Edit Jualan without changing old RPC signatures.
create or replace function public.create_vehicle_sale_with_details(
  p_vehicle_id uuid,
  p_customer_id uuid,
  p_agreed_price numeric,
  p_sale_date date default null,
  p_payment_kind text default null,
  p_payment_amount numeric default null,
  p_payment_method text default null,
  p_loan_bank text default null,
  p_payment_reference text default null,
  p_payment_note text default null,
  p_paid_date date default null,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_customer_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_sale uuid;
  v_payment uuid;
  v_kind public.payment_kind;
  v_notes text;
  v_method text;
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if auth.uid() is null or public.current_staff_role() not in ('owner','sales_advisor') then
    raise exception 'Not authorized to create a vehicle sale';
  end if;
  if p_sale_date is not null and p_sale_date > v_today then
    raise exception 'Tarikh jualan tidak boleh pada masa hadapan';
  end if;
  if p_paid_date is not null and p_paid_date > v_today then
    raise exception 'Tarikh bayaran tidak boleh pada masa hadapan';
  end if;
  if p_payment_kind is null then
    if p_payment_amount is not null or nullif(trim(coalesce(p_payment_reference,'')),'') is not null or p_paid_date is not null then
      raise exception 'Pilih jenis bayaran sebelum mengisi maklumat bayaran';
    end if;
  elsif p_payment_kind not in ('deposit','full_payment') then
    raise exception 'Jenis bayaran tidak sah';
  elsif coalesce(p_payment_amount,0) <= 0 then
    raise exception 'Jumlah bayaran mesti melebihi sifar';
  elsif nullif(trim(coalesce(p_payment_reference,'')),'') is null then
    raise exception 'No. rujukan bayaran diperlukan';
  elsif p_payment_amount > p_agreed_price then
    raise exception 'Bayaran tidak boleh melebihi harga jualan';
  end if;

  v_sale := public.create_vehicle_sale(p_vehicle_id,p_customer_id,p_agreed_price);
  if p_customer_name is not null then
    perform public.update_customer_details(p_customer_id::text,p_customer_name,coalesce(p_customer_phone,''),coalesce(p_customer_email,''));
  end if;
  if p_sale_date is not null then
    update public.sales
    set created_at = (p_sale_date::timestamp + (now() at time zone 'Asia/Kuala_Lumpur')::time) at time zone 'Asia/Kuala_Lumpur'
    where id=v_sale;
  end if;

  if p_payment_kind is not null then
    v_kind := p_payment_kind::public.payment_kind;
    v_method := nullif(trim(coalesce(p_payment_method,'')),'');
    if v_method = 'Loan Bank' and nullif(trim(coalesce(p_loan_bank,'')),'') is not null then
      v_method := 'Loan Bank · ' || replace(replace(trim(p_loan_bank),'[',''),']','');
    end if;
    v_notes := concat_ws(' ',case when v_method is not null then '[Kaedah: '||v_method||']' end,nullif(trim(coalesce(p_payment_note,'')),''));
    v_payment := public.record_sale_payment(v_sale,v_kind,p_payment_amount,trim(p_payment_reference),nullif(v_notes,''));
    if p_paid_date is not null then
      update public.payments
      set confirmed_at = (p_paid_date::timestamp + (now() at time zone 'Asia/Kuala_Lumpur')::time) at time zone 'Asia/Kuala_Lumpur'
      where id=v_payment;
    end if;
  end if;
  return v_sale;
end;
$fn$;

revoke all on function public.create_vehicle_sale_with_details(uuid,uuid,numeric,date,text,numeric,text,text,text,text,date,text,text,text) from public;
revoke all on function public.create_vehicle_sale_with_details(uuid,uuid,numeric,date,text,numeric,text,text,text,text,date,text,text,text) from anon;
grant execute on function public.create_vehicle_sale_with_details(uuid,uuid,numeric,date,text,numeric,text,text,text,text,date,text,text,text) to authenticated;
