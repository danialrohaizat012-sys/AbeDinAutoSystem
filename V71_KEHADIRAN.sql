-- Abe Din Auto V71: Kehadiran staf (punch masuk/balik dengan selfie + lokasi GPS) dan tetapan gaji.
-- Selamat dijalankan semula.
-- * Staf punch melalui fungsi attendance_punch() sahaja: masa diambil dari server (bukan jam telefon),
--   jarak ke lokasi tag dikira di server, dan staf tidak boleh ubah/padam rekod sendiri.
-- * Owner tetapkan lokasi tag, waktu kerja, lewat/OT dan cara gaji setiap staf; boleh betulkan rekod (ditanda "diubah").
-- * Selfie disimpan dalam bucket PERIBADI "attendance-selfies" (folder ikut id staf).

create table if not exists public.attendance_settings (
  id               int primary key default 1 check (id = 1),
  work_start       time not null default '09:00',
  work_end         time not null default '18:00',
  work_days        int[] not null default '{0,1,2,3,4,6}',  -- 0=Ahad ... 6=Sabtu (5=Jumaat cuti)
  grace_min        int not null default 10 check (grace_min between 0 and 240),
  ot_min_minutes   int not null default 30 check (ot_min_minutes between 0 and 600),
  ot_offday_all    boolean not null default true,  -- kerja hari cuti dikira OT sepenuhnya
  enforce_geofence boolean not null default true,  -- tolak punch di luar kawasan lokasi tag
  require_selfie   boolean not null default true,
  updated_at       timestamptz not null default now()
);
insert into public.attendance_settings(id) values (1) on conflict (id) do nothing;

create table if not exists public.attendance_locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  radius_m   int not null default 100 check (radius_m between 10 and 5000),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_pay (
  staff_id         uuid primary key references public.profiles(id) on delete cascade,
  pay_type         text not null default 'daily' check (pay_type in ('daily','hourly','monthly')),
  rate             numeric(10,2) not null default 0 check (rate >= 0),        -- RM sehari / sejam / sebulan
  ot_rate          numeric(10,2) not null default 0 check (ot_rate >= 0),     -- RM sejam OT
  late_mode        text not null default 'none' check (late_mode in ('none','per_minute','per_late')),
  late_rate        numeric(10,2) not null default 0 check (late_rate >= 0),   -- RM seminit / RM sekali lewat
  monthly_workdays int not null default 26 check (monthly_workdays between 1 and 31),
  allowance        numeric(10,2) not null default 0 check (allowance >= 0),   -- elaun tetap sebulan
  updated_at       timestamptz not null default now()
);

