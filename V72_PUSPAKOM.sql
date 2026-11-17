-- Abe Din Auto V72: modul Puspakom (status pemeriksaan B5/B7 setiap kereta dalam inventori)
-- Selamat dijalankan semula (idempotent).
--
-- Satu baris setiap plat. Kereta inventori yang belum ada baris dianggap "Belum tempah".
-- Akses:
--   owner      : baca dan tulis
--   staf aktif : baca sahaja

create or replace function public.puspakom_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;
revoke all on function public.puspakom_role() from public;
grant execute on function public.puspakom_role() to authenticated;

create table if not exists public.puspakom (
  plate       text primary key check (plate = upper(regexp_replace(plate, '\s', '', 'g')) and plate <> ''),
  vehicle_id  uuid references public.vehicles(id) on delete set null,
  jenis       text not null default 'B5' check (jenis in ('B5','B7','B5+B7')),
  status      text not null default 'belum' check (status in ('belum','tempah','lulus','gagal')),
  tarikh      date,
  masa        time,
  negeri      text,
  runner      text,
  dokumen     jsonb not null default '{}'::jsonb,
  catatan     text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid(),
  constraint puspakom_belum_tiada_tarikh check (status <> 'belum' or (tarikh is null and masa is null)),
  constraint puspakom_tempah_ada_tarikh check (status <> 'tempah' or tarikh is not null)
);
create index if not exists puspakom_vehicle_idx on public.puspakom (vehicle_id);
create index if not exists puspakom_tarikh_idx on public.puspakom (tarikh);

create or replace function public.puspakom_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end
$$;
drop trigger if exists puspakom_touch on public.puspakom;
create trigger puspakom_touch before insert or update on public.puspakom
  for each row execute function public.puspakom_touch();

alter table public.puspakom enable row level security;

drop policy if exists puspakom_select on public.puspakom;
create policy puspakom_select on public.puspakom
  for select to authenticated using (public.puspakom_role() is not null);

drop policy if exists puspakom_insert on public.puspakom;
create policy puspakom_insert on public.puspakom
  for insert to authenticated with check (public.puspakom_role() = 'owner');

drop policy if exists puspakom_update on public.puspakom;
create policy puspakom_update on public.puspakom
  for update to authenticated using (public.puspakom_role() = 'owner') with check (public.puspakom_role() = 'owner');

drop policy if exists puspakom_delete on public.puspakom;
create policy puspakom_delete on public.puspakom
  for delete to authenticated using (public.puspakom_role() = 'owner');

revoke all on public.puspakom from anon;
grant select, insert, update, delete on public.puspakom to authenticated;

-- ---------- Data awal: rekod Puspakom sedia ada (dari sistem Puspakom lama) ----------
-- Plat yang sudah ada rekod tidak diubah.
insert into public.puspakom (plate, vehicle_id, jenis, status, tarikh, masa, negeri, dokumen, catatan)
select x.plate, (select v.id from public.vehicles v where upper(replace(v.plate,' ',''))=x.plate limit 1),
       x.jenis, x.status, x.tarikh, x.masa, x.negeri, x.dokumen, x.catatan
from (values
  ('WB2841Y','B5+B7','lulus','2026-11-15'::date,'11:00'::time,'Kelantan','{}'::jsonb,'Papan putih tulis 15/11 10am, dan juga 16/11 — sila semak.'),
  ('NDB3555','B5','belum',null::date,null::time,'Terengganu','{}'::jsonb,'Papan: pagi (tarikh belum ditulis)'),
  ('WC5285N','B5','belum',null::date,null::time,'Terengganu','{}'::jsonb,'Tiada geran. Papan: pagi (tarikh belum ditulis)'),
  ('WWU1078','B5','belum',null::date,null::time,'Terengganu','{}'::jsonb,'Papan: pagi (tarikh belum ditulis)'),
  ('VBN2538','B5','belum',null::date,null::time,null,'{}'::jsonb,'Ada dalam senarai Puspakom T.ganu dan KB — sila pilih lokasi'),
  ('VEB1601','B5','belum',null::date,null::time,null,'{}'::jsonb,'Dalam senarai Geran'),
  ('KEE5071','B5','belum',null::date,null::time,null,'{}'::jsonb,'Dalam senarai Geran'),
  ('DCC1118','B5','tempah','2026-11-22'::date,null::time,'Kelantan','{}'::jsonb,'Pagi (jam belum ditulis)'),
  ('WB1013S','B5','lulus','2026-11-15'::date,'09:30'::time,'Kelantan','{"ic": true}'::jsonb,null),
  ('PMG893','B5','lulus','2026-11-15'::date,'15:30'::time,'Kelantan','{}'::jsonb,null),
  ('AKB3105','B5','lulus','2026-11-15'::date,'15:30'::time,'Kelantan','{}'::jsonb,null),
  ('WB4797K','B5','tempah','2026-11-15'::date,'16:30'::time,'Kelantan','{}'::jsonb,null),
  ('WB4511J','B5','belum',null::date,null::time,'Kelantan','{}'::jsonb,null),
  ('WSS4971','B5','tempah','2026-11-19'::date,null::time,'Kelantan','{}'::jsonb,null),
  ('W7451K','B5','belum',null::date,null::time,'Kelantan','{}'::jsonb,null),
  ('JRH324','B5','belum',null::date,null::time,'Kelantan','{}'::jsonb,'Dalam senarai Geran'),
  ('PMF3487','B5','tempah','2026-11-15'::date,'16:30'::time,'Kelantan','{}'::jsonb,null),
  ('CDW3079','B5','tempah','2026-11-17'::date,null::time,'Kelantan','{}'::jsonb,null)
) as x(plate, jenis, status, tarikh, masa, negeri, dokumen, catatan)
on conflict (plate) do nothing;
