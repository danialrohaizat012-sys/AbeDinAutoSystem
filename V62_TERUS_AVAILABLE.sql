-- Abe Din Auto V62: kereta terus "available" (bahagian inspection sudah dibuang)
-- Jalankan sekali dalam Supabase SQL Editor. Selamat dijalankan semula.
--
-- Dulu kereta hanya bertukar dari 'preparation' ke 'available' bila inspection ditandakan selesai.
-- Inspection sudah dibuang, jadi kereta tersekat di 'preparation'.
--   1. Kereta sedia ada yang masih 'preparation' ditukar ke 'available'.
--   2. Kereta baharu yang didaftarkan sebagai 'preparation' terus disimpan sebagai 'available'.
-- Status 'reserved' dan 'sold' tidak disentuh.

-- 1. Baiki kereta sedia ada
update public.vehicles
set status = 'available'
where status::text = 'preparation';

-- 2. Kereta baharu terus available
create or replace function public.vehicles_default_available()
returns trigger
language plpgsql
as $$
begin
  if new.status::text = 'preparation' then
    new.status := 'available';
  end if;
  return new;
end $$;

drop trigger if exists vehicles_default_available_trg on public.vehicles;
create trigger vehicles_default_available_trg
  before insert on public.vehicles
  for each row execute function public.vehicles_default_available();

-- Semakan: patut tiada lagi kereta 'preparation'
select status::text as status, count(*) from public.vehicles group by 1 order by 1;
