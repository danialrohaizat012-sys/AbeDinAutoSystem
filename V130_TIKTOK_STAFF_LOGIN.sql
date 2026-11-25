-- V130: TikTok Lead – staff ikut akaun yang login
-- * Sales advisor yang hubungi lead (WhatsApp / tukar status) automatik jadi staff lead itu,
--   jika lead belum diambil (tiada staff atau masih di bawah owner).
-- * Senarai nama staff untuk label (sales advisor tak boleh baca profiles orang lain).
create or replace function public.tiktok_leads_guard_assign() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r text := coalesce(public.current_staff_role()::text, '');
begin
  if new.assigned_to is distinct from old.assigned_to and auth.uid() is not null and r <> 'owner' then
    -- sales advisor hanya boleh ambil lead untuk diri sendiri, dan hanya lead yang belum diambil
    if not (r = 'sales_advisor' and new.assigned_to = auth.uid()
            and (old.assigned_to is null or exists(select 1 from public.profiles p where p.id = old.assigned_to and (p.role::text = 'owner' or p.enabled = false)))) then
      raise exception 'Lead ini sudah dipegang staff lain. Hanya owner boleh tukar agihan.';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.tiktok_leads_guard_assign() from public, anon, authenticated;

create or replace function public.tiktok_staff_names()
returns table(id uuid, full_name text, role text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.full_name::text, p.role::text from public.profiles p
  where p.enabled and p.role::text in ('owner','sales_advisor')
    and public.current_staff_role()::text in ('owner','sales_advisor')
  order by p.full_name
$$;
revoke all on function public.tiktok_staff_names() from public, anon;
grant execute on function public.tiktok_staff_names() to authenticated;
