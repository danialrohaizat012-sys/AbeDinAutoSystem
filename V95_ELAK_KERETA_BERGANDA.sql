-- Abe Din Auto V95: Elak kereta berganda dalam inventori.
-- * No. plat diseragamkan automatik: huruf besar, buang ruang/sengkang/simbol ("dcq 5569" -> "DCQ5569").
-- * Jika no. plat sudah wujud -> ditolak dengan mesej jelas (Vehicle ID, kereta & status rekod sedia ada).
-- * Indeks unik vehicles_plate_key (sedia ada) kekal sebagai benteng terakhir.
-- * Fungsi vehicle_plate_check() untuk semakan segera semasa menaip di borang Daftar Kereta.

create or replace function public.vehicles_plate_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  new.plate := nullif(upper(regexp_replace(coalesce(new.plate, ''), '[^A-Za-z0-9]', '', 'g')), '');
  if new.plate is null then raise exception 'No. pendaftaran kereta diperlukan.'; end if;
  if tg_op = 'UPDATE' and new.plate = old.plate then return new; end if;
  select vehicle_id, make, model, model_year, status::text as status into v
    from public.vehicles where plate = new.plate and id <> new.id limit 1;
  if found then
    raise exception 'Kereta % sudah ada dalam inventori (% · % % % · status: %). Tidak boleh daftar dua kali.',
      new.plate, v.vehicle_id, coalesce(v.model_year::text, ''), coalesce(v.make, ''), coalesce(v.model, ''), v.status
      using errcode = '23505';
  end if;
  return new;
end $$;
revoke all on function public.vehicles_plate_guard() from public, anon, authenticated;
drop trigger if exists vehicles_plate_guard_trg on public.vehicles;
create trigger vehicles_plate_guard_trg before insert or update of plate on public.vehicles
  for each row execute function public.vehicles_plate_guard();

create or replace function public.vehicle_plate_check(p_plate text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('vehicle_id', vehicle_id, 'plate', plate, 'make', make, 'model', model,
                            'model_year', model_year, 'status', status::text)
  from public.vehicles
  where public.att_role() is not null
    and plate = upper(regexp_replace(coalesce(p_plate, ''), '[^A-Za-z0-9]', '', 'g'))
  limit 1
$$;
revoke all on function public.vehicle_plate_check(text) from public, anon;
grant execute on function public.vehicle_plate_check(text) to authenticated;
