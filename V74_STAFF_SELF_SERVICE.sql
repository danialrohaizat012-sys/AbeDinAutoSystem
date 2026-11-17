-- Abe Din Auto V74: Layan diri staf (menu "Profil Saya") + kelulusan Owner.
-- Selamat dijalankan semula. Perlu V73_STAFF_HR.sql dahulu.
-- * Staf mohon cuti (status pending), batal permohonan sendiri yang belum diluluskan.
-- * Staf hantar tuntutan (claim) dengan resit; Owner lulus/tolak dan pilih bulan gaji -> masuk kiraan gaji Kehadiran.
-- * Staf mohon advance (status requested); Owner lulus -> active (dipotong gaji).
-- * Staf kemas kini maklumat hubungan sendiri melalui staff_update_self() (medan terhad sahaja).

-- Tuntutan
create table if not exists public.staff_claims (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references public.profiles(id) on delete cascade,
  claim_date   date not null default current_date,
  category     text not null check (category in ('minyak','tol','parking','makan','perjalanan','alat_ganti','perubatan','telefon','lain')),
  amount       numeric(10,2) not null check (amount > 0 and amount <= 100000),
  description  text not null check (length(trim(description)) > 0),
  receipt_path text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  pay_month    text check (pay_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  review_note  text,
  reviewed_by  uuid,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists staff_claims_idx on public.staff_claims (staff_id, claim_date desc);
create index if not exists staff_claims_status_idx on public.staff_claims (status, created_at desc);
alter table public.staff_claims enable row level security;
drop policy if exists staff_claims_read  on public.staff_claims;
drop policy if exists staff_claims_owner on public.staff_claims;
drop policy if exists staff_claims_self_ins on public.staff_claims;
drop policy if exists staff_claims_self_del on public.staff_claims;
create policy staff_claims_read  on public.staff_claims for select to authenticated using (staff_id = auth.uid() or public.att_role() = 'owner');
create policy staff_claims_owner on public.staff_claims for all to authenticated using (public.att_role() = 'owner') with check (public.att_role() = 'owner');
create policy staff_claims_self_ins on public.staff_claims for insert to authenticated
  with check (staff_id = auth.uid() and public.att_role() is not null and status = 'pending' and pay_month is null and reviewed_by is null);
create policy staff_claims_self_del on public.staff_claims for delete to authenticated using (staff_id = auth.uid() and status = 'pending');
revoke all on public.staff_claims from anon;
grant select, insert, update, delete on public.staff_claims to authenticated;

-- Cuti: staf mohon sendiri
alter table public.staff_leaves add column if not exists review_note text;
alter table public.staff_leaves add column if not exists attachment_path text;  -- slip MC / dokumen sokongan
alter table public.staff_leaves add column if not exists reviewed_by uuid;
alter table public.staff_leaves add column if not exists reviewed_at timestamptz;
drop policy if exists staff_leaves_self_ins on public.staff_leaves;
drop policy if exists staff_leaves_self_del on public.staff_leaves;
create policy staff_leaves_self_ins on public.staff_leaves for insert to authenticated
  with check (staff_id = auth.uid() and public.att_role() is not null and status = 'pending' and reviewed_by is null);
create policy staff_leaves_self_del on public.staff_leaves for delete to authenticated using (staff_id = auth.uid() and status = 'pending');

-- Advance: staf mohon sendiri
alter table public.staff_advances drop constraint if exists staff_advances_status_check;
alter table public.staff_advances add constraint staff_advances_status_check check (status in ('requested','active','done','cancelled','rejected'));
alter table public.staff_advances add column if not exists review_note text;
drop policy if exists staff_advances_self_ins on public.staff_advances;
drop policy if exists staff_advances_self_del on public.staff_advances;
create policy staff_advances_self_ins on public.staff_advances for insert to authenticated
  with check (staff_id = auth.uid() and public.att_role() is not null and status = 'requested');
create policy staff_advances_self_del on public.staff_advances for delete to authenticated using (staff_id = auth.uid() and status = 'requested');

-- Resit / dokumen: staf boleh muat naik ke folder sendiri sahaja
drop policy if exists staff_docs_self_ins on storage.objects;
create policy staff_docs_self_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'staff-docs' and public.att_role() is not null and (storage.foldername(name))[1] = auth.uid()::text);

-- Kemas kini maklumat sendiri (medan terhad)
create or replace function public.staff_update_self(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.att_role() is null then raise exception 'Akaun tidak aktif.'; end if;
  if jsonb_typeof(p) <> 'object' then raise exception 'Format tidak sah.'; end if;
  insert into public.staff_hr (staff_id) values (auth.uid()) on conflict (staff_id) do nothing;
  update public.staff_hr set
    phone              = case when p ? 'phone'              then nullif(trim(p->>'phone'), '')              else phone end,
    email_alt          = case when p ? 'email_alt'          then nullif(trim(p->>'email_alt'), '')          else email_alt end,
    address            = case when p ? 'address'            then nullif(trim(p->>'address'), '')            else address end,
    mailing_address    = case when p ? 'mailing_address'    then nullif(trim(p->>'mailing_address'), '')    else mailing_address end,
    marital            = case when p ? 'marital'            then nullif(p->>'marital', '')                  else marital end,
    children           = case when p ? 'children'           then coalesce((p->>'children')::int, 0)         else children end,
    dependents         = case when p ? 'dependents'         then coalesce((p->>'dependents')::int, 0)       else dependents end,
    emergency_name     = case when p ? 'emergency_name'     then nullif(trim(p->>'emergency_name'), '')     else emergency_name end,
    emergency_relation = case when p ? 'emergency_relation' then nullif(trim(p->>'emergency_relation'), '') else emergency_relation end,
    emergency_phone    = case when p ? 'emergency_phone'    then nullif(trim(p->>'emergency_phone'), '')    else emergency_phone end,
    emergency_phone2   = case when p ? 'emergency_phone2'   then nullif(trim(p->>'emergency_phone2'), '')   else emergency_phone2 end,
    updated_at = now(), updated_by = auth.uid()
  where staff_id = auth.uid();
end $$;
revoke all on function public.staff_update_self(jsonb) from public, anon;
grant execute on function public.staff_update_self(jsonb) to authenticated;

-- Kiraan kelulusan menunggu (untuk lencana di menu Staf)
create or replace function public.staff_pending_counts()
returns table (leaves bigint, claims bigint, advances bigint)
language sql
security definer
set search_path = public
stable
as $$
  select (select count(*) from public.staff_leaves where status = 'pending'),
         (select count(*) from public.staff_claims where status = 'pending'),
         (select count(*) from public.staff_advances where status = 'requested')
  where public.att_role() = 'owner'
$$;
revoke all on function public.staff_pending_counts() from public, anon;
grant execute on function public.staff_pending_counts() to authenticated;
