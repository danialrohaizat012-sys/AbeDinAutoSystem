-- V132: Owner boleh ON/OFF paparan To-Do List dan Makluman untuk staf (data tidak dipadam).
create table if not exists public.staff_panel_settings(
  id boolean primary key default true check (id),
  todo_enabled boolean not null default true,
  makluman_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.staff_panel_settings enable row level security;
revoke all on public.staff_panel_settings from public, anon, authenticated;
grant select on public.staff_panel_settings to authenticated;
grant update (todo_enabled, makluman_enabled, updated_at, updated_by) on public.staff_panel_settings to authenticated;
drop policy if exists staff_panel_settings_read on public.staff_panel_settings;
create policy staff_panel_settings_read on public.staff_panel_settings for select to authenticated
  using ((select public.current_staff_role()) is not null);
drop policy if exists staff_panel_settings_owner on public.staff_panel_settings;
create policy staff_panel_settings_owner on public.staff_panel_settings for update to authenticated
  using ((select public.current_staff_role())::text = 'owner')
  with check ((select public.current_staff_role())::text = 'owner' and updated_by = (select auth.uid()));
insert into public.staff_panel_settings(id) values (true) on conflict (id) do nothing;
