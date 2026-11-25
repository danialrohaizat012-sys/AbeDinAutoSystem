-- V128: TikTok Lead – ayat WhatsApp rawak (AI) + hantar manual / WAHA
-- * tiktok_wa_templates : ayat dengan {nama}; owner urus, owner & sales advisor baca
-- * tiktok_wa_sends     : log setiap hantaran (manual / waha) untuk had harian
-- * app_private.waha_config : URL, session, kunci API WAHA (kunci tak pernah dipulangkan ke pelayar)

create table if not exists public.tiktok_wa_templates (
  id uuid primary key default gen_random_uuid(),
  body text not null check (length(trim(body)) between 10 and 700 and position('{nama}' in body) > 0),
  active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.tiktok_wa_templates enable row level security;
revoke all on public.tiktok_wa_templates from public, anon, authenticated;
grant select on public.tiktok_wa_templates to authenticated;
grant update(active) on public.tiktok_wa_templates to authenticated;
drop policy if exists wa_tpl_read on public.tiktok_wa_templates;
create policy wa_tpl_read on public.tiktok_wa_templates for select to authenticated
  using ((select public.current_staff_role()) in ('owner','sales_advisor'));
drop policy if exists wa_tpl_owner_update on public.tiktok_wa_templates;
create policy wa_tpl_owner_update on public.tiktok_wa_templates for update to authenticated
  using ((select public.current_staff_role()) = 'owner') with check ((select public.current_staff_role()) = 'owner');

create table if not exists public.tiktok_wa_sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.tiktok_leads(id) on delete restrict,
  template_id uuid references public.tiktok_wa_templates(id) on delete set null,
  channel text not null check (channel in ('manual','waha')),
  status text not null check (status in ('opened','sent','failed')),
  error text,
  sent_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists tiktok_wa_sends_lead_idx on public.tiktok_wa_sends(lead_id, created_at desc);
create index if not exists tiktok_wa_sends_day_idx on public.tiktok_wa_sends(channel, status, created_at desc);
alter table public.tiktok_wa_sends enable row level security;
revoke all on public.tiktok_wa_sends from public, anon, authenticated;
grant select on public.tiktok_wa_sends to authenticated;
grant insert(lead_id, template_id, channel, status) on public.tiktok_wa_sends to authenticated;
drop policy if exists wa_send_read on public.tiktok_wa_sends;
create policy wa_send_read on public.tiktok_wa_sends for select to authenticated
  using (exists(select 1 from public.tiktok_leads l where l.id = lead_id));
drop policy if exists wa_send_manual_insert on public.tiktok_wa_sends;
create policy wa_send_manual_insert on public.tiktok_wa_sends for insert to authenticated
  with check (channel = 'manual' and status = 'opened' and sent_by = (select auth.uid())
              and exists(select 1 from public.tiktok_leads l where l.id = lead_id));

create table if not exists app_private.waha_config (
  id int primary key default 1 check (id = 1),
  base_url text,
  session text not null default 'default',
  api_key text,
  enabled boolean not null default false,
  daily_limit int not null default 30 check (daily_limit between 1 and 200),
  min_gap_sec int not null default 60 check (min_gap_sec between 20 and 3600),
  updated_at timestamptz not null default now()
);
insert into app_private.waha_config (id) values (1) on conflict (id) do nothing;

create or replace function public.waha_config_get()
returns jsonb language sql stable security definer set search_path = public, app_private as $$
  select jsonb_build_object('base_url', base_url, 'session', session, 'api_key', api_key, 'enabled', enabled,
                            'daily_limit', daily_limit, 'min_gap_sec', min_gap_sec)
  from app_private.waha_config where id = 1
$$;
revoke all on function public.waha_config_get() from public, anon, authenticated;
grant execute on function public.waha_config_get() to service_role;

create or replace function public.waha_config_set(p_base_url text, p_session text, p_api_key text,
  p_enabled boolean, p_daily_limit int, p_min_gap_sec int)
returns void language plpgsql security definer set search_path = public, app_private as $$
begin
  if public.current_staff_role() is distinct from 'owner' then raise exception 'Hanya Owner.'; end if;
  if nullif(trim(p_base_url), '') is not null and trim(p_base_url) !~* '^https?://' then
    raise exception 'URL WAHA mesti bermula dengan http:// atau https://';
  end if;
  update app_private.waha_config set
    base_url = nullif(regexp_replace(trim(coalesce(p_base_url, '')), '/+$', ''), ''),
    session = coalesce(nullif(trim(p_session), ''), 'default'),
    api_key = coalesce(nullif(trim(p_api_key), ''), api_key),
    enabled = coalesce(p_enabled, false),
    daily_limit = least(greatest(coalesce(p_daily_limit, 30), 1), 200),
    min_gap_sec = least(greatest(coalesce(p_min_gap_sec, 60), 20), 3600),
    updated_at = now()
  where id = 1;
end $$;
revoke all on function public.waha_config_set(text, text, text, boolean, int, int) from public, anon;
grant execute on function public.waha_config_set(text, text, text, boolean, int, int) to authenticated;

-- Status untuk pelayar: owner nampak tetapan (tanpa kunci); sales advisor nampak aktif/had sahaja
create or replace function public.waha_config_status()
returns jsonb language sql stable security definer set search_path = public, app_private as $$
  select case when public.current_staff_role() = 'owner' then
    jsonb_build_object('base_url', c.base_url, 'session', c.session, 'enabled', c.enabled,
      'has_key', c.api_key is not null and length(c.api_key) > 0,
      'daily_limit', c.daily_limit, 'min_gap_sec', c.min_gap_sec, 'sent_today', s.n)
  when public.current_staff_role() = 'sales_advisor' then
    jsonb_build_object('enabled', c.enabled and c.base_url is not null,
      'daily_limit', c.daily_limit, 'min_gap_sec', c.min_gap_sec, 'sent_today', s.n)
  end
  from app_private.waha_config c,
  lateral (select count(*) n from public.tiktok_wa_sends x where x.channel = 'waha' and x.status = 'sent'
           and (x.created_at at time zone 'Asia/Kuala_Lumpur')::date = (now() at time zone 'Asia/Kuala_Lumpur')::date) s
  where c.id = 1
$$;
revoke all on function public.waha_config_status() from public, anon;
grant execute on function public.waha_config_status() to authenticated;
