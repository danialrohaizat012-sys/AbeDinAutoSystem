-- Abe Din Auto V79: Kehadiran Pro — syif, rehat, cuti umum, kelulusan OT/lewat, tuntutan punch tertinggal, jejak audit.
-- Selamat dijalankan semula. Perlu V71_KEHADIRAN.sql dahulu.
--
-- attendance_shifts      : syif kerja (cth Syif Pagi 08:30–17:30, rehat 60 min)
-- attendance_staff       : syif lalai & hari kerja setiap staf (kosong = ikut tetapan umum)
-- attendance_roster      : jadual harian (tukar syif / hari rehat untuk tarikh tertentu)
-- attendance_holidays    : cuti umum & cuti syarikat (dibayar; kerja pada hari ini = OT kadar cuti umum)
-- attendance_day_flags   : keputusan Owner setiap staf-hari: OT lulus/tolak, lewat dimaafkan
-- attendance_requests    : staf tuntut punch tertinggal; Owner lulus -> punch manual dicipta
-- attendance_audit       : jejak semua perubahan rekod punch & keputusan Owner
-- Punch rehat: jenis 'rest_start' (mula rehat) dan 'rest_end' (habis rehat).

-- Tetapan tambahan
alter table public.attendance_settings add column if not exists ot_require_approval boolean not null default false;
alter table public.attendance_settings add column if not exists ot_restday_mult numeric(4,2) not null default 1.33 check (ot_restday_mult between 0 and 5);
alter table public.attendance_settings add column if not exists ot_ph_mult numeric(4,2) not null default 2.00 check (ot_ph_mult between 0 and 5);
alter table public.attendance_settings add column if not exists break_min int not null default 0 check (break_min between 0 and 240);
alter table public.attendance_settings add column if not exists allow_rest_punch boolean not null default true;

