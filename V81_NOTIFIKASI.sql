-- Abe Din Auto V81: Notifikasi dalam sistem.
-- * Staf hantar tuntutan / advance / cuti  -> semua Owner dapat notifikasi.
-- * Owner lulus / tolak / bayar             -> staf berkenaan dapat notifikasi.
-- Notifikasi dicipta oleh trigger pangkalan data; pengguna hanya boleh baca & tanda dibaca notifikasi sendiri.

create table if not exists public.app_notifications (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  page       text,
  ref_id     text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists app_notifications_user_idx on public.app_notifications (user_id, created_at desc);

alter table public.app_notifications enable row level security;
create policy app_notif_read on public.app_notifications for select to authenticated using (user_id = auth.uid());
create policy app_notif_mark on public.app_notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.app_notifications from anon;
grant select on public.app_notifications to authenticated;
grant update (read_at) on public.app_notifications to authenticated;

create or replace function public.notif_send(p_user uuid, p_kind text, p_title text, p_body text, p_page text, p_ref text)
returns void language sql security definer set search_path = public as $$
  insert into public.app_notifications(user_id, kind, title, body, page, ref_id)
  select p_user, p_kind, p_title, p_body, p_page, p_ref where p_user is not null;
$$;

create or replace function public.notif_owners(p_kind text, p_title text, p_body text, p_page text, p_ref text, p_except uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.app_notifications(user_id, kind, title, body, page, ref_id)
  select p.id, p_kind, p_title, p_body, p_page, p_ref from public.profiles p
   where p.role::text = 'owner' and coalesce(p.enabled, true) and p.id is distinct from p_except;
$$;

create or replace function public.notif_rm(n numeric) returns text language sql immutable as $$
  select 'RM' || to_char(coalesce(n,0), 'FM999,999,990.00')
$$;

-- Tuntutan
create or replace function public.notif_claims() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text; v_cat text;
begin
  select full_name into v_name from public.profiles where id = new.staff_id;
  v_cat := initcap(replace(new.category, '_', ' '));
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.notif_owners('claim', 'Tuntutan baharu', coalesce(v_name,'Staf') || ' · ' || public.notif_rm(new.amount) || ' (' || v_cat || ')', 'staff', new.id::text, new.staff_id);
    end if;
  elsif new.status is distinct from old.status and new.staff_id is distinct from auth.uid() then
    perform public.notif_send(new.staff_id, 'claim',
      case new.status when 'approved' then 'Tuntutan diluluskan ✓' when 'rejected' then 'Tuntutan ditolak' when 'paid' then 'Tuntutan sudah dibayar' else 'Status tuntutan dikemas kini' end,
      public.notif_rm(new.amount) || ' (' || v_cat || ')' || coalesce(' · ' || nullif(new.review_note,''), ''), 'profil', new.id::text);
  end if;
  return new;
end $$;
create trigger notif_claims_trg after insert or update on public.staff_claims for each row execute function public.notif_claims();

-- Advance gaji
create or replace function public.notif_advances() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select full_name into v_name from public.profiles where id = new.staff_id;
  if tg_op = 'INSERT' then
    if new.status = 'requested' then
      perform public.notif_owners('advance', 'Permohonan advance baharu', coalesce(v_name,'Staf') || ' · ' || public.notif_rm(new.amount) || ' (' || new.months || ' bulan)', 'staff', new.id::text, new.staff_id);
    elsif new.staff_id is distinct from auth.uid() then
      perform public.notif_send(new.staff_id, 'advance', 'Advance direkodkan', public.notif_rm(new.amount) || ' · potongan ' || public.notif_rm(new.monthly) || ' sebulan', 'profil', new.id::text);
    end if;
  elsif new.status is distinct from old.status then
    if new.staff_id is distinct from auth.uid() and new.status in ('active','rejected','done') then
      perform public.notif_send(new.staff_id, 'advance',
        case new.status when 'active' then 'Advance diluluskan ✓' when 'rejected' then 'Advance ditolak' else 'Advance selesai' end,
        public.notif_rm(new.amount) || case when new.status = 'active' then ' · potongan ' || public.notif_rm(new.monthly) || ' sebulan mulai ' || new.start_month else '' end, 'profil', new.id::text);
    elsif new.staff_id = auth.uid() and new.status = 'cancelled' and old.status = 'requested' then
      perform public.notif_owners('advance', 'Permohonan advance dibatalkan', coalesce(v_name,'Staf') || ' · ' || public.notif_rm(new.amount), 'staff', new.id::text, new.staff_id);
    end if;
  end if;
  return new;
end $$;
create trigger notif_advances_trg after insert or update on public.staff_advances for each row execute function public.notif_advances();

-- Cuti
create or replace function public.notif_leaves() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text; v_when text;
begin
  select full_name into v_name from public.profiles where id = new.staff_id;
  v_when := to_char(new.date_from, 'DD/MM') || case when new.date_to <> new.date_from then '–' || to_char(new.date_to, 'DD/MM') else '' end || ' (' || trim(to_char(new.days, 'FM990.0')) || ' hari)';
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.notif_owners('leave', 'Permohonan cuti baharu', coalesce(v_name,'Staf') || ' · ' || v_when, 'staff', new.id::text, new.staff_id);
    end if;
  elsif new.status is distinct from old.status and new.staff_id is distinct from auth.uid() then
    perform public.notif_send(new.staff_id, 'leave', case new.status when 'approved' then 'Cuti diluluskan ✓' when 'rejected' then 'Cuti ditolak' else 'Status cuti dikemas kini' end, v_when, 'profil', new.id::text);
  end if;
  return new;
end $$;
create trigger notif_leaves_trg after insert or update on public.staff_leaves for each row execute function public.notif_leaves();

revoke all on function public.notif_send(uuid,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.notif_owners(text,text,text,text,text,uuid) from public, anon, authenticated;
revoke all on function public.notif_claims() from public, anon, authenticated;
revoke all on function public.notif_advances() from public, anon, authenticated;
revoke all on function public.notif_leaves() from public, anon, authenticated;

-- Masa nyata: notifikasi sampai serta-merta (Supabase Realtime)
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_notifications') then
    alter publication supabase_realtime add table public.app_notifications;
  end if;
end $$;
