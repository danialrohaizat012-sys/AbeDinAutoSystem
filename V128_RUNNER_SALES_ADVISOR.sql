-- V128: Modul Runner dibuka kepada Sales Advisor (hak sama seperti staf Operation).
-- runner_role() kini memetakan sales_advisor → 'operations' supaya semua polisi & guard Runner sedia ada terpakai.
-- Owner masih boleh tutup Runner untuk staff tertentu melalui kebenaran staff (permissions.runner = false).
create or replace function public.runner_role()
 returns text language sql stable security definer set search_path to 'public' as $$
  select case
           when p.role::text = 'owner' then 'owner'
           when coalesce((p.permissions->>'runner')::boolean, true) is false then null
           when p.role::text in ('operations','sales_advisor') then 'operations'
           else p.role::text end
  from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;

create or replace function public.runner_staff_choices()
 returns table(id uuid, full_name text) language sql stable security definer set search_path to 'public' as $$
  select p.id, p.full_name from public.profiles p
  where auth.uid() is not null and public.runner_role() in ('owner','operations')
    and p.enabled is true and p.role::text in ('owner','operations','sales_advisor')
  order by p.full_name, id
$$;

create or replace function public.runner_trips_guard()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare r text:=public.runner_role();
begin
 if r is null or r not in ('owner','operations') then
   raise exception 'Tiada akses modul Runner.';
 end if;
 if tg_op='INSERT' then
   if r<>'owner' then new.upah:=0; end if;
   new.created_by:=auth.uid();
   return new;
 end if;
 if new.upah is distinct from old.upah and exists
   (select 1 from public.runner_upah_requests x
    where x.trip_id=old.id and x.status='pending') then
   raise exception 'Selesaikan permohonan upah sebelum ubah jumlah.';
 end if;
 if r<>'owner' then
   if new.upah is distinct from old.upah
     or new.created_ms is distinct from old.created_ms
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.id is distinct from old.id then
     raise exception 'Hanya Owner boleh ubah upah atau maklumat pemilikan rekod.';
   end if;
   if new.exp is distinct from old.exp and exists
     (select 1 from public.runner_payments p where p.trip_id=old.id) then
     raise exception 'Trip sudah dibayar, tuntutan dikunci.';
   end if;
 end if;
 if new.assigned_to is not null and not exists
   (select 1 from public.profiles p where p.id=new.assigned_to
    and p.enabled is true and p.role::text in ('owner','operations','sales_advisor')) then
   raise exception 'Staf bertanggungjawab mesti staf aktif (Operation / Sales Advisor) atau Owner.';
 end if;
 return new;
end $function$;
