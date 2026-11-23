-- Single owner-controlled public-catalogue lead CTA visibility flag.
-- The default is ON, preserving current public and agent interest capture.
begin;
create table if not exists public.catalogue_interest_button_settings (
  id boolean primary key default true check (id = true),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
insert into public.catalogue_interest_button_settings (id,enabled)
values (true,true) on conflict (id) do nothing;
alter table public.catalogue_interest_button_settings enable row level security;
revoke all on public.catalogue_interest_button_settings from public,anon,authenticated;
grant select on public.catalogue_interest_button_settings to anon,authenticated;
grant update on public.catalogue_interest_button_settings to authenticated;
drop policy if exists "public read interest visibility" on public.catalogue_interest_button_settings;
create policy "public read interest visibility"
  on public.catalogue_interest_button_settings for select to anon,authenticated using (id=true);
drop policy if exists "owner update interest visibility" on public.catalogue_interest_button_settings;
create policy "owner update interest visibility"
  on public.catalogue_interest_button_settings for update to authenticated
  using (id=true and exists (
    select 1 from public.profiles p where p.id=(select auth.uid())
    and p.role='owner' and p.enabled=true
  ))
  with check (id=true and exists (
    select 1 from public.profiles p where p.id=(select auth.uid())
    and p.role='owner' and p.enabled=true
  ));
commit;