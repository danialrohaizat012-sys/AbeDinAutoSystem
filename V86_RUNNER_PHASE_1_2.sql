-- V86 Phase 1+2 Runner: payment safety, audit, assignment, receipt evidence.
alter table public.runner_trips add column if not exists assigned_to uuid references public.profiles(id);
create index if not exists runner_trips_assigned_idx on public.runner_trips(assigned_to);

create table if not exists public.runner_audit (
 id bigint generated always as identity primary key,
 trip_id text not null,
 actor_id uuid,
 action text not null,
 before_data jsonb,
 after_data jsonb,
 occurred_at timestamptz not null default now()
);
create index if not exists runner_audit_trip_idx on public.runner_audit(trip_id, occurred_at desc);
alter table public.runner_audit enable row level security;
revoke all on public.runner_audit from anon,authenticated;
grant select on public.runner_audit to authenticated;
drop policy if exists runner_audit_read on public.runner_audit;
create policy runner_audit_read on public.runner_audit for select to authenticated
 using (public.runner_role() in ('owner','operations'));

create or replace function public.runner_audit_trip_changes()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op = 'DELETE' then
  insert into public.runner_audit(trip_id,actor_id,action,before_data)
  values(old.id,auth.uid(),'delete',to_jsonb(old));
  return old;
 elsif tg_op = 'INSERT' then
  insert into public.runner_audit(trip_id,actor_id,action,after_data)
  values(new.id,auth.uid(),'create',to_jsonb(new));
  return new;
 elsif to_jsonb(new) is distinct from to_jsonb(old) then
  insert into public.runner_audit(trip_id,actor_id,action,before_data,after_data)
  values(new.id,auth.uid(),'update',to_jsonb(old),to_jsonb(new));
 end if;
 return new;
end $$;
revoke all on function public.runner_audit_trip_changes() from public,anon,authenticated;
drop trigger if exists runner_audit_trip_trg on public.runner_trips;
create trigger runner_audit_trip_trg after insert or update or delete on public.runner_trips
 for each row execute function public.runner_audit_trip_changes();

-- An assignment is an operational field; Operations can update any shared trip.
create or replace function public.runner_trips_guard()
returns trigger language plpgsql security definer set search_path=public as $$
declare r text:=public.runner_role();
begin
 if r is null or r not in ('owner','operations') then
   raise exception 'Tiada akses modul Runner.';
 end if;
 if tg_op='INSERT' then
   if r<>'owner' then new.upah:=0; end if;
   new.created_by:=auth.uid();
   return new;
 end if;
 if new.upah is distinct from old.upah and exists
   (select 1 from public.runner_upah_requests x
    where x.trip_id=old.id and x.status='pending') then
   raise exception 'Selesaikan permohonan upah sebelum ubah jumlah.';
 end if;
 if r<>'owner' then
   if new.upah is distinct from old.upah
     or new.created_ms is distinct from old.created_ms
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.id is distinct from old.id then
     raise exception 'Hanya Owner boleh ubah upah atau maklumat pemilikan rekod.';
   end if;
   if new.exp is distinct from old.exp and exists
     (select 1 from public.runner_payments p where p.trip_id=old.id) then
     raise exception 'Trip sudah dibayar, tuntutan dikunci.';
   end if;
 end if;
 if new.assigned_to is not null and not exists
   (select 1 from public.profiles p where p.id=new.assigned_to
    and p.enabled is true and p.role::text in ('owner','operations')) then
   raise exception 'Staf bertanggungjawab mesti staf Operation aktif atau Owner.';
 end if;
 return new;
end $$;

-- The payment triggers serialize with trip updates and reject pending adjustments.
create or replace function public.runner_payment_guard()
returns trigger language plpgsql security definer set search_path=public as $$
declare current_upah numeric; expense_total numeric;
begin
 if public.runner_role()<>'owner' then raise exception 'Hanya Owner boleh membuat bayaran.'; end if;
 select upah into current_upah from public.runner_trips where id=new.trip_id for update;
 if not found then raise exception 'Trip tidak ditemui.'; end if;
 if exists(select 1 from public.runner_upah_requests r where r.trip_id=new.trip_id and r.status='pending') then
   raise exception 'Permohonan upah belum diputuskan. Bayaran disekat.';
 end if;
 if tg_table_name='runner_payments' then
   if exists(select 1 from public.runner_ownerpaid x where x.trip_id=new.trip_id) then
     raise exception 'Trip telah ditanda dibayar pemilik.';
   end if;
 end if;
 return new;
end $$;
revoke all on function public.runner_payment_guard() from public,anon,authenticated;
drop trigger if exists runner_payment_pending_guard on public.runner_payments;
create trigger runner_payment_pending_guard before insert or update on public.runner_payments
 for each row execute function public.runner_payment_guard();
drop trigger if exists runner_ownerpaid_pending_guard on public.runner_ownerpaid;
create trigger runner_ownerpaid_pending_guard before insert or update on public.runner_ownerpaid
 for each row execute function public.runner_payment_guard();

-- Receipt evidence kept separate from vehicle photographs.
create table if not exists public.runner_receipts (
 id uuid primary key default gen_random_uuid(),
 trip_id text not null references public.runner_trips(id) on delete cascade,
 category text not null check(category in ('Tol','Minyak','Makan','Penginapan','Tiket balik','Lain-lain')),
 amount numeric(12,2) not null check(amount>0),
 note text,
 image_data text not null check(image_data like 'data:image/%' and length(image_data)<300000),
 created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now()
);
create index if not exists runner_receipts_trip_idx on public.runner_receipts(trip_id);
alter table public.runner_receipts enable row level security;
revoke all on public.runner_receipts from anon;
grant select,insert on public.runner_receipts to authenticated;
drop policy if exists runner_receipts_read on public.runner_receipts;
create policy runner_receipts_read on public.runner_receipts for select to authenticated
 using(public.runner_role() in ('owner','operations'));
drop policy if exists runner_receipts_add on public.runner_receipts;
create policy runner_receipts_add on public.runner_receipts for insert to authenticated
 with check(public.runner_role() in ('owner','operations') and created_by=auth.uid()
 and not exists(select 1 from public.runner_payments p where p.trip_id=runner_receipts.trip_id)
 and not exists(select 1 from public.runner_ownerpaid o where o.trip_id=runner_receipts.trip_id));

-- Database rules cannot be bypassed by a forged client-side Owner button.
create or replace function public.runner_receipt_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if public.runner_role() not in ('owner','operations') then raise exception 'Tiada akses.'; end if;
 perform 1 from public.runner_trips where id=new.trip_id for update;
 if not found then raise exception 'Trip tidak ditemui.'; end if;
 if exists(select 1 from public.runner_payments where trip_id=new.trip_id)
  or exists(select 1 from public.runner_ownerpaid where trip_id=new.trip_id) then
  raise exception 'Trip sudah dibayar, resit dikunci.';
 end if;
 new.created_by:=auth.uid();new.created_at:=now();
 return new;
end $$;
revoke all on function public.runner_receipt_guard() from public,anon,authenticated;
drop trigger if exists runner_receipt_guard_trg on public.runner_receipts;
create trigger runner_receipt_guard_trg before insert on public.runner_receipts
 for each row execute function public.runner_receipt_guard();
