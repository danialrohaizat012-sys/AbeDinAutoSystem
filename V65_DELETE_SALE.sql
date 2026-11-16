-- V65: Padam / batal jualan dari halaman Jualan (Owner sahaja)
-- Jalankan sekali dalam Supabase > SQL Editor. Selamat dijalankan semula.
--
-- delete_sale(p_sale_id):
--   * Hanya Owner (akaun aktif).
--   * Padam semua rekod bayaran jualan tersebut, kemudian padam jualan.
--   * Kenderaan dipulangkan ke status 'available' jika tiada jualan lain untuknya.

create or replace function public.delete_sale(p_sale_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle text;
  v_role text;
begin
  select p.role::text into v_role from public.profiles p
   where p.id = auth.uid() and coalesce(p.enabled, true);
  if v_role is distinct from 'owner' then
    raise exception 'Hanya Owner boleh padam jualan.';
  end if;

  select s.vehicle_id::text into v_vehicle from public.sales s where s.id::text = p_sale_id;
  if not found then raise exception 'Jualan tidak dijumpai.'; end if;

  delete from public.payments where sale_id::text = p_sale_id;
  delete from public.sales    where id::text = p_sale_id;

  if v_vehicle is not null and not exists (select 1 from public.sales s where s.vehicle_id::text = v_vehicle) then
    execute format('update public.vehicles set status = $1::%s where id::text = $2',
      (select format_type(atttypid, atttypmod) from pg_attribute
        where attrelid = 'public.vehicles'::regclass and attname = 'status'))
    using 'available', v_vehicle;
  end if;
end
$$;

revoke all on function public.delete_sale(text) from public, anon;
grant execute on function public.delete_sale(text) to authenticated;

select proname from pg_proc where proname = 'delete_sale';
