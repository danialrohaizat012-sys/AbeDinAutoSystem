-- V85 Runner: staf Operations mohon tambah/kurang upah; Owner meluluskan atau menolak.
-- Dilaksanakan ke Supabase abe-din-auto-dev; selamat untuk schema V47 Runner.
create table if not exists public.runner_upah_requests (
 id uuid primary key default gen_random_uuid(),
 trip_id text not null references public.runner_trips(id) on delete cascade,
 direction text not null check (direction in ('tambah','kurang')),
 amount numeric(12,2) not null check (amount > 0),
 base_upah numeric(12,2) not null check (base_upah >= 0),
 reason text not null check (char_length(btrim(reason)) between 5 and 1000),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 requested_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(),
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 review_note text
);
create unique index if not exists runner_upah_pending_trip_uq on public.runner_upah_requests(trip_id) where status='pending';
create index if not exists runner_upah_requests_created_idx on public.runner_upah_requests(created_at desc);
alter table public.runner_upah_requests enable row level security;
revoke all on public.runner_upah_requests from anon;
grant select,insert on public.runner_upah_requests to authenticated;
revoke update,delete on public.runner_upah_requests from authenticated;
drop policy if exists runner_upah_requests_read on public.runner_upah_requests;
create policy runner_upah_requests_read on public.runner_upah_requests for select to authenticated using (public.runner_role() in ('owner','operations'));
drop policy if exists runner_upah_requests_submit on public.runner_upah_requests;
create policy runner_upah_requests_submit on public.runner_upah_requests for insert to authenticated with check (public.runner_role()='operations' and requested_by=(select auth.uid()) and status='pending');
CREATE OR REPLACE FUNCTION public.runner_upah_request_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare t public.runner_trips%rowtype;
begin
  if public.runner_role() <> 'operations' then raise exception 'Hanya staf Operation boleh memohon pelarasan upah.'; end if;
  select * into t from public.runner_trips where id = new.trip_id for update;
  if not found then raise exception 'Trip tidak dijumpai.'; end if;
  if exists(select 1 from public.runner_payments where trip_id = new.trip_id)
     or exists(select 1 from public.runner_ownerpaid where trip_id = new.trip_id) then
    raise exception 'Trip telah dibayar; upah tidak boleh dilaraskan.';
  end if;
  if new.direction = 'kurang' and new.amount > t.upah then
    raise exception 'Pengurangan tidak boleh melebihi upah semasa.';
  end if;
  new.base_upah := t.upah;
  new.requested_by := auth.uid();
  new.status := 'pending';
  new.created_at := now();
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_note := null;
  return new;
end $function$
;
drop trigger if exists runner_upah_request_guard_trg on public.runner_upah_requests;
create trigger runner_upah_request_guard_trg before insert on public.runner_upah_requests for each row execute function public.runner_upah_request_guard();
CREATE OR REPLACE FUNCTION public.runner_decide_upah_request(p_request_id uuid, p_approve boolean, p_note text DEFAULT NULL::text)
 RETURNS runner_upah_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare req public.runner_upah_requests%rowtype;
        t public.runner_trips%rowtype;
        new_upah numeric(12,2);
begin
  if auth.uid() is null or public.runner_role() <> 'owner' then
    raise exception 'Hanya Owner boleh membuat keputusan permohonan.';
  end if;
  select * into req from public.runner_upah_requests where id = p_request_id for update;
  if not found then raise exception 'Permohonan tidak dijumpai.'; end if;
  if req.status <> 'pending' then raise exception 'Permohonan telah diputuskan.'; end if;
  if p_approve then
    select * into t from public.runner_trips where id = req.trip_id for update;
    if not found then raise exception 'Trip tidak dijumpai.'; end if;
    if exists(select 1 from public.runner_payments where trip_id = req.trip_id)
       or exists(select 1 from public.runner_ownerpaid where trip_id = req.trip_id) then
      raise exception 'Trip telah dibayar; permohonan tidak boleh diluluskan.';
    end if;
    if t.upah <> req.base_upah then
      raise exception 'Upah sudah berubah selepas permohonan. Tolak permohonan lama dan minta permohonan baharu.';
    end if;
    new_upah := t.upah + (case when req.direction='tambah' then req.amount else -req.amount end);
    if new_upah < 0 then raise exception 'Upah tidak boleh negatif.'; end if;
    update public.runner_trips set upah = new_upah where id = req.trip_id;
  end if;
  update public.runner_upah_requests
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now(),
        review_note = nullif(btrim(coalesce(p_note,'')),'')
    where id = req.id returning * into req;
  return req;
end $function$
;
revoke all on function public.runner_decide_upah_request(uuid,boolean,text) from public,anon;
grant execute on function public.runner_decide_upah_request(uuid,boolean,text) to authenticated;
