-- Abe Din Auto V47: modul Runner (trace trip, upah, baki wang pendahuluan)
-- Run once in Supabase SQL Editor BEFORE deploying V47. Selamat dijalankan semula (idempotent).
--
-- Akses:
--   owner      : baca dan tulis semua
--   operations : (runner) baca semua; tambah trip; kemas kini hanya status/check-in/tuntutan;
--                tambah gambar. Tidak boleh edit trip, upah, bayaran, wang pendahuluan, tanda
--                "dibayar pemilik", nama runner atau memadam.
--   lain-lain  : tiada akses

create or replace function public.runner_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;
revoke all on function public.runner_role() from public;
grant execute on function public.runner_role() to authenticated;

-- ---------- Jadual ----------
create table if not exists public.runner_trips (
  id          text primary key default gen_random_uuid()::text,
  car         text not null,
  plate       text not null,
  from_loc    text not null,
  to_loc      text not null default 'Kota Bharu',
  trip_date   date not null default current_date,
  upah        numeric(12,2) not null default 0 check (upah >= 0),
  kind        text not null default 'ambil' check (kind in ('ambil','hantar')),
  st          integer not null default 0 check (st between 0 and 2),
  exp         jsonb not null default '[]'::jsonb,
  ck          jsonb not null default '[]'::jsonb,
  times       jsonb not null default '{}'::jsonb,
  created_ms  bigint not null default (extract(epoch from now()) * 1000)::bigint,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create index if not exists runner_trips_date_idx on public.runner_trips (trip_date desc);

create table if not exists public.runner_payments (
  trip_id  text primary key references public.runner_trips(id) on delete cascade,
  amount   numeric(12,2) not null check (amount >= 0),
  paid_at  timestamptz not null default now()
);

create table if not exists public.runner_topups (
  id          text primary key default gen_random_uuid()::text,
  amt         numeric(12,2) not null check (amt > 0),
  topup_date  date not null default current_date,
  note        text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.runner_ownerpaid (
  trip_id   text primary key references public.runner_trips(id) on delete cascade,
  marked_at timestamptz not null default now()
);

create table if not exists public.runner_settings (
  key   text primary key,
  value text
);

create table if not exists public.runner_photos (
  id        text primary key default gen_random_uuid()::text,
  trip_id   text not null references public.runner_trips(id) on delete cascade,
  label     text not null default 'Lain-lain',
  img       text not null check (img like 'data:image/%' and length(img) < 300000),
  taken_at  timestamptz not null default now()
);
create index if not exists runner_photos_trip_idx on public.runner_photos (trip_id);

-- ---------- Trigger: kawalan medan untuk runner ----------
create or replace function public.runner_trips_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r text := public.runner_role();
begin
  if r is null or r not in ('owner','operations') then
    raise exception 'Tiada akses modul Runner.';
  end if;
  if tg_op = 'INSERT' then
    if r <> 'owner' then new.upah := 0; end if;
    new.created_by := auth.uid();
    return new;
  end if;
  -- UPDATE
  if r <> 'owner' then
    if new.car is distinct from old.car or new.plate is distinct from old.plate
       or new.from_loc is distinct from old.from_loc or new.to_loc is distinct from old.to_loc
       or new.trip_date is distinct from old.trip_date or new.upah is distinct from old.upah
       or new.kind is distinct from old.kind or new.created_ms is distinct from old.created_ms then
      raise exception 'Hanya Owner boleh edit trip dan upah.';
    end if;
    if new.exp is distinct from old.exp
       and exists (select 1 from public.runner_payments p where p.trip_id = old.id) then
      raise exception 'Trip sudah dibayar, tuntutan dikunci.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists runner_trips_guard_trg on public.runner_trips;
create trigger runner_trips_guard_trg
  before insert or update on public.runner_trips
  for each row execute function public.runner_trips_guard();

-- ---------- RLS ----------
alter table public.runner_trips     enable row level security;
alter table public.runner_payments  enable row level security;
alter table public.runner_topups    enable row level security;
alter table public.runner_ownerpaid enable row level security;
alter table public.runner_settings  enable row level security;
alter table public.runner_photos    enable row level security;

-- trips: owner + operations baca/tambah/kemas kini (trigger hadkan operations); padam owner sahaja
drop policy if exists runner_trips_select on public.runner_trips;
create policy runner_trips_select on public.runner_trips for select to authenticated
  using (public.runner_role() in ('owner','operations'));
drop policy if exists runner_trips_insert on public.runner_trips;
create policy runner_trips_insert on public.runner_trips for insert to authenticated
  with check (public.runner_role() in ('owner','operations'));
drop policy if exists runner_trips_update on public.runner_trips;
create policy runner_trips_update on public.runner_trips for update to authenticated
  using (public.runner_role() in ('owner','operations'))
  with check (public.runner_role() in ('owner','operations'));
drop policy if exists runner_trips_delete on public.runner_trips;
create policy runner_trips_delete on public.runner_trips for delete to authenticated
  using (public.runner_role() = 'owner');

-- payments / topups / ownerpaid / settings: baca owner + operations, tulis owner sahaja
do $$
declare t text;
begin
  foreach t in array array['runner_payments','runner_topups','runner_ownerpaid','runner_settings'] loop
    execute format('drop policy if exists %I on public.%I', t||'_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.runner_role() in (''owner'',''operations''))', t||'_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.runner_role() = ''owner'') with check (public.runner_role() = ''owner'')', t||'_write', t);
  end loop;
end $$;

-- photos: baca + tambah owner/operations, padam owner sahaja, tiada kemas kini
drop policy if exists runner_photos_select on public.runner_photos;
create policy runner_photos_select on public.runner_photos for select to authenticated
  using (public.runner_role() in ('owner','operations'));
drop policy if exists runner_photos_insert on public.runner_photos;
create policy runner_photos_insert on public.runner_photos for insert to authenticated
  with check (public.runner_role() in ('owner','operations'));
drop policy if exists runner_photos_delete on public.runner_photos;
create policy runner_photos_delete on public.runner_photos for delete to authenticated
  using (public.runner_role() = 'owner');

-- Tiada akses untuk anon
revoke all on public.runner_trips, public.runner_payments, public.runner_topups,
              public.runner_ownerpaid, public.runner_settings, public.runner_photos from anon;
grant select, insert, update, delete on public.runner_trips, public.runner_payments, public.runner_topups,
              public.runner_ownerpaid, public.runner_settings, public.runner_photos to authenticated;
