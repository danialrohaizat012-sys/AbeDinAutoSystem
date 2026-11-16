-- V63: Padam kenderaan dari Inventori (Owner sahaja)
-- Jalankan sekali dalam Supabase > SQL Editor.
--
-- Fungsi delete_vehicle(p_id):
--   * Hanya pengguna dengan role 'owner' (dan akaun aktif) boleh padam.
--   * Kenderaan yang ada rekod jualan TIDAK boleh dipadam, supaya rekod
--     kewangan, bayaran dan untung rugi kekal betul.
--   * Padam sekali rekod inspection lama, item inspection dan rekod gambar.
--   * Memulangkan senarai storage_path gambar supaya app boleh buang fail
--     gambar dari bucket 'vehicle-images'.

create or replace function public.delete_vehicle(p_id uuid)
returns table(storage_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  text;
  v_sales int;
  v_paths text[];
begin
  select p.role::text into v_role
    from public.profiles p
   where p.id = auth.uid()
     and coalesce(p.enabled, true);

  if v_role is distinct from 'owner' then
    raise exception 'Hanya Owner boleh padam kenderaan.';
  end if;

  if not exists (select 1 from public.vehicles v where v.id = p_id) then
    raise exception 'Kenderaan tidak dijumpai.';
  end if;

  select count(*) into v_sales from public.sales s where s.vehicle_id = p_id;
  if v_sales > 0 then
    raise exception 'Kenderaan ini ada % rekod jualan, jadi tidak boleh dipadam. Tanda sebagai Sold atau Unpublish sahaja.', v_sales;
  end if;

  select array_agg(vi.storage_path) into v_paths
    from public.vehicle_images vi
   where vi.vehicle_id = p_id;

  delete from public.inspection_items
   where inspection_id in (select i.id from public.inspections i where i.vehicle_id = p_id);
  delete from public.inspections    where vehicle_id = p_id;
  delete from public.vehicle_images where vehicle_id = p_id;
  delete from public.vehicles       where id = p_id;

  return query select unnest(coalesce(v_paths, '{}'::text[]));
end
$$;

revoke all on function public.delete_vehicle(uuid) from public, anon;
grant execute on function public.delete_vehicle(uuid) to authenticated;

-- Semak: fungsi wujud
select proname from pg_proc where proname = 'delete_vehicle';
