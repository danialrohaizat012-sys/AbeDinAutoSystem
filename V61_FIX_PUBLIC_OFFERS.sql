-- Abe Din Auto V61: baiki harga promosi & ansuran minimum tidak keluar di katalog awam
-- Jalankan sekali dalam Supabase SQL Editor. Selamat dijalankan semula.
--
-- Punca: get_public_vehicle_offers() (V38) hanya memulangkan kereta yang status sistemnya
-- 'available', 'reserved' atau 'sold'. Kereta yang sudah dipublish ke katalog tetapi status
-- sistemnya masih lain (cth: 'preparation') tetap dipapar dalam katalog, tetapi harga promosi
-- dan ansurannya tidak dihantar ke katalog awam.
-- Pembetulan: ikut syarat yang sama dengan katalog, iaitu semua kereta yang dipublish.

create or replace function public.get_public_vehicle_offers()
returns table(vehicle_id text, monthly_installment numeric, promo_price numeric)
language sql
security definer
set search_path = public
stable
as $$
  select v.vehicle_id::text, v.monthly_installment, v.promo_price
  from public.vehicles v
  where v.is_published = true
    and v.vehicle_id is not null
    and (v.monthly_installment is not null or v.promo_price is not null);
$$;

revoke all on function public.get_public_vehicle_offers() from public;
grant execute on function public.get_public_vehicle_offers() to anon, authenticated;

-- Semakan: senarai kereta dipublish yang ada harga promosi / ansuran
select v.vehicle_id, v.plate, v.status, v.catalogue_status, v.asking_price, v.promo_price, v.monthly_installment
from public.vehicles v
where v.is_published = true and (v.promo_price is not null or v.monthly_installment is not null)
order by v.vehicle_id;
