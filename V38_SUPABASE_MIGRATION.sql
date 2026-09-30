-- Abe Din Auto V38: financing + promotional price
-- Run once in Supabase SQL Editor BEFORE deploying V38.

alter table public.vehicles
  add column if not exists monthly_installment numeric(12,2),
  add column if not exists promo_price numeric(12,2);

-- Data integrity: blank = NULL. Promo must be below the normal asking price.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vehicles_monthly_installment_positive') then
    alter table public.vehicles add constraint vehicles_monthly_installment_positive
      check (monthly_installment is null or monthly_installment > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vehicles_promo_price_valid') then
    alter table public.vehicles add constraint vehicles_promo_price_valid
      check (promo_price is null or (promo_price > 0 and promo_price < asking_price));
  end if;
end $$;

-- Small public-safe RPC. This avoids changing the existing catalogue RPC/RLS.
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
    and lower(v.status::text) in ('available','reserved','sold');
$$;

revoke all on function public.get_public_vehicle_offers() from public;
grant execute on function public.get_public_vehicle_offers() to anon, authenticated;
