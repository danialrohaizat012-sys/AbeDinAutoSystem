-- Abe Din Auto V51: modul Permohonan (borang bakal pembeli / pembiayaan kereta)
-- Run once in Supabase SQL Editor BEFORE deploying V51. Selamat dijalankan semula (idempotent).
--
-- Akses:
--   anon (orang awam) : hantar borang sahaja (lajur pemohon). Tidak boleh baca, ubah atau padam.
--   owner             : baca, kemas kini status/nota, padam
--   staf lain         : baca, kemas kini status/nota (kecuali role operations)
--   operations        : tiada akses (sama seperti modul Jualan/Pelanggan)

create or replace function public.app_staff_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;
revoke all on function public.app_staff_role() from public;
grant execute on function public.app_staff_role() to authenticated;

-- ---------- Jadual ----------
create table if not exists public.loan_applications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  status          text not null default 'baru'
                  check (status in ('baru','dalam_proses','lulus','ditolak','batal')),
  staff_note      text check (staff_note is null or length(staff_note) <= 2000),

  -- Maklumat pemohon
  full_name       text not null check (length(full_name) between 2 and 150),
  ic_no           text not null check (ic_no ~ '^[0-9]{6}-[0-9]{2}-[0-9]{4}$'),
  permanent_addr  text not null check (length(permanent_addr) between 5 and 500),
  current_addr    text not null check (length(current_addr) between 5 and 500),
  stay_duration   text not null check (length(stay_duration) between 1 and 60),
  phone           text not null check (phone ~ '^[0-9+ ()-]{9,20}$'),
  dependents      integer not null check (dependents between 0 and 30),
  marital_status  text not null check (length(marital_status) between 1 and 60),
  race            text not null check (length(race) between 1 and 60),
  religion        text not null check (length(religion) between 1 and 60),
  home_ownership  text not null check (length(home_ownership) between 1 and 80),
  education       text not null check (length(education) between 1 and 80),
  email           text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and length(email) <= 150),

  -- Maklumat pekerjaan
  employer        text not null check (length(employer) between 1 and 150),
  employer_addr   text not null check (length(employer_addr) between 5 and 500),
  job_title       text not null check (length(job_title) between 1 and 100),
  job_start       date not null check (job_start between date '1960-01-01' and current_date + 31),
  job_grade       text check (job_grade is null or length(job_grade) <= 60),
  office_phone    text not null check (office_phone ~ '^[0-9+ ()-]{9,20}$'),

  -- Perujuk / waris
  ref_name        text not null check (length(ref_name) between 2 and 150),
  ref_phone       text not null check (ref_phone ~ '^[0-9+ ()-]{9,20}$'),
  ref_addr        text not null check (length(ref_addr) between 5 and 500),
  ref_relation    text not null check (length(ref_relation) between 1 and 60),

  -- Kereta
  car_wanted      text not null check (length(car_wanted) between 2 and 500)
);
create index if not exists loan_applications_created_idx on public.loan_applications (created_at desc);
create index if not exists loan_applications_status_idx  on public.loan_applications (status);
create index if not exists loan_applications_ic_idx      on public.loan_applications (ic_no, created_at desc);

-- ---------- Trigger: had spam + updated_at ----------
create or replace function public.loan_applications_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Orang awam tidak boleh tetapkan status/nota sendiri.
    if public.app_staff_role() is null then
      new.status := 'baru';
      new.staff_note := null;
    end if;
    new.created_at := now();
    new.updated_at := now();
    if (select count(*) from public.loan_applications
        where ic_no = new.ic_no and created_at > now() - interval '1 hour') >= 3 then
      raise exception 'Terlalu banyak permohonan untuk No. I/C ini. Sila cuba lagi kemudian.';
    end if;
    if (select count(*) from public.loan_applications
        where created_at > now() - interval '10 minutes') >= 60 then
      raise exception 'Sistem sibuk. Sila cuba lagi sebentar lagi.';
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end $$;

drop trigger if exists loan_applications_guard on public.loan_applications;
create trigger loan_applications_guard
  before insert or update on public.loan_applications
  for each row execute function public.loan_applications_guard();

-- ---------- RLS ----------
alter table public.loan_applications enable row level security;

drop policy if exists loan_applications_public_insert on public.loan_applications;
create policy loan_applications_public_insert on public.loan_applications
  for insert to anon, authenticated with check (true);

drop policy if exists loan_applications_staff_select on public.loan_applications;
create policy loan_applications_staff_select on public.loan_applications
  for select to authenticated
  using (coalesce(public.app_staff_role(), 'operations') <> 'operations');

drop policy if exists loan_applications_staff_update on public.loan_applications;
create policy loan_applications_staff_update on public.loan_applications
  for update to authenticated
  using (coalesce(public.app_staff_role(), 'operations') <> 'operations')
  with check (coalesce(public.app_staff_role(), 'operations') <> 'operations');

drop policy if exists loan_applications_owner_delete on public.loan_applications;
create policy loan_applications_owner_delete on public.loan_applications
  for delete to authenticated
  using (public.app_staff_role() = 'owner');

-- Orang awam: hanya INSERT lajur pemohon (tiada SELECT/UPDATE/DELETE).
revoke all on public.loan_applications from anon;
grant insert (full_name, ic_no, permanent_addr, current_addr, stay_duration, phone, dependents,
              marital_status, race, religion, home_ownership, education, email,
              employer, employer_addr, job_title, job_start, job_grade, office_phone,
              ref_name, ref_phone, ref_addr, ref_relation, car_wanted)
  on public.loan_applications to anon;

-- Staf: kemas kini hanya status & nota.
revoke all on public.loan_applications from authenticated;
grant select, delete on public.loan_applications to authenticated;
grant insert (full_name, ic_no, permanent_addr, current_addr, stay_duration, phone, dependents,
              marital_status, race, religion, home_ownership, education, email,
              employer, employer_addr, job_title, job_start, job_grade, office_phone,
              ref_name, ref_phone, ref_addr, ref_relation, car_wanted)
  on public.loan_applications to authenticated;
grant update (status, staff_note) on public.loan_applications to authenticated;
