-- V75: Status katalog awam ikut jualan secara automatik.
-- Sold/Reserved daripada modul Jualan mengatasi status katalog manual (sama seperti paparan Inventori).
create or replace function public.get_public_catalogue(p_vehicle_id text default null::text)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public', 'storage'
as $function$
  select coalesce(jsonb_agg(row_data order by (row_data->>'created_at') desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', v.id,
      'vehicle_id', v.vehicle_id,
      'make', v.make,
      'model', v.model,
      'model_year', v.model_year,
      'mileage_km', v.mileage_km,
      'plate', v.plate,
      'asking_price', v.asking_price,
      'status', case
        when v.status::text = 'sold' or lower(coalesce(v.catalogue_status::text,'')) = 'sold' then 'sold'
        when v.status::text = 'reserved' or (lower(coalesce(v.catalogue_status::text,'')) = 'reserved' and v.status::text = 'available') then 'reserved'
        else v.catalogue_status::text end,
      'created_at', v.created_at,
      'images', coalesce((
        select jsonb_agg(jsonb_build_object(
          'storage_path', vi.storage_path,
          'sort_order', vi.sort_order,
          'is_cover', vi.is_cover
        ) order by vi.is_cover desc, vi.sort_order asc)
        from public.vehicle_images vi
        where vi.vehicle_id = v.id
      ), '[]'::jsonb)
    ) as row_data
    from public.vehicles v
    where v.is_published = true
      and (p_vehicle_id is null or v.vehicle_id = p_vehicle_id)
  ) q;
$function$;
