-- V130: Edit maklumat lead TikTok (nama, telefon, bandar, negeri, pekerjaan) — Owner sahaja.
create or replace function public.tiktok_leads_guard_assign()
 returns trigger language plpgsql security definer set search_path to 'public' as $$
declare r text := coalesce(public.tiktok_access(), '');
begin
  if auth.uid() is not null and r <> 'owner' and (
       new.name is distinct from old.name or new.phone is distinct from old.phone or new.city is distinct from old.city
       or new.state is distinct from old.state or new.occupation is distinct from old.occupation) then
    raise exception 'Hanya owner boleh ubah maklumat lead.';
  end if;
  if new.assigned_to is distinct from old.assigned_to and auth.uid() is not null and r <> 'owner' then
    if not (r = 'staff' and new.assigned_to = auth.uid()
            and (old.assigned_to is null or exists(select 1 from public.profiles p where p.id = old.assigned_to and (p.role::text = 'owner' or p.enabled = false)))) then
      raise exception 'Lead ini sudah dipegang staff lain. Hanya owner boleh tukar agihan.';
    end if;
  end if;
  return new;
end $$;

-- V130b: trigger guard_assign hanya untuk "UPDATE OF assigned_to" — tambah trigger berasingan untuk maklumat lead.
create or replace function public.tiktok_leads_guard_info()
 returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is not null and coalesce(public.tiktok_access(), '') <> 'owner' and (
       new.name is distinct from old.name or new.phone is distinct from old.phone or new.city is distinct from old.city
       or new.state is distinct from old.state or new.occupation is distinct from old.occupation) then
    raise exception 'Hanya owner boleh ubah maklumat lead.';
  end if;
  return new;
end $$;
create trigger tiktok_leads_guard_info before update of name, phone, city, state, occupation on public.tiktok_leads
  for each row execute function public.tiktok_leads_guard_info();
