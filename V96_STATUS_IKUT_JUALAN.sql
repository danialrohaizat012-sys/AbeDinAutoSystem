-- Abe Din Auto V96: Status kereta ikut rekod jualan.
-- * Reserved : boleh ditanda manual dalam Inventori (tempahan), ATAU automatik bila jualan dibuka tetapi belum bayar penuh.
-- * Sold     : TIDAK boleh ditanda manual. Hanya berlaku bila ada rekod jualan yang sudah dibayar penuh.
-- * Kereta yang ada rekod jualan: status ikut jualan, tidak boleh diubah manual.
-- Rekod lama (catalogue_status 'sold' tanpa jualan) tidak disentuh oleh trigger ini.

create or replace function public.set_catalogue_status(p_vehicle_id uuid, p_status text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.staff_role; s text := lower(trim(coalesce(p_status, ''))); v_st text;
begin
  r := public.current_staff_role();
  if r is null or r not in ('owner','sales_advisor') then raise exception 'Owner atau Sales Advisor sahaja boleh ubah status'; end if;
  if s = 'sold' then
    raise exception 'Status Sold tidak boleh ditanda manual. Sold hanya berlaku melalui rekod jualan yang sudah dibayar penuh.';
  end if;
  if s not in ('available','reserved') then raise exception 'Status tidak sah'; end if;
  select status::text into v_st from public.vehicles where id = p_vehicle_id;
  if not found then raise exception 'Kenderaan tidak ditemui'; end if;
  if exists (select 1 from public.sales where vehicle_id = p_vehicle_id) then
    raise exception 'Kereta ini ada rekod jualan — status ikut jualan (%) dan tidak boleh diubah manual.', v_st;
  end if;
  update public.vehicles set catalogue_status = s, updated_at = now() where id = p_vehicle_id;
  insert into public.audit_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'catalogue_status_update', 'vehicle', p_vehicle_id::text, jsonb_build_object('catalogue_status', s));
  return s;
end $$;

create or replace function public.vehicles_status_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_sold boolean;
begin
  select exists (select 1 from public.sales where vehicle_id = new.id and status::text = 'sold') into v_sold;
  if new.status::text = 'sold' and old.status::text is distinct from 'sold' and not v_sold then
    raise exception 'Status Sold hanya boleh melalui rekod jualan yang sudah dibayar penuh.';
  end if;
  if old.status::text = 'sold' and new.status::text <> 'sold' and v_sold then
    raise exception 'Kereta ini sudah dijual (ada rekod jualan). Status tidak boleh diubah manual.';
  end if;
  if lower(coalesce(new.catalogue_status, '')) = 'sold' and lower(coalesce(old.catalogue_status, '')) <> 'sold' and not v_sold then
    raise exception 'Status Sold tidak boleh ditanda manual. Sold hanya berlaku melalui rekod jualan.';
  end if;
  return new;
end $$;
revoke all on function public.vehicles_status_guard() from public, anon, authenticated;
drop trigger if exists vehicles_status_guard_trg on public.vehicles;
create trigger vehicles_status_guard_trg before update of status, catalogue_status on public.vehicles
  for each row execute function public.vehicles_status_guard();
