-- Abe Din Auto V91: Perbelanjaan (snap resit -> AI baca -> semak -> sahkan).
-- Selamat dijalankan semula. Perlu V71 (att_role), V73 (bucket staff-docs) dan V74 (staff_claims).
-- * Semua staf aktif boleh snap resit (status 'draf'); Owner sahkan / tolak.
-- * Resit disimpan dalam bucket peribadi staff-docs, folder <uid>/resit/...
-- * Jika staf bayar sendiri, bila Owner sahkan -> tuntutan (staff_claims) dicipta automatik (status approved, bulan gaji dipilih).
-- * Kunci API AI disimpan dalam app_private.ai_config (hanya Edge Function scan-receipt boleh baca).

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  receipt_date  date not null default current_date,
  vendor        text,
  receipt_no    text,
  amount        numeric(12,2) not null check (amount >= 0 and amount <= 10000000),
  tax_amount    numeric(12,2) not null default 0 check (tax_amount >= 0),
  category      text not null default 'lain' check (category in (
                  'baiki','alat_ganti','tayar_bateri','cat_body','cuci_polish','jpj_puspakom','insurans',
                  'sewa_premis','utiliti','telefon_internet','alat_tulis','makan_entertain',
                  'iklan','marketing_lain','minyak','tol_parking','armada_sewa','bank_caj','lain')),
  unit          text not null default 'jualan' check (unit in ('jualan','sewa','umum')),
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  payment_method text not null default 'tunai' check (payment_method in ('tunai','transfer','kad','ewallet','cek','lain')),
  paid_by       text not null default 'syarikat' check (paid_by in ('syarikat','staf')),
  items         jsonb not null default '[]'::jsonb,
  notes         text,
  image_path    text,
  ai_raw        jsonb,
  status        text not null default 'draf' check (status in ('draf','disahkan','ditolak')),
  review_note   text,
  claim_id      uuid references public.staff_claims(id) on delete set null,
  created_by    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  verified_by   uuid,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists expenses_date_idx on public.expenses (receipt_date desc);
create index if not exists expenses_status_idx on public.expenses (status, created_at desc);
create index if not exists expenses_vehicle_idx on public.expenses (vehicle_id) where vehicle_id is not null;
create index if not exists expenses_creator_idx on public.expenses (created_by, created_at desc);
create index if not exists expenses_dup_idx on public.expenses (receipt_date, amount);

alter table public.expenses enable row level security;
drop policy if exists expenses_read on public.expenses;
drop policy if exists expenses_owner on public.expenses;
drop policy if exists expenses_self_ins on public.expenses;
drop policy if exists expenses_self_upd on public.expenses;
drop policy if exists expenses_self_del on public.expenses;
create policy expenses_read on public.expenses for select to authenticated
  using (public.att_role() = 'owner' or (created_by = auth.uid() and public.att_role() is not null));
create policy expenses_owner on public.expenses for all to authenticated
  using (public.att_role() = 'owner') with check (public.att_role() = 'owner');
create policy expenses_self_ins on public.expenses for insert to authenticated
  with check (created_by = auth.uid() and public.att_role() is not null and status = 'draf' and verified_by is null and claim_id is null);
create policy expenses_self_upd on public.expenses for update to authenticated
  using (created_by = auth.uid() and status = 'draf')
  with check (created_by = auth.uid() and status = 'draf' and verified_by is null and claim_id is null);
create policy expenses_self_del on public.expenses for delete to authenticated
  using (created_by = auth.uid() and status = 'draf');
revoke all on public.expenses from anon;
grant select, insert, update, delete on public.expenses to authenticated;

create or replace function public.expenses_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses for each row execute function public.expenses_touch();

