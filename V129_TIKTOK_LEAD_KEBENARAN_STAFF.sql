-- V129: Menu TikTok Lead boleh diaktifkan untuk mana-mana staff (kebenaran "tiktok" dalam profil staff).
-- Lalai: Owner + Sales Advisor = ON; Operations = OFF (Owner boleh ON di Staff → edit → Akses menu).
create or replace function public.tiktok_access()
 returns text language sql stable security definer set search_path to 'public' as $$
  select case
    when p.role::text = 'owner' then 'owner'
    when coalesce((p.permissions->>'tiktok')::boolean, p.role::text = 'sales_advisor') then 'staff'
    else null end
  from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;
grant execute on function public.tiktok_access() to authenticated;

alter policy tiktok_read on public.tiktok_leads using ((select public.tiktok_access()) is not null);
alter policy tiktok_update on public.tiktok_leads using ((select public.tiktok_access()) is not null) with check ((select public.tiktok_access()) is not null);
alter policy wa_tpl_read on public.tiktok_wa_templates using ((select public.tiktok_access()) is not null);

create or replace function public.tiktok_leads_guard_assign()
 returns trigger language plpgsql security definer set search_path to 'public' as $$
declare r text := coalesce(public.tiktok_access(), '');
begin
  if new.assigned_to is distinct from old.assigned_to and auth.uid() is not null and r <> 'owner' then
    if not (r = 'staff' and new.assigned_to = auth.uid()
            and (old.assigned_to is null or exists(select 1 from public.profiles p where p.id = old.assigned_to and (p.role::text = 'owner' or p.enabled = false)))) then
      raise exception 'Lead ini sudah dipegang staff lain. Hanya owner boleh tukar agihan.';
    end if;
  end if;
  return new;
end $$;

create or replace function public.tiktok_staff_names()
 returns table(id uuid, full_name text, role text) language sql stable security definer set search_path to 'public' as $$
  select p.id, p.full_name::text, p.role::text from public.profiles p
  where p.enabled
    and (p.role::text = 'owner' or coalesce((p.permissions->>'tiktok')::boolean, p.role::text = 'sales_advisor'))
    and public.tiktok_access() is not null
  order by p.full_name
$$;
