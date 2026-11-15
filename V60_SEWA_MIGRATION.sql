-- Abe Din Auto V60: Abedin Car Rental – Perjanjian Sewa (borang awam sewa.html + menu "Sewa" dalam dashboard)
-- Jalankan sekali dalam Supabase SQL Editor SEBELUM deploy V60. Selamat dijalankan semula (idempotent).
-- Tidak mengubah jadual sedia ada.
--
-- Aliran:
--   1. Pelanggan buka sewa.html, isi borang, muat naik dokumen ke bucket storan "sewa-docs"
--      (folder sewa/<id>/), kemudian borang memanggil RPC submit_sewa() yang menyemak data
--      dan memulangkan nombor rujukan.
--   2. Pelanggan TIDAK boleh membaca semula apa-apa data atau dokumen.
--
-- Akses dashboard:
--   owner              : baca, kemas kini, padam, ubah Terma & Syarat
--   pengguna lain aktif : baca, kemas kini status dan nota staf

create or replace function public.sewa_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text from public.profiles p where p.id = auth.uid() and p.enabled is true
$$;
revoke all on function public.sewa_role() from public;
grant execute on function public.sewa_role() to authenticated;

-- ---------- Jadual ----------
create sequence if not exists public.sewa_ref_seq;

create table if not exists public.sewa_agreements (
  id             uuid primary key,
  ref_no         text not null unique,
  jenis_sewa     text not null check (jenis_sewa in ('pandu_sendiri','chauffeur')),
  nama           text not null check (length(nama) between 2 and 120),
  email          text not null check (length(email) <= 160),
  telefon        text not null check (length(telefon) between 8 and 20),
  no_kp          text not null check (length(no_kp) between 5 and 30),
  alamat         text not null check (length(alamat) <= 400),
  bandar         text not null check (length(bandar) <= 80),
  negeri         text not null check (length(negeri) <= 80),
  poskod         text not null check (length(poskod) <= 12),
  negara         text not null default 'Malaysia' check (length(negara) <= 80),
  no_lesen       text check (no_lesen is null or length(no_lesen) <= 40),
  lesen_luput    date,
  model          text not null check (length(model) <= 120),
  kumpulan       text check (kumpulan is null or length(kumpulan) <= 80),
  ambil_lokasi   text not null check (length(ambil_lokasi) <= 200),
  ambil_tarikh   date not null,
  ambil_masa     time not null,
  pulang_lokasi  text not null check (length(pulang_lokasi) <= 200),
  pulang_tarikh  date not null,
  pulang_masa    time not null,
  remark         text check (remark is null or length(remark) <= 1000),
  docs           jsonb not null default '{}'::jsonb,
  tandatangan    text not null check (tandatangan like 'data:image/png;base64,%' and length(tandatangan) < 250000),
  terma_snapshot text not null default '',
  status         text not null default 'baru' check (status in ('baru','disahkan','selesai','batal')),
  nota_staf      text check (nota_staf is null or length(nota_staf) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     uuid,
  constraint sewa_tarikh_valid check (
    pulang_tarikh > ambil_tarikh or (pulang_tarikh = ambil_tarikh and pulang_masa > ambil_masa))
);
create index if not exists sewa_agreements_created_idx on public.sewa_agreements (created_at desc);
create index if not exists sewa_agreements_status_idx on public.sewa_agreements (status);

create table if not exists public.sewa_settings (
  key   text primary key,
  value text not null default ''
);

insert into public.sewa_settings (key, value) values ('terma',
'1. Penyewa mestilah berumur 21 tahun ke atas dan memiliki lesen memandu yang sah (bagi Pandu Sendiri).
2. Dokumen pengenalan, lesen memandu dan bil utiliti yang dikemukakan mestilah tulen dan masih sah.
3. Kenderaan hanya boleh dipandu oleh penyewa yang berdaftar dalam perjanjian ini.
4. Bayaran sewa dan deposit hendaklah dijelaskan sebelum kenderaan diserahkan. Deposit dipulangkan selepas kenderaan diperiksa.
5. Kenderaan hendaklah dipulangkan pada tarikh, masa dan lokasi yang dipersetujui. Kelewatan akan dikenakan caj tambahan.
6. Penyewa bertanggungjawab ke atas saman, tol, minyak dan sebarang kerosakan sepanjang tempoh sewaan.
7. Kenderaan dilarang digunakan untuk aktiviti yang menyalahi undang-undang, perlumbaan, atau dibawa keluar negara tanpa kebenaran bertulis.
8. Sebarang kemalangan atau kerosakan mesti dilaporkan kepada Abedin Car Rental dengan segera.
9. Merokok dan membawa haiwan peliharaan di dalam kenderaan adalah dilarang.
10. Abedin Car Rental berhak membatalkan sewaan sekiranya maklumat yang diberikan didapati palsu.')
on conflict (key) do nothing;

-- ---------- Trigger: medan yang staf boleh ubah ----------
create or replace function public.sewa_agreements_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text := public.sewa_role();
  s text := new.status;
  n text := new.nota_staf;
begin
  if r is null then raise exception 'Tiada akses modul Sewa.'; end if;
  if r <> 'owner' then
    -- staf hanya boleh ubah status dan nota; medan lain dikekalkan
    new := old;
    new.status := s;
    new.nota_staf := n;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists sewa_agreements_guard_trg on public.sewa_agreements;
create trigger sewa_agreements_guard_trg
  before update on public.sewa_agreements
  for each row execute function public.sewa_agreements_guard();

-- ---------- RLS ----------
alter table public.sewa_agreements enable row level security;
alter table public.sewa_settings   enable row level security;

drop policy if exists sewa_agreements_select on public.sewa_agreements;
create policy sewa_agreements_select on public.sewa_agreements for select to authenticated
  using (public.sewa_role() is not null);
drop policy if exists sewa_agreements_update on public.sewa_agreements;
create policy sewa_agreements_update on public.sewa_agreements for update to authenticated
  using (public.sewa_role() is not null) with check (public.sewa_role() is not null);
drop policy if exists sewa_agreements_delete on public.sewa_agreements;
create policy sewa_agreements_delete on public.sewa_agreements for delete to authenticated
  using (public.sewa_role() = 'owner');
-- Tiada polisi INSERT: rekod baharu hanya masuk melalui submit_sewa().

drop policy if exists sewa_settings_select on public.sewa_settings;
create policy sewa_settings_select on public.sewa_settings for select to authenticated
  using (public.sewa_role() is not null);
drop policy if exists sewa_settings_write on public.sewa_settings;
create policy sewa_settings_write on public.sewa_settings for all to authenticated
  using (public.sewa_role() = 'owner') with check (public.sewa_role() = 'owner');

-- ---------- Storan dokumen (peribadi) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sewa-docs', 'sewa-docs', false, 8388608,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Orang awam boleh MUAT NAIK sahaja ke sewa/<uuid>/..., tidak boleh baca, ganti atau padam.
drop policy if exists sewa_docs_insert on storage.objects;
create policy sewa_docs_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'sewa-docs'
              and (storage.foldername(name))[1] = 'sewa'
              and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$');
drop policy if exists sewa_docs_select on storage.objects;
create policy sewa_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'sewa-docs' and public.sewa_role() is not null);
drop policy if exists sewa_docs_delete on storage.objects;
create policy sewa_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'sewa-docs' and public.sewa_role() = 'owner');