-- Owner sahkan resit. Jika staf bayar sendiri -> cipta tuntutan approved untuk bulan gaji p_pay_month.
create or replace function public.expense_verify(p_id uuid, p_pay_month text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare e public.expenses; v_claim uuid; v_cat text;
begin
  if public.att_role() is distinct from 'owner' then raise exception 'Hanya Owner boleh sahkan resit.'; end if;
  select * into e from public.expenses where id = p_id for update;
  if not found then raise exception 'Resit tidak dijumpai.'; end if;
  if e.status = 'disahkan' then return e.claim_id; end if;
  if e.amount <= 0 then raise exception 'Jumlah resit mesti lebih daripada 0.'; end if;
  if e.paid_by = 'staf' and e.claim_id is null then
    if p_pay_month is null or p_pay_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Pilih bulan gaji untuk tuntutan staf.'; end if;
    v_cat := case e.category when 'minyak' then 'minyak' when 'tol_parking' then 'tol' when 'makan_entertain' then 'makan'
                             when 'alat_ganti' then 'alat_ganti' when 'telefon_internet' then 'telefon' else 'lain' end;
    insert into public.staff_claims (staff_id, claim_date, category, amount, description, receipt_path, status, pay_month, review_note, reviewed_by, reviewed_at)
    values (e.created_by, e.receipt_date, v_cat, e.amount,
            coalesce(nullif(trim(e.vendor), ''), 'Resit') || coalesce(' – ' || nullif(trim(e.notes), ''), '') || ' (Perbelanjaan)',
            e.image_path, 'approved', p_pay_month, 'Auto dari modul Perbelanjaan', auth.uid(), now())
    returning id into v_claim;
  end if;
  update public.expenses set status = 'disahkan', verified_by = auth.uid(), verified_at = now(), review_note = null,
         claim_id = coalesce(v_claim, claim_id) where id = p_id;
  return v_claim;
end $$;
revoke all on function public.expense_verify(uuid, text) from public, anon;
grant execute on function public.expense_verify(uuid, text) to authenticated;

-- Kunci AI (hanya service_role / Edge Function boleh baca)
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table if not exists app_private.ai_config (
  id int primary key default 1 check (id = 1),
  anthropic_key text,
  model text not null default 'claude-haiku-4-5',
  updated_at timestamptz not null default now()
);
insert into app_private.ai_config (id) values (1) on conflict (id) do nothing;

create or replace function public.ai_config_get()
returns jsonb language sql stable security definer set search_path = public, app_private as $$
  select jsonb_build_object('key', anthropic_key, 'model', model) from app_private.ai_config where id = 1
$$;
revoke all on function public.ai_config_get() from public, anon, authenticated;
grant execute on function public.ai_config_get() to service_role;

-- Owner tetapkan / semak status kunci AI dari aplikasi (kunci tidak pernah dipulangkan ke pelayar)
create or replace function public.ai_config_set(p_key text, p_model text default null)
returns void language plpgsql security definer set search_path = public, app_private as $$
begin
  if public.att_role() is distinct from 'owner' then raise exception 'Hanya Owner.'; end if;
  update app_private.ai_config set anthropic_key = coalesce(nullif(trim(p_key), ''), anthropic_key),
         model = coalesce(nullif(trim(p_model), ''), model), updated_at = now() where id = 1;
end $$;
revoke all on function public.ai_config_set(text, text) from public, anon;
grant execute on function public.ai_config_set(text, text) to authenticated;

create or replace function public.ai_config_status()
returns jsonb language sql stable security definer set search_path = public, app_private as $$
  select jsonb_build_object('has_key', anthropic_key is not null and length(anthropic_key) > 10,
                            'hint', case when anthropic_key is null then null else '…' || right(anthropic_key, 4) end,
                            'model', model, 'updated_at', updated_at)
  from app_private.ai_config where id = 1 and public.att_role() = 'owner'
$$;
revoke all on function public.ai_config_status() from public, anon;
grant execute on function public.ai_config_status() to authenticated;

-- ===== V92: 3 jenis perbelanjaan (Inventori / Pembelian / Overhead tetap bulanan) =====
alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check check (category in (
  'baiki','alat_ganti','tayar_bateri','cat_body','cuci_polish','jpj_puspakom','insurans','transport_kereta',
  'sewa_premis','utiliti','telefon_internet','langganan',
  'alat_tulis','makan_entertain','iklan','marketing_lain','minyak','tol_parking','armada_sewa','bank_caj','lain'));
alter table public.expenses add column if not exists jenis text;
update public.expenses set jenis = case
  when category in ('baiki','alat_ganti','tayar_bateri','cat_body','cuci_polish','jpj_puspakom','insurans','transport_kereta') then 'inventori'
  when category in ('sewa_premis','utiliti','telefon_internet','langganan','bank_caj') then 'overhead'
  else 'pembelian' end where jenis is null;
alter table public.expenses alter column jenis set default 'pembelian';
alter table public.expenses alter column jenis set not null;
alter table public.expenses drop constraint if exists expenses_jenis_check;
alter table public.expenses add constraint expenses_jenis_check check (jenis in ('inventori','pembelian','overhead'));
create index if not exists expenses_jenis_idx on public.expenses (jenis, receipt_date desc);
