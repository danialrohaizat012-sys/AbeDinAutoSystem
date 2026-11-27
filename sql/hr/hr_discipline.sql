-- DRAFT: isolated test DB only. Requires existing profiles and att_role().
begin;
create table public.hr_discipline_events (
 case_id uuid not null, staff_id uuid not null references public.profiles(id),
 seq integer not null check(seq>0),
 kind text not null check(kind in ('notice','response','review','outcome','pip','pip_update','close')),
 body text not null check(length(btrim(body)) between 10 and 10000),
 response_due date,
 created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default clock_timestamp(),
 primary key(case_id,seq),
 check((kind='notice' and response_due is not null) or (kind<>'notice' and response_due is null))
);
create index hr_discipline_staff_idx on public.hr_discipline_events(staff_id,created_at desc);
alter table public.hr_discipline_events enable row level security;
revoke all on public.hr_discipline_events from public,anon,authenticated;
grant select on public.hr_discipline_events to authenticated;
grant insert(case_id,staff_id,seq,kind,body,response_due) on public.hr_discipline_events to authenticated;
create policy hr_discipline_read on public.hr_discipline_events for select to authenticated using(public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
create policy hr_discipline_insert on public.hr_discipline_events for insert to authenticated with check(created_by=auth.uid() and ((public.att_role()='owner' and kind<>'response' and staff_id<>auth.uid()) or (staff_id=auth.uid() and kind='response' and public.att_role() is not null)));
create function public.hr_discipline_validate() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.hr_discipline_events%rowtype; today date := (clock_timestamp() at time zone 'Asia/Kuala_Lumpur')::date; actor_role text := public.att_role(); deadline date;
begin
 if auth.uid() is null or actor_role is null or new.created_by is distinct from auth.uid() then raise exception 'Active account required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hr-discipline:'||new.case_id::text,0));
 select * into p from public.hr_discipline_events where case_id=new.case_id order by seq desc limit 1;
 if not found then
  if actor_role<>'owner' or new.staff_id=auth.uid() or new.kind<>'notice' or new.seq<>1 or new.response_due is null or new.response_due<=today then raise exception 'Valid notice required'; end if;
 else
  if new.seq<>p.seq+1 or new.staff_id<>p.staff_id then raise exception 'Stale or invalid case; reload'; end if;
  select response_due into deadline from public.hr_discipline_events where case_id=new.case_id and seq=1;
  if new.kind='response' then
   if new.staff_id<>auth.uid() or p.kind not in ('notice','response','review') then raise exception 'Response not allowed'; end if;
  else
   if actor_role<>'owner' or new.staff_id=auth.uid() then raise exception 'Owner required'; end if;
   if not ((p.kind='notice' and new.kind='review' and today>p.response_due) or (p.kind='response' and new.kind='review') or (p.kind='review' and (new.kind='review' or (new.kind='outcome' and today>deadline))) or (p.kind='outcome' and new.kind in ('pip','close')) or (p.kind in ('pip','pip_update') and new.kind in ('pip_update','close'))) then raise exception 'Invalid transition'; end if;
  end if;
 end if;
 new.created_at:=clock_timestamp(); return new;
end; $$;
revoke all on function public.hr_discipline_validate() from public,anon,authenticated;
create trigger hr_discipline_validate before insert on public.hr_discipline_events for each row execute function public.hr_discipline_validate();
-- No app update/delete. No payroll triggers. All events shared with recipient.
commit;
