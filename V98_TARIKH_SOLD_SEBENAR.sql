-- Abe Din Auto V98: sold_at = tarikh sebenar jualan selesai, bukan masa rekod dimasukkan.
-- sold_at = tarikh bayaran terakhir (confirmed_at) yang melengkapkan bayaran, tidak lebih awal daripada tarikh jualan.
-- Sebelum ini fungsi jualan guna now(), jadi jualan lama yang direkod kemudian semua jatuh pada bulan rekod dimasukkan.

create or replace function public.sales_sold_at_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status::text = 'sold' then
    new.sold_at := greatest(new.created_at, coalesce((select max(confirmed_at) from public.payments where sale_id = new.id), new.created_at));
  else
    new.sold_at := null;
  end if;
  return new;
end $$;
revoke all on function public.sales_sold_at_sync() from public, anon, authenticated;
drop trigger if exists sales_sold_at_sync_trg on public.sales;
create trigger sales_sold_at_sync_trg before insert or update of status, sold_at, created_at on public.sales
  for each row execute function public.sales_sold_at_sync();

-- Bila tarikh bayaran ditambah/diubah/dipadam -> kira semula sold_at jualan berkenaan
create or replace function public.payments_sold_at_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.sales set sold_at = sold_at
   where id in (coalesce(new.sale_id, old.sale_id), coalesce(old.sale_id, new.sale_id)) and status::text = 'sold';
  return null;
end $$;
revoke all on function public.payments_sold_at_sync() from public, anon, authenticated;
drop trigger if exists payments_sold_at_sync_trg on public.payments;
create trigger payments_sold_at_sync_trg after insert or update of confirmed_at, amount or delete on public.payments
  for each row execute function public.payments_sold_at_sync();

-- Betulkan data sedia ada
update public.sales set sold_at = sold_at where status::text = 'sold';

-- ===== V98b: atas permintaan Owner — tarikh Sold SAMA dengan tarikh jualan =====
create or replace function public.sales_sold_at_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status::text = 'sold' then new.sold_at := new.created_at; else new.sold_at := null; end if;
  return new;
end $$;
update public.sales set sold_at = sold_at where status::text = 'sold';
