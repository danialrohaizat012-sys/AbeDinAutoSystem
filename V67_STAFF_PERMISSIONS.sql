-- Abe Din Auto V67: kawalan menu setiap staf (Tetapan -> Staf & Akses -> Edit).
-- Selamat dijalankan semula. Perlu V66_STAFF_MIGRATION.sql dahulu.
--
-- profiles.permissions (jsonb): {"pemeriksaan": true, "sales": false, ...}
--   kunci tiada = ikut lalai peranan; Owner sentiasa akses penuh.
-- Menu disorok di dashboard. Untuk Pemeriksaan, akses data juga disekat di pangkalan data.

alter table public.profiles add column if not exists permissions jsonb;

drop function if exists public.staff_list();
create function public.staff_list()
returns table (id uuid, email text, full_name text, role text, enabled boolean,
               created_at timestamptz, last_sign_in_at timestamptz, email_confirmed boolean, permissions jsonb)
language plpgsql
security definer
set search_path = public, auth
stable
as $$
begin
  if not public.staff_is_owner() then
    raise exception 'Hanya Owner boleh urus staf.';
  end if;
  return query
    select p.id, u.email::text, p.full_name::text, p.role::text, coalesce(p.enabled, false),
           u.created_at, u.last_sign_in_at, (u.email_confirmed_at is not null), p.permissions
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by coalesce(p.enabled, false) desc, p.full_name nulls last;
end $$;
revoke all on function public.staff_list() from public, anon;
grant execute on function public.staff_list() to authenticated;

drop function if exists public.staff_save(text, text, text, boolean);
drop function if exists public.staff_save(text, text, text, boolean, jsonb);
create function public.staff_save(p_email text, p_full_name text, p_role text, p_enabled boolean, p_permissions jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
  v_exists boolean;
begin
  if not public.staff_is_owner() then
    raise exception 'Hanya Owner boleh urus staf.';
  end if;
  if p_role not in ('owner', 'operations', 'sales_advisor') then
    raise exception 'Peranan tidak sah: %', p_role;
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'Nama staf diperlukan.';
  end if;
  if p_permissions is not null and jsonb_typeof(p_permissions) <> 'object' then
    raise exception 'Format kebenaran tidak sah.';
  end if;
  select u.id into v_id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  if v_id is null then
    raise exception 'Akaun dengan emel % belum wujud. Cipta akaun dahulu.', trim(p_email);
  end if;
  if v_id = auth.uid() and (p_role <> 'owner' or p_enabled is not true) then
    raise exception 'Anda tidak boleh nyahaktif atau turunkan peranan akaun sendiri.';
  end if;
  select exists (select 1 from public.profiles where id = v_id) into v_exists;
  if v_exists then
    execute format('update public.profiles set full_name = %L, role = %L, enabled = %L where id = %L',
                   trim(p_full_name), p_role, p_enabled, v_id);
  else
    execute format('insert into public.profiles (id, full_name, role, enabled) values (%L, %L, %L, %L)',
                   v_id, trim(p_full_name), p_role, p_enabled);
  end if;
  -- null = kekalkan kebenaran sedia ada (contoh: butang Aktifkan / Nyahaktif)
  if p_permissions is not null then
    update public.profiles set permissions = p_permissions where id = v_id;
  end if;
  return v_id;
end $$;
revoke all on function public.staff_save(text, text, text, boolean, jsonb) from public, anon;
grant execute on function public.staff_save(text, text, text, boolean, jsonb) to authenticated;

-- Pemeriksaan: staf yang menu Pemeriksaannya ditutup tidak boleh baca / tulis data checklist.
create or replace function public.checklist_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text from public.profiles p
  where p.id = auth.uid() and p.enabled is true
    and (p.role::text = 'owner' or coalesce((p.permissions->>'pemeriksaan')::boolean, true))
$$;
revoke all on function public.checklist_role() from public, anon;
grant execute on function public.checklist_role() to authenticated;
