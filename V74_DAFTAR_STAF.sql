-- Abe Din Auto V74: Link pendaftaran staf.
-- Staf buka abedinauto.my/daftar-staf.html?k=<kod>, cipta akaun sendiri dan isi maklumat peribadi.
-- Akaun TIDAK boleh guna dashboard sehingga Owner luluskan (pilih peranan) di Tetapan → Pendaftaran Staf.
-- Bila diluluskan: profil diaktifkan dan maklumat disalin ke Profil HR (staff_hr).

create table if not exists public.staff_reg_link (
  id         int primary key default 1 check (id = 1),
  token      text not null default substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 18),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.staff_reg_link(id) values (1) on conflict (id) do nothing;

create table if not exists public.staff_registrations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique,
  email              text not null,
  full_name          text not null,
  phone              text,
  ic_no              text,
  gender             text check (gender in ('male','female')),
  dob                date,
  address            text,
  emergency_name     text,
  emergency_relation text,
  emergency_phone    text,
  bank_name          text,
  bank_account       text,
  epf_no             text,
  socso_no           text,
  position_applied   text,
  education          text,
  photo_path         text,
  ic_photo_path      text,
  status             text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note        text,
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists staff_registrations_status_idx on public.staff_registrations (status, created_at desc);

alter table public.staff_reg_link enable row level security;
alter table public.staff_registrations enable row level security;
-- Tiada polisi tulis: semua melalui fungsi di bawah. Owner boleh baca.
create policy staff_reg_link_owner on public.staff_reg_link for select to authenticated using (public.att_role() = 'owner');
create policy staff_reg_owner_read on public.staff_registrations for select to authenticated using (public.att_role() = 'owner' or user_id = auth.uid());
grant select on public.staff_reg_link, public.staff_registrations to authenticated;

-- Semak kod link (halaman awam)
create or replace function public.staff_reg_check(p_token text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_reg_link where enabled and token = p_token)
$$;

