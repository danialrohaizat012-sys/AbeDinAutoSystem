-- Abe Din Auto V100: Consignment — bayaran kepada tuan bukan modal, Ditarik / Dijual tuan, tuntutan kos.
alter table public.vehicles
  add column if not exists consign_owner text,
  add column if not exists consign_phone text,
  add column if not exists withdrawn_at timestamptz,
  add column if not exists withdraw_reason text,
  add column if not exists withdraw_note text,
  add column if not exists withdraw_cost numeric not null default 0,
  add column if not exists withdraw_cost_action text,
  add column if not exists withdraw_claim_paid_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='vehicles_withdraw_cost_action_check') then
    alter table public.vehicles add constraint vehicles_withdraw_cost_action_check check (withdraw_cost_action is null or withdraw_cost_action in ('claim','writeoff','none'));
  end if;
  if not exists (select 1 from pg_constraint where conname='vehicles_withdraw_cost_check') then
    alter table public.vehicles add constraint vehicles_withdraw_cost_check check (withdraw_cost >= 0);
  end if;
end $$;
create or replace function public.vehicles_withdraw_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.withdrawn_at is not null then
    if new.acquisition_type is distinct from 'consignment' then
      raise exception 'Hanya kereta Consignment boleh ditanda Ditarik / Dijual tuan.';
    end if;
    if exists (select 1 from public.sales s where s.vehicle_id = new.id and lower(s.status::text) not in ('cancelled','canceled','void')) then
      raise exception 'Kereta ini ada rekod jualan aktif. Batalkan jualan dahulu sebelum tanda Ditarik.';
    end if;
    new.is_published := false;
  else
    new.withdraw_reason := null; new.withdraw_note := null; new.withdraw_cost := 0;
    new.withdraw_cost_action := null; new.withdraw_claim_paid_at := null;
  end if;
  return new;
end $$;
create or replace trigger vehicles_withdraw_guard_trg before insert or update on public.vehicles
  for each row execute function public.vehicles_withdraw_guard();
create or replace function public.sales_block_withdrawn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.vehicles v where v.id = new.vehicle_id and v.withdrawn_at is not null) then
    raise exception 'Kereta ini sudah ditarik / dijual oleh tuan. Aktifkan semula dahulu jika mahu menjual.';
  end if;
  return new;
end $$;
create or replace trigger sales_block_withdrawn_trg before insert on public.sales
  for each row execute function public.sales_block_withdrawn();
revoke all on function public.vehicles_withdraw_guard() from public, anon, authenticated;
revoke all on function public.sales_block_withdrawn() from public, anon, authenticated;
