-- V70: Owner boleh padam pelanggan (disekat jika pelanggan ada rekod jualan). Selamat dijalankan semula.
create or replace function public.delete_customer(p_customer_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_role text; v_n int;
begin
  select p.role::text into v_role from public.profiles p where p.id = auth.uid() and coalesce(p.enabled,true);
  if v_role is distinct from 'owner' then raise exception 'Hanya Owner boleh padam pelanggan.'; end if;
  if not exists (select 1 from public.customers where id::text = p_customer_id) then raise exception 'Pelanggan tidak dijumpai.'; end if;
  select count(*) into v_n from public.sales where customer_id::text = p_customer_id;
  if v_n > 0 then raise exception 'Pelanggan ini ada % rekod jualan. Padam jualan dahulu.', v_n; end if;
  delete from public.customers where id::text = p_customer_id;
end $$;
revoke all on function public.delete_customer(text) from public, anon;
grant execute on function public.delete_customer(text) to authenticated;
