-- Abe Din Auto V54: modul Checklist pemeriksaan kereta (8 bahagian OK/NG/N/A, keputusan akhir,
-- gred A-D, barang perlu tukar & kos, semakan Owner).
-- Jalankan sekali dalam Supabase SQL Editor SEBELUM deploy V54. Selamat dijalankan semula (idempotent).
-- Tidak mengubah jadual sedia ada (vehicles, inspections, inspection_items) atau status kenderaan.
--
-- Akses:
--   owner              : baca, tulis, sahkan / pulangkan, padam
--   pengguna lain aktif : baca semua; cipta dan kemas kini checklist; hantar untuk semakan.
--                         Tidak boleh sahkan, ubah semakan Owner, atau edit checklist yang sudah disahkan
--                         (kecuali tanda "siap" pada barang).

create or replace function public.checklist_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;
revoke all on function public.checklist_role() from public;
grant execute on function public.checklist_role() to authenticated;

create table if not exists public.checklist_inspections (
  id          text primary key default gen_random_uuid()::text,
  vehicle_id  text,
  plate       text not null default '',
  car         text not null default '',
  status      text not null default 'draf' check (status in ('draf','hantar','lulus','ulang')),
  grade       text check (grade is null or grade in ('A','B','C','D')),
  kos         numeric(12,2) not null default 0 check (kos >= 0),
  data        jsonb not null default '{}'::jsonb,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists checklist_inspections_vehicle_idx on public.checklist_inspections (vehicle_id);
create index if not exists checklist_inspections_created_idx on public.checklist_inspections (created_at desc);

-- ---------- Trigger: kawalan medan ----------
create or replace function public.checklist_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r text := public.checklist_role();
begin
  if r is null then
    raise exception 'Tiada akses modul Checklist.';
  end if;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    if r <> 'owner' then
      if new.status not in ('draf','hantar') then new.status := 'draf'; end if;
      new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    end if;
    return new;
  end if;
  -- UPDATE
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  if r <> 'owner' then
    if new.review_note is distinct from old.review_note
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'Hanya Owner boleh menyemak checklist.';
    end if;
    if old.status = 'lulus' then
      -- Checklist disahkan: hanya tanda "siap" barang (data.parts) dan kos boleh berubah.
      if new.status is distinct from old.status or new.grade is distinct from old.grade
         or new.vehicle_id is distinct from old.vehicle_id or new.plate is distinct from old.plate
         or new.car is distinct from old.car or (new.data - 'parts') is distinct from (old.data - 'parts') then
        raise exception 'Checklist sudah disahkan Owner dan dikunci.';
      end if;
    elsif new.status = 'lulus' then
      raise exception 'Hanya Owner boleh mengesahkan checklist.';
    elsif new.status = 'ulang' and old.status <> 'ulang' then
      raise exception 'Hanya Owner boleh memulangkan checklist.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists checklist_guard_trg on public.checklist_inspections;
create trigger checklist_guard_trg
  before insert or update on public.checklist_inspections
  for each row execute function public.checklist_guard();

-- ---------- RLS ----------
alter table public.checklist_inspections enable row level security;

drop policy if exists checklist_select on public.checklist_inspections;
create policy checklist_select on public.checklist_inspections
  for select to authenticated using (public.checklist_role() is not null);

drop policy if exists checklist_insert on public.checklist_inspections;
create policy checklist_insert on public.checklist_inspections
  for insert to authenticated with check (public.checklist_role() is not null);

drop policy if exists checklist_update on public.checklist_inspections;
create policy checklist_update on public.checklist_inspections
  for update to authenticated using (public.checklist_role() is not null) with check (public.checklist_role() is not null);

drop policy if exists checklist_delete on public.checklist_inspections;
create policy checklist_delete on public.checklist_inspections
  for delete to authenticated using (public.checklist_role() = 'owner');

revoke all on public.checklist_inspections from anon;
grant select, insert, update, delete on public.checklist_inspections to authenticated;
