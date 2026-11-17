-- Abe Din Auto V73: Profil HR staf penuh (Tetapan -> Staf & Akses -> Profil).
-- Selamat dijalankan semula. Perlu V66, V67 dan V71 dahulu (guna public.att_role()).
--
-- staff_hr            : maklumat peribadi, kerja, kontrak, KWSP/PERKESO/SIP, bank, kelayakan cuti, dokumen
-- staff_work_history  : pengalaman kerja sebelum ini
-- staff_chronology    : kronologi dalam syarikat (lantikan, pengesahan, kenaikan gaji, amaran, tukar jawatan...)
-- staff_advances      : pelan advance ansuran (Fasa 1: rekod sahaja, belum auto potong gaji)
-- staff_leaves        : rekod cuti (baki dikira ikut kelayakan tahun semasa)
-- Bucket PERIBADI "staff-docs" : gambar staf, salinan IC, dokumen kronologi (folder ikut id staf).
-- Owner: baca/tulis semua. Staf: baca rekod sendiri sahaja.

create table if not exists public.staff_hr (
  staff_id          uuid primary key references public.profiles(id) on delete cascade,
  staff_code        text,
  ic_no             text,
  company_id        text,
  phone             text,
  email_alt         text,
  address           text,
  mailing_address   text,
  gender            text check (gender in ('male','female')),
  dob               date,
  marital           text check (marital in ('single','married','divorced','widowed')),
  citizenship       text default 'Malaysia',
  religion          text,
  race              text,
  birth_place       text,
  children          int not null default 0 check (children between 0 and 30),
  dependents        int not null default 0 check (dependents between 0 and 30),
  emergency_name    text,
  emergency_relation text,
  emergency_phone   text,
  emergency_phone2  text,
  -- Kerja
  join_date         date,
  confirm_date      date,
  department        text,
  position          text,
  category          text not null default 'staff_biasa'
                    check (category in ('pengurusan','supervisor','staff_biasa','sales','mekanik','runner','part_time','pelatih')),
  shift             text,
  work_location     text,
  -- Kontrak
  employment_type   text not null default 'permanent'
                    check (employment_type in ('permanent','probation','contract','part_time','intern')),
  contract_status   text not null default 'active'
                    check (contract_status in ('active','notice','resigned','terminated','ended')),
  contract_end      date,
  probation_months  int check (probation_months between 0 and 24),
  -- Statutori & bank
  epf_no            text,
  socso_no          text,
  sip_no            text,
  tax_no            text,
  bank_name         text,
  bank_account      text,
  statutory_mode    text not null default 'default' check (statutory_mode in ('default','custom')),
  deduct_epf        boolean not null default true,
  deduct_socso      boolean not null default true,
  deduct_sip        boolean not null default true,
  socso_type        text not null default 'jenis1' check (socso_type in ('jenis1','jenis2')),
  -- Kelayakan cuti (null = ikut Akta Kerja 1955 mengikut tempoh khidmat)
  al_days           numeric(5,1) check (al_days >= 0),
  al_extra          numeric(5,1) not null default 0,
  al_carry          numeric(5,1) not null default 0,
  mc_days           numeric(5,1) check (mc_days >= 0),
  hosp_days         numeric(5,1) check (hosp_days >= 0),
  paternity_days    numeric(5,1) check (paternity_days >= 0),
  maternity_days    numeric(5,1) check (maternity_days >= 0),
  unpaid_days       numeric(5,1) check (unpaid_days >= 0),
  -- Dokumen
  education         text,
  photo_path        text,
  ic_photo_path     text,
  pledge_signer     text,
  pledge_signer_ic  text,
  pledge_signed_at  timestamptz,
  notes             text,
  updated_at        timestamptz not null default now(),
  updated_by        uuid
);

create table if not exists public.staff_work_history (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.profiles(id) on delete cascade,
  company    text not null check (length(trim(company)) > 0),
  start_date date,
  end_date   date,
  position   text,
  salary     numeric(10,2) check (salary >= 0),
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists staff_work_history_idx on public.staff_work_history (staff_id, start_date desc);

create table if not exists public.staff_chronology (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.profiles(id) on delete cascade,
  event_date date not null default current_date,
  kind       text not null check (kind in ('lantikan','pengesahan','kenaikan_gaji','naik_pangkat','tukar_jawatan','tukar_lokasi','amaran','disiplin','penghargaan','berhenti','lain')),
  from_val   text,
  to_val     text,
  reason     text,
  doc_path   text,
  created_at timestamptz not null default now(),
  created_by uuid
);
create index if not exists staff_chronology_idx on public.staff_chronology (staff_id, event_date desc);

create table if not exists public.staff_advances (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references public.profiles(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  months      int not null default 1 check (months between 1 and 36),
  start_month text not null check (start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  monthly     numeric(10,2) not null check (monthly > 0),
  note        text,
  status      text not null default 'active' check (status in ('active','done','cancelled')),
  created_at  timestamptz not null default now(),
  created_by  uuid
);
create index if not exists staff_advances_idx on public.staff_advances (staff_id, created_at desc);

create table if not exists public.staff_leaves (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('annual','mc','hosp','unpaid','paternity','maternity','emergency','other')),
  date_from  date not null,
  date_to    date not null,
  days       numeric(5,1) not null check (days > 0),
  reason     text,
  status     text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  created_by uuid,
  check (date_to >= date_from)
);
create index if not exists staff_leaves_idx on public.staff_leaves (staff_id, date_from desc);

alter table public.staff_hr           enable row level security;
alter table public.staff_work_history enable row level security;
alter table public.staff_chronology   enable row level security;
alter table public.staff_advances     enable row level security;
alter table public.staff_leaves       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['staff_hr','staff_work_history','staff_chronology','staff_advances','staff_leaves'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for select to authenticated using (staff_id = auth.uid() or public.att_role() = ''owner'')', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.att_role() = ''owner'') with check (public.att_role() = ''owner'')', t || '_owner', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Dokumen staf (peribadi)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('staff-docs', 'staff-docs', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists staff_docs_select on storage.objects;
drop policy if exists staff_docs_owner  on storage.objects;
create policy staff_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'staff-docs' and (public.att_role() = 'owner' or (storage.foldername(name))[1] = auth.uid()::text));
create policy staff_docs_owner on storage.objects for all to authenticated
  using (bucket_id = 'staff-docs' and public.att_role() = 'owner')
  with check (bucket_id = 'staff-docs' and public.att_role() = 'owner');
