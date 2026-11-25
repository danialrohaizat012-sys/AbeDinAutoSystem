-- V129: TikTok Lead – sales advisor nampak SEMUA lead; import (insert) owner sahaja;
--        sales advisor tidak boleh tukar agihan staff (assigned_to).
drop policy if exists tiktok_read on public.tiktok_leads;
create policy tiktok_read on public.tiktok_leads for select to authenticated using (
 (select public.current_staff_role())::text in ('owner','sales_advisor')
);
drop policy if exists tiktok_insert on public.tiktok_leads;
create policy tiktok_insert on public.tiktok_leads for insert to authenticated with check (
 created_by = (select auth.uid()) and status = 'new' and (select public.current_staff_role())::text = 'owner'
);
drop policy if exists tiktok_update on public.tiktok_leads;
create policy tiktok_update on public.tiktok_leads for update to authenticated
 using ((select public.current_staff_role())::text in ('owner','sales_advisor'))
 with check ((select public.current_staff_role())::text in ('owner','sales_advisor'));

create or replace function public.tiktok_leads_guard_assign() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is distinct from old.assigned_to
     and coalesce(public.current_staff_role()::text, '') <> 'owner'
     and auth.uid() is not null then
    raise exception 'Hanya owner boleh tukar agihan staff.';
  end if;
  return new;
end $$;
revoke all on function public.tiktok_leads_guard_assign() from public, anon, authenticated;
drop trigger if exists tiktok_leads_guard_assign on public.tiktok_leads;
create trigger tiktok_leads_guard_assign before update of assigned_to on public.tiktok_leads
 for each row execute function public.tiktok_leads_guard_assign();