-- Syif
create table if not exists public.attendance_shifts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  start_time time not null,
  end_time   time not null,
  break_min  int not null default 60 check (break_min between 0 and 240),
  color      text not null default '#e8b10b',
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.attendance_staff (
  staff_id   uuid primary key references public.profiles(id) on delete cascade,
  shift_id   uuid references public.attendance_shifts(id) on delete set null,
  work_days  int[],
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_roster (
  staff_id uuid not null references public.profiles(id) on delete cascade,
  day      date not null,
  shift_id uuid references public.attendance_shifts(id) on delete cascade,  -- null = hari rehat
  note     text,
  primary key (staff_id, day)
);
create index if not exists attendance_roster_day_idx on public.attendance_roster (day);

create table if not exists public.attendance_holidays (
  day  date primary key,
  name text not null check (length(trim(name)) > 0),
  kind text not null default 'umum' check (kind in ('umum','syarikat'))
);

create table if not exists public.attendance_day_flags (
  staff_id     uuid not null references public.profiles(id) on delete cascade,
  day          date not null,
  ot_status    text check (ot_status in ('approved','rejected')),
  ot_min       int check (ot_min between 0 and 1440),          -- minit OT diluluskan (null = ikut kiraan)
  late_excused boolean not null default false,
  note         text,
  decided_by   uuid,
  decided_at   timestamptz not null default now(),
  primary key (staff_id, day)
);

create table if not exists public.attendance_requests (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('in','out','rest_start','rest_end')),
  punched_at  timestamptz not null,
  reason      text not null check (length(trim(reason)) > 0),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  punch_id    uuid references public.attendance_punches(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists attendance_requests_idx on public.attendance_requests (status, created_at desc);

create table if not exists public.attendance_audit (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  actor     uuid,
  tbl       text not null,
  action    text not null,
  staff_id  uuid,
  day       date,
  old_row   jsonb,
  new_row   jsonb
);
create index if not exists attendance_audit_staff_idx on public.attendance_audit (staff_id, day);

-- Punch rehat
alter table public.attendance_punches drop constraint if exists attendance_punches_kind_check;
alter table public.attendance_punches add constraint attendance_punches_kind_check check (kind in ('in','out','rest_start','rest_end'));

-- Jejak audit (punch & keputusan Owner)
create or replace function public.attendance_audit_trg()
returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb; d date;
begin
  r := to_jsonb(coalesce(new, old));
  if tg_table_name = 'attendance_punches' then d := ((r->>'punched_at')::timestamptz at time zone 'Asia/Kuala_Lumpur')::date;
  else d := (r->>'day')::date; end if;
  -- punch biasa oleh staf sendiri tidak perlu diaudit (sudah ada selfie & GPS)
  if tg_table_name = 'attendance_punches' and tg_op = 'INSERT' and not coalesce((r->>'manual')::boolean, false) then return new; end if;
  insert into public.attendance_audit(actor, tbl, action, staff_id, day, old_row, new_row)
  values (auth.uid(), tg_table_name, lower(tg_op), (r->>'staff_id')::uuid, d,
          case when tg_op <> 'INSERT' then to_jsonb(old) end, case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
drop trigger if exists attendance_punch_audit on public.attendance_punches;
create trigger attendance_punch_audit after insert or update or delete on public.attendance_punches
  for each row execute function public.attendance_audit_trg();
drop trigger if exists attendance_flags_audit on public.attendance_day_flags;
create trigger attendance_flags_audit after insert or update or delete on public.attendance_day_flags
  for each row execute function public.attendance_audit_trg();

-- RLS
alter table public.attendance_shifts    enable row level security;
alter table public.attendance_staff     enable row level security;
alter table public.attendance_roster    enable row level security;
alter table public.attendance_holidays  enable row level security;
alter table public.attendance_day_flags enable row level security;
alter table public.attendance_requests  enable row level security;
alter table public.attendance_audit     enable row level security;

do $$
declare t text;
begin
  -- semua staf aktif boleh baca; Owner urus
  foreach t in array array['attendance_shifts','attendance_holidays'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.att_role() is not null)', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.att_role() = ''owner'') with check (public.att_role() = ''owner'')', t || '_owner', t);
  end loop;
  -- staf baca rekod sendiri; Owner urus
  foreach t in array array['attendance_staff','attendance_roster','attendance_day_flags','attendance_requests'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for select to authenticated using (staff_id = auth.uid() or public.att_role() = ''owner'')', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.att_role() = ''owner'') with check (public.att_role() = ''owner'')', t || '_owner', t);
  end loop;
  foreach t in array array['attendance_shifts','attendance_holidays','attendance_staff','attendance_roster','attendance_day_flags','attendance_requests','attendance_audit'] loop
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
grant usage, select on sequence public.attendance_audit_id_seq to authenticated;

drop policy if exists attendance_audit_read on public.attendance_audit;
create policy attendance_audit_read on public.attendance_audit for select to authenticated using (public.att_role() = 'owner');

-- Staf hantar / batal tuntutan punch tertinggal sendiri
drop policy if exists attendance_requests_self_ins on public.attendance_requests;
drop policy if exists attendance_requests_self_del on public.attendance_requests;
create policy attendance_requests_self_ins on public.attendance_requests for insert to authenticated
  with check (staff_id = auth.uid() and public.att_role() is not null and status = 'pending' and reviewed_by is null and punch_id is null
              and punched_at <= now() and punched_at > now() - interval '45 days');
create policy attendance_requests_self_del on public.attendance_requests for delete to authenticated using (staff_id = auth.uid() and status = 'pending');

-- Owner lulus / tolak tuntutan punch (lulus = cipta punch manual)
create or replace function public.attendance_request_decide(p_id uuid, p_approve boolean, p_note text default null)
returns public.attendance_requests
language plpgsql security definer set search_path = public as $$
declare r public.attendance_requests; v_pid uuid;
begin
  if public.att_role() is distinct from 'owner' then raise exception 'Hanya Owner.'; end if;
  select * into r from public.attendance_requests where id = p_id for update;
  if r.id is null then raise exception 'Tuntutan tidak dijumpai.'; end if;
  if r.status <> 'pending' then raise exception 'Tuntutan ini sudah diputuskan.'; end if;
  if p_approve then
    insert into public.attendance_punches(staff_id, kind, punched_at, manual, note)
    values (r.staff_id, r.kind, r.punched_at, true, 'Tuntutan staf: ' || r.reason)
    returning id into v_pid;
  end if;
  update public.attendance_requests set status = case when p_approve then 'approved' else 'rejected' end,
    review_note = nullif(trim(coalesce(p_note, '')), ''), reviewed_by = auth.uid(), reviewed_at = now(), punch_id = v_pid
  where id = p_id returning * into r;
  return r;
end $$;
revoke all on function public.attendance_request_decide(uuid, boolean, text) from public, anon;
grant execute on function public.attendance_request_decide(uuid, boolean, text) to authenticated;

-- Punch staf: kini menyokong rehat (in -> rest_start -> rest_end -> out)
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
  v_t text;
begin
  if public.att_role() is null then raise exception 'Akaun anda tidak aktif sebagai staf.'; end if;
  if p_kind not in ('in','out','rest_start','rest_end') then raise exception 'Jenis punch tidak sah.'; end if;
  select * into v_set from public.attendance_settings where id = 1;
  if p_kind in ('rest_start','rest_end') and not v_set.allow_rest_punch then raise exception 'Punch rehat tidak dibenarkan.'; end if;

  if p_lat is null or p_lng is null then raise exception 'Lokasi GPS diperlukan. Benarkan akses lokasi dan cuba lagi.'; end if;
  if v_set.require_selfie and p_kind in ('in','out') and coalesce(p_photo,'') = '' then raise exception 'Selfie diperlukan untuk punch.'; end if;
  if coalesce(p_photo,'') <> '' and p_photo not like v_uid::text || '/%' then raise exception 'Gambar selfie tidak sah.'; end if;

  select exists (select 1 from public.attendance_locations where active) into v_has_loc;
  if v_has_loc then
    select l.id, l.name, l.radius_m, public.att_distance_m(p_lat, p_lng, l.lat, l.lng)
      into v_loc_id, v_loc_name, v_loc_r, v_d
      from public.attendance_locations l where l.active
      order by public.att_distance_m(p_lat, p_lng, l.lat, l.lng) limit 1;
    v_inside := v_d <= v_loc_r;
    if v_set.enforce_geofence and not v_inside and p_kind in ('in','out') then
      raise exception 'Anda berada % m dari % (had % m). Punch hanya dibenarkan di lokasi kerja.',
        round(v_d), v_loc_name, v_loc_r;
    end if;
  end if;

  select * into v_last from public.attendance_punches
   where staff_id = v_uid and (punched_at at time zone 'Asia/Kuala_Lumpur')::date = v_today
   order by punched_at desc limit 1;
  v_t := to_char(v_last.punched_at at time zone 'Asia/Kuala_Lumpur','HH12:MI AM');
  if p_kind = 'in' and v_last.kind in ('in','rest_start','rest_end') then
    raise exception 'Anda sudah punch masuk pada %. Punch balik dahulu.', v_t;
  elsif p_kind = 'out' and (v_last.id is null or v_last.kind = 'out') then
    raise exception 'Anda belum punch masuk hari ini.';
  elsif p_kind = 'out' and v_last.kind = 'rest_start' then
    raise exception 'Anda sedang rehat sejak %. Tamatkan rehat dahulu.', v_t;
  elsif p_kind = 'rest_start' and (v_last.id is null or v_last.kind not in ('in','rest_end')) then
    raise exception 'Punch masuk dahulu sebelum mula rehat.';
  elsif p_kind = 'rest_end' and (v_last.id is null or v_last.kind <> 'rest_start') then
    raise exception 'Anda belum mula rehat.';
  end if;

  insert into public.attendance_punches(staff_id, kind, lat, lng, accuracy_m, location_id, location_name, distance_m, inside, photo_path, device)
  values (v_uid, p_kind, p_lat, p_lng, p_accuracy,
          v_loc_id, v_loc_name, round(v_d)::int, v_inside,
          nullif(p_photo,''), left(p_device, 200))
  returning * into v_row;
  return v_row;
end $$;

-- Kiraan menunggu untuk lencana (Owner)
create or replace function public.attendance_pending_count()
returns int language sql stable security definer set search_path = public as $$
  select case when public.att_role() = 'owner' then (select count(*)::int from public.attendance_requests where status = 'pending') else 0 end
$$;
grant execute on function public.attendance_pending_count() to authenticated;

-- Cuti umum Kelantan (sumber: senarai Kabinet 2027 melalui FMM, 27 Ogos 2026; tarikh bertanda * tertakluk perubahan)
insert into public.attendance_holidays(day, name) values
  ('2026-12-25','Hari Krismas'),
  ('2027-02-06','Tahun Baharu Cina'),
  ('2027-02-07','Tahun Baharu Cina (Hari Kedua)'),
  ('2027-02-24','Nuzul Al-Quran'),
  ('2027-03-10','Hari Raya Aidilfitri*'),
  ('2027-03-11','Hari Raya Aidilfitri (Hari Kedua)*'),
  ('2027-05-01','Hari Pekerja'),
  ('2027-05-16','Hari Arafah'),
  ('2027-05-17','Hari Raya Aidiladha*'),
  ('2027-05-18','Hari Raya Aidiladha (Hari Kedua)*'),
  ('2027-05-20','Hari Wesak'),
  ('2027-06-06','Awal Muharam*'),
  ('2027-06-07','Hari Keputeraan YDP Agong'),
  ('2027-08-15','Maulidur Rasul'),
  ('2027-08-31','Hari Kebangsaan'),
  ('2027-09-16','Hari Malaysia'),
  ('2027-09-29','Hari Keputeraan Sultan Kelantan'),
  ('2027-09-30','Hari Keputeraan Sultan Kelantan (Hari Kedua)'),
  ('2027-10-28','Deepavali*'),
  ('2027-12-25','Hari Krismas')
on conflict (day) do nothing;

-- Syif lalai daripada waktu kerja sedia ada
insert into public.attendance_shifts(name, start_time, end_time, break_min)
select 'Syif Biasa', s.work_start, s.work_end, 0 from public.attendance_settings s
where s.id = 1 and not exists (select 1 from public.attendance_shifts);