create table if not exists public.attendance_punches (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null references public.profiles(id) on delete cascade,
  kind          text not null check (kind in ('in','out')),
  punched_at    timestamptz not null default now(),
  lat           double precision,
  lng           double precision,
  accuracy_m    double precision,
  location_id   uuid references public.attendance_locations(id) on delete set null,
  location_name text,
  distance_m    int,
  inside        boolean,
  photo_path    text,
  device        text,
  manual        boolean not null default false,
  note          text,
  edited_by     uuid,
  edited_at     timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists attendance_punches_staff_idx on public.attendance_punches (staff_id, punched_at desc);
create index if not exists attendance_punches_time_idx on public.attendance_punches (punched_at desc);

-- Peranan staf yang sedang log masuk (null jika bukan staf aktif)
create or replace function public.att_role()
returns text language sql stable security definer set search_path = public as $$
  select p.role::text from public.profiles p where p.id = auth.uid() and coalesce(p.enabled, true) limit 1
$$;

create or replace function public.att_distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

-- Punch masuk/balik oleh staf sendiri
create or replace function public.attendance_punch(
  p_kind text, p_lat double precision, p_lng double precision, p_accuracy double precision,
  p_photo text, p_device text default null)
returns public.attendance_punches
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_set  public.attendance_settings;
  v_loc_id uuid; v_loc_name text; v_loc_r int; v_d double precision;
  v_last public.attendance_punches;
  v_row  public.attendance_punches;
  v_has_loc boolean;
  v_inside boolean;
  v_today date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  if public.att_role() is null then raise exception 'Akaun anda tidak aktif sebagai staf.'; end if;
  if p_kind not in ('in','out') then raise exception 'Jenis punch tidak sah.'; end if;
  select * into v_set from public.attendance_settings where id = 1;

  if p_lat is null or p_lng is null then raise exception 'Lokasi GPS diperlukan. Benarkan akses lokasi dan cuba lagi.'; end if;
  if v_set.require_selfie and coalesce(p_photo,'') = '' then raise exception 'Selfie diperlukan untuk punch.'; end if;
  if coalesce(p_photo,'') <> '' and p_photo not like v_uid::text || '/%' then raise exception 'Gambar selfie tidak sah.'; end if;

  select exists (select 1 from public.attendance_locations where active) into v_has_loc;
  if v_has_loc then
    select l.id, l.name, l.radius_m, public.att_distance_m(p_lat, p_lng, l.lat, l.lng)
      into v_loc_id, v_loc_name, v_loc_r, v_d
      from public.attendance_locations l where l.active
      order by public.att_distance_m(p_lat, p_lng, l.lat, l.lng) limit 1;
    v_inside := v_d <= v_loc_r;
    if v_set.enforce_geofence and not v_inside then
      raise exception 'Anda berada % m dari % (had % m). Punch hanya dibenarkan di lokasi kerja.',
        round(v_d), v_loc_name, v_loc_r;
    end if;
  end if;

  select * into v_last from public.attendance_punches
   where staff_id = v_uid and (punched_at at time zone 'Asia/Kuala_Lumpur')::date = v_today
   order by punched_at desc limit 1;
  if p_kind = 'in' and v_last.kind = 'in' then
    raise exception 'Anda sudah punch masuk pada %. Punch balik dahulu.', to_char(v_last.punched_at at time zone 'Asia/Kuala_Lumpur','HH12:MI AM');
  end if;
  if p_kind = 'out' and (v_last.id is null or v_last.kind = 'out') then
    raise exception 'Anda belum punch masuk hari ini.';
  end if;

  insert into public.attendance_punches(staff_id, kind, lat, lng, accuracy_m, location_id, location_name, distance_m, inside, photo_path, device)
  values (v_uid, p_kind, p_lat, p_lng, p_accuracy,
          v_loc_id, v_loc_name, round(v_d)::int, v_inside,
          nullif(p_photo,''), left(p_device, 200))
  returning * into v_row;
  return v_row;
end $$;

-- Tanda rekod yang diubah oleh Owner
create or replace function public.attendance_punch_edit_mark()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then new.edited_by := auth.uid(); new.edited_at := now(); end if;
  if tg_op = 'INSERT' and auth.uid() is not null and new.manual then new.edited_by := auth.uid(); new.edited_at := now(); end if;
  return new;
end $$;
drop trigger if exists attendance_punch_edit_trg on public.attendance_punches;
create trigger attendance_punch_edit_trg before insert or update on public.attendance_punches
  for each row execute function public.attendance_punch_edit_mark();

-- RLS
alter table public.attendance_settings  enable row level security;
alter table public.attendance_locations enable row level security;
alter table public.staff_pay            enable row level security;
alter table public.attendance_punches   enable row level security;

drop policy if exists att_settings_read  on public.attendance_settings;
drop policy if exists att_settings_owner on public.attendance_settings;
create policy att_settings_read  on public.attendance_settings for select to authenticated using (public.att_role() is not null);
create policy att_settings_owner on public.attendance_settings for update to authenticated using (public.att_role() = 'owner') with check (public.att_role() = 'owner');

drop policy if exists att_loc_read  on public.attendance_locations;
drop policy if exists att_loc_owner on public.attendance_locations;
create policy att_loc_read  on public.attendance_locations for select to authenticated using (public.att_role() is not null);
create policy att_loc_owner on public.attendance_locations for all to authenticated using (public.att_role() = 'owner') with check (public.att_role() = 'owner');

drop policy if exists staff_pay_read  on public.staff_pay;
drop policy if exists staff_pay_owner on public.staff_pay;
create policy staff_pay_read  on public.staff_pay for select to authenticated using (staff_id = auth.uid() or public.att_role() = 'owner');
create policy staff_pay_owner on public.staff_pay for all to authenticated using (public.att_role() = 'owner') with check (public.att_role() = 'owner');

drop policy if exists att_punch_read   on public.attendance_punches;
drop policy if exists att_punch_owner  on public.attendance_punches;
drop policy if exists att_punch_owner_ins on public.attendance_punches;
drop policy if exists att_punch_owner_upd on public.attendance_punches;
drop policy if exists att_punch_owner_del on public.attendance_punches;
create policy att_punch_read  on public.attendance_punches for select to authenticated using (staff_id = auth.uid() or public.att_role() = 'owner');
create policy att_punch_owner_ins on public.attendance_punches for insert to authenticated with check (public.att_role() = 'owner' and manual);
create policy att_punch_owner_upd on public.attendance_punches for update to authenticated using (public.att_role() = 'owner') with check (public.att_role() = 'owner');
create policy att_punch_owner_del on public.attendance_punches for delete to authenticated using (public.att_role() = 'owner');

revoke all on public.attendance_settings, public.attendance_locations, public.staff_pay, public.attendance_punches from anon;
grant select, update on public.attendance_settings to authenticated;
grant select, insert, update, delete on public.attendance_locations, public.staff_pay, public.attendance_punches to authenticated;

revoke all on function public.att_role() from public, anon;
revoke all on function public.attendance_punch(text, double precision, double precision, double precision, text, text) from public, anon;
revoke all on function public.attendance_punch_edit_mark() from public, anon, authenticated;
grant execute on function public.att_role() to authenticated;
grant execute on function public.attendance_punch(text, double precision, double precision, double precision, text, text) to authenticated;

-- Storan selfie (peribadi)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attendance-selfies', 'attendance-selfies', false, 5242880, array['image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists att_selfie_insert on storage.objects;
drop policy if exists att_selfie_select on storage.objects;
drop policy if exists att_selfie_delete on storage.objects;
create policy att_selfie_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'attendance-selfies' and public.att_role() is not null and (storage.foldername(name))[1] = auth.uid()::text);
create policy att_selfie_select on storage.objects for select to authenticated
  using (bucket_id = 'attendance-selfies' and (public.att_role() = 'owner' or (storage.foldername(name))[1] = auth.uid()::text));
create policy att_selfie_delete on storage.objects for delete to authenticated
  using (bucket_id = 'attendance-selfies' and public.att_role() = 'owner');