-- Hantar pendaftaran. Dipanggil oleh staf yang baru mendaftar (sesi sendiri),
-- atau tanpa sesi jika Supabase memerlukan pengesahan emel (dicari ikut emel akaun yang baru dicipta).
create or replace function public.staff_register(p_token text, p_email text, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_id uuid;
  v_name text := trim(coalesce(p_data->>'full_name',''));
  t text;
begin
  if not public.staff_reg_check(p_token) then raise exception 'Link pendaftaran tidak sah atau sudah ditutup. Minta link baharu daripada Owner.'; end if;
  if length(v_name) < 3 then raise exception 'Nama penuh diperlukan.'; end if;

  if v_uid is not null then
    select u.email into v_email from auth.users u where u.id = v_uid;
  else
    -- tanpa sesi: hanya akaun yang baru dicipta (30 minit) dan belum ada profil
    select u.id, u.email into v_uid, v_email from auth.users u
     where lower(u.email) = lower(trim(p_email)) and u.created_at > now() - interval '30 minutes'
       and not exists (select 1 from public.profiles p where p.id = u.id)
     limit 1;
    if v_uid is null then raise exception 'Akaun tidak dijumpai. Cuba daftar semula.'; end if;
  end if;

  if exists (select 1 from public.profiles p where p.id = v_uid and p.enabled) then
    raise exception 'Akaun ini sudah aktif sebagai staf. Terus log masuk di abedinauto.my/admin';
  end if;
  if exists (select 1 from public.staff_registrations r where r.user_id = v_uid and r.status = 'approved') then
    raise exception 'Pendaftaran anda sudah diluluskan.';
  end if;

  foreach t in array array['photo_path','ic_photo_path'] loop
    if coalesce(p_data->>t,'') <> '' and (p_data->>t) not like v_uid::text || '/%' then raise exception 'Fail gambar tidak sah.'; end if;
  end loop;

  insert into public.staff_registrations as r (user_id, email, full_name, phone, ic_no, gender, dob, address,
      emergency_name, emergency_relation, emergency_phone, bank_name, bank_account, epf_no, socso_no,
      position_applied, education, photo_path, ic_photo_path, status, created_at)
  values (v_uid, v_email, left(v_name,120), left(p_data->>'phone',30), left(p_data->>'ic_no',30),
      nullif(p_data->>'gender','') , nullif(p_data->>'dob','')::date, left(p_data->>'address',400),
      left(p_data->>'emergency_name',120), left(p_data->>'emergency_relation',60), left(p_data->>'emergency_phone',30),
      left(p_data->>'bank_name',60), left(p_data->>'bank_account',40), left(p_data->>'epf_no',30), left(p_data->>'socso_no',30),
      left(p_data->>'position_applied',80), left(p_data->>'education',200),
      nullif(p_data->>'photo_path',''), nullif(p_data->>'ic_photo_path',''), 'pending', now())
  on conflict (user_id) do update set
      full_name = excluded.full_name, phone = excluded.phone, ic_no = excluded.ic_no, gender = excluded.gender, dob = excluded.dob,
      address = excluded.address, emergency_name = excluded.emergency_name, emergency_relation = excluded.emergency_relation,
      emergency_phone = excluded.emergency_phone, bank_name = excluded.bank_name, bank_account = excluded.bank_account,
      epf_no = excluded.epf_no, socso_no = excluded.socso_no, position_applied = excluded.position_applied, education = excluded.education,
      photo_path = coalesce(excluded.photo_path, r.photo_path), ic_photo_path = coalesce(excluded.ic_photo_path, r.ic_photo_path),
      status = 'pending', review_note = null, reviewed_by = null, reviewed_at = null, created_at = now()
  returning id into v_id;
  return v_id;
end $$;

-- Owner: lulus / tolak
create or replace function public.staff_reg_decide(p_id uuid, p_approve boolean, p_role text default 'operations', p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare r public.staff_registrations;
begin
  if public.att_role() is distinct from 'owner' then raise exception 'Hanya Owner boleh luluskan pendaftaran.'; end if;
  select * into r from public.staff_registrations where id = p_id;
  if not found then raise exception 'Pendaftaran tidak dijumpai.'; end if;

  if not p_approve then
    update public.staff_registrations set status = 'rejected', review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
    return;
  end if;

  if p_role not in ('operations','sales_advisor','owner') then raise exception 'Peranan tidak sah.'; end if;
  if exists (select 1 from public.profiles where id = r.user_id) then
    execute format('update public.profiles set full_name = %L, role = %L, enabled = true where id = %L', r.full_name, p_role, r.user_id);
  else
    execute format('insert into public.profiles (id, full_name, role, enabled) values (%L, %L, %L, true)', r.user_id, r.full_name, p_role);
  end if;

  insert into public.staff_hr as h (staff_id, phone, ic_no, gender, dob, address, emergency_name, emergency_relation, emergency_phone,
      bank_name, bank_account, epf_no, socso_no, position, education, photo_path, ic_photo_path, join_date, updated_at, updated_by)
  values (r.user_id, r.phone, r.ic_no, r.gender, r.dob, r.address, r.emergency_name, r.emergency_relation, r.emergency_phone,
      r.bank_name, r.bank_account, r.epf_no, r.socso_no, r.position_applied, r.education, r.photo_path, r.ic_photo_path,
      (now() at time zone 'Asia/Kuala_Lumpur')::date, now(), auth.uid())
  on conflict (staff_id) do update set
      phone = coalesce(h.phone, excluded.phone), ic_no = coalesce(h.ic_no, excluded.ic_no), gender = coalesce(h.gender, excluded.gender),
      dob = coalesce(h.dob, excluded.dob), address = coalesce(h.address, excluded.address),
      emergency_name = coalesce(h.emergency_name, excluded.emergency_name), emergency_relation = coalesce(h.emergency_relation, excluded.emergency_relation),
      emergency_phone = coalesce(h.emergency_phone, excluded.emergency_phone), bank_name = coalesce(h.bank_name, excluded.bank_name),
      bank_account = coalesce(h.bank_account, excluded.bank_account), epf_no = coalesce(h.epf_no, excluded.epf_no), socso_no = coalesce(h.socso_no, excluded.socso_no),
      position = coalesce(h.position, excluded.position), education = coalesce(h.education, excluded.education),
      photo_path = coalesce(h.photo_path, excluded.photo_path), ic_photo_path = coalesce(h.ic_photo_path, excluded.ic_photo_path),
      updated_at = now(), updated_by = auth.uid();

  update public.staff_registrations set status = 'approved', review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
end $$;

-- Owner: buka/tutup link atau tukar kod
create or replace function public.staff_reg_link_set(p_enabled boolean, p_new_token boolean default false)
returns public.staff_reg_link
language plpgsql security definer set search_path = public as $$
declare v public.staff_reg_link;
begin
  if public.att_role() is distinct from 'owner' then raise exception 'Hanya Owner.'; end if;
  update public.staff_reg_link set enabled = p_enabled,
         token = case when p_new_token then substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 18) else token end, updated_at = now()
   where id = 1 returning * into v;
  return v;
end $$;

revoke all on function public.staff_reg_decide(uuid, boolean, text, text) from public, anon;
revoke all on function public.staff_reg_link_set(boolean, boolean) from public, anon;
revoke all on public.staff_reg_link, public.staff_registrations from anon;
grant execute on function public.staff_reg_check(text) to anon, authenticated;
grant execute on function public.staff_register(text, text, jsonb) to anon, authenticated;
grant execute on function public.staff_reg_decide(uuid, boolean, text, text) to authenticated;
grant execute on function public.staff_reg_link_set(boolean, boolean) to authenticated;

-- Staf baru boleh muat naik gambar & IC ke folder sendiri dalam bucket staff-docs (peribadi)
create policy staff_docs_self_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'staff-docs' and (storage.foldername(name))[1] = auth.uid()::text
              and (storage.foldername(name))[2] = 'daftar');