-- ---------- RPC awam ----------
create or replace function public.get_sewa_terma()
returns text
language sql
security definer
set search_path = public
stable
as $$ select coalesce((select value from public.sewa_settings where key = 'terma'), '') $$;
revoke all on function public.get_sewa_terma() from public;
grant execute on function public.get_sewa_terma() to anon, authenticated;

create or replace function public.submit_sewa(p jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_ref   text;
  v_jenis text := p->>'jenis_sewa';
  v_docs  jsonb := '{}'::jsonb;
  k       text;
  v_path  text;
  f       text;
begin
  begin
    v_id := (p->>'id')::uuid;
  exception when others then
    raise exception 'ID borang tidak sah.';
  end;
  if exists (select 1 from public.sewa_agreements where id = v_id) then
    raise exception 'Borang ini sudah dihantar.';
  end if;

  foreach f in array array['jenis_sewa','nama','email','telefon','no_kp','alamat','bandar','negeri','poskod',
    'negara','model','ambil_lokasi','ambil_tarikh','ambil_masa','pulang_lokasi','pulang_tarikh','pulang_masa','tandatangan'] loop
    if coalesce(btrim(p->>f), '') = '' then raise exception 'Sila lengkapkan medan: %', f; end if;
  end loop;
  if (p->>'email') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Alamat email tidak sah.'; end if;
  if coalesce((p->>'setuju')::boolean, false) is not true then
    raise exception 'Sila bersetuju dengan Terma dan Syarat.';
  end if;
  if (p->>'ambil_tarikh')::date < (now() at time zone 'Asia/Kuala_Lumpur')::date - 1 then
    raise exception 'Tarikh mula sudah lepas.';
  end if;
  if v_jenis = 'pandu_sendiri' then
    if coalesce(btrim(p->>'no_lesen'), '') = '' or coalesce(p->>'lesen_luput', '') = '' then
      raise exception 'No lesen dan tarikh luput wajib untuk Pandu Sendiri.';
    end if;
    if (p->>'lesen_luput')::date < (p->>'pulang_tarikh')::date then
      raise exception 'Lesen memandu tamat sebelum tarikh pulang.';
    end if;
  end if;

  -- Dokumen: mesti berada dalam folder borang ini dan benar-benar sudah dimuat naik
  for k in select jsonb_object_keys(coalesce(p->'docs', '{}'::jsonb)) loop
    if k not in ('lesen','kp','utiliti','gambar') then continue; end if;
    v_path := p->'docs'->>k;
    if v_path is null or v_path not like 'sewa/' || v_id::text || '/%' then
      raise exception 'Dokumen % tidak sah.', k;
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'sewa-docs' and o.name = v_path) then
      raise exception 'Dokumen % tidak ditemui. Sila muat naik semula.', k;
    end if;
    v_docs := v_docs || jsonb_build_object(k, v_path);
  end loop;
  if not v_docs ? 'kp' then raise exception 'Sila muat naik salinan Kad Pengenalan / Passport.'; end if;
  if v_jenis = 'pandu_sendiri' and not v_docs ? 'lesen' then
    raise exception 'Sila muat naik salinan lesen memandu.';
  end if;

  v_ref := 'ACR' || to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYMM') || '-'
           || lpad(nextval('public.sewa_ref_seq')::text, 4, '0');

  insert into public.sewa_agreements (
    id, ref_no, jenis_sewa, nama, email, telefon, no_kp, alamat, bandar, negeri, poskod, negara,
    no_lesen, lesen_luput, model, kumpulan, ambil_lokasi, ambil_tarikh, ambil_masa,
    pulang_lokasi, pulang_tarikh, pulang_masa, remark, docs, tandatangan, terma_snapshot)
  values (
    v_id, v_ref, v_jenis, btrim(p->>'nama'), lower(btrim(p->>'email')), btrim(p->>'telefon'),
    upper(btrim(p->>'no_kp')), btrim(p->>'alamat'), btrim(p->>'bandar'), btrim(p->>'negeri'),
    btrim(p->>'poskod'), btrim(p->>'negara'),
    nullif(upper(btrim(p->>'no_lesen')), ''), nullif(p->>'lesen_luput', '')::date,
    btrim(p->>'model'), nullif(btrim(p->>'kumpulan'), ''),
    btrim(p->>'ambil_lokasi'), (p->>'ambil_tarikh')::date, (p->>'ambil_masa')::time,
    btrim(p->>'pulang_lokasi'), (p->>'pulang_tarikh')::date, (p->>'pulang_masa')::time,
    nullif(btrim(p->>'remark'), ''), v_docs, p->>'tandatangan', public.get_sewa_terma());
  return v_ref;
end $$;
revoke all on function public.submit_sewa(jsonb) from public;
grant execute on function public.submit_sewa(jsonb) to anon, authenticated;
