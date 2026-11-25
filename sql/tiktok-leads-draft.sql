-- Draft migration: review and test before applying to production.
begin;
create table public.tiktok_leads (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 200),
 phone text not null unique check (phone ~ '^\+601[0-9]{8,9}$'),
 city text,
 source_date text,
 status text not null default 'new' check(status in ('new','contacted','interested','closed','not_interested')),
 assigned_to uuid references public.profiles(id),
 created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default now()
);
alter table public.tiktok_leads enable row level security;
revoke all on public.tiktok_leads from public, anon, authenticated;
grant select, insert on public.tiktok_leads to authenticated;
grant update(status,assigned_to) on public.tiktok_leads to authenticated;
create policy tiktok_read on public.tiktok_leads for select to authenticated using (
 (select public.current_staff_role()) = 'owner' or
 ((select public.current_staff_role()) = 'sales_advisor' and assigned_to = (select auth.uid()))
);
create policy tiktok_insert on public.tiktok_leads for insert to authenticated with check (
 created_by = (select auth.uid()) and status = 'new' and
 ((select public.current_staff_role()) = 'owner' or
 ((select public.current_staff_role()) = 'sales_advisor' and assigned_to = (select auth.uid())))
);
create policy tiktok_update on public.tiktok_leads for update to authenticated using (
 (select public.current_staff_role()) = 'owner' or
 ((select public.current_staff_role()) = 'sales_advisor' and assigned_to = (select auth.uid()))
) with check (
 (select public.current_staff_role()) = 'owner' or
 ((select public.current_staff_role()) = 'sales_advisor' and assigned_to = (select auth.uid()))
);
commit;
