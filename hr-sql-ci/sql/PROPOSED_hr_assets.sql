-- Draft for isolated testing only. Requires profiles and att_role().
begin;
create table public.hr_assets (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Z0-9][A-Z0-9-]{1,29}$'),
 name text not null check(length(btrim(name)) between 2 and 120),
 category text not null check(category in ('key','phone','computer','fuel_card','vehicle','other')),
 created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.hr_asset_events (
 asset_id uuid not null references public.hr_assets(id), seq integer not null check(seq>0),
 kind text not null check(kind in ('issue','return','maintenance','ready','retire')),
 staff_id uuid references public.profiles(id), condition_note text not null check(length(btrim(condition_note)) between 2 and 500),
 created_by uuid not null default auth.uid() references public.profiles(id), created_at timestamptz not null default clock_timestamp(),
 primary key(asset_id,seq), check((kind in ('issue','return'))=(staff_id is not null))
);
create index hr_asset_events_staff_idx on public.hr_asset_events(staff_id,created_at desc);
alter table public.hr_assets enable row level security;
alter table public.hr_asset_events enable row level security;
revoke all on public.hr_assets,public.hr_asset_events from public,anon,authenticated;
grant select on public.hr_assets,public.hr_asset_events to authenticated;
grant insert(code,name,category) on public.hr_assets to authenticated;
grant insert(asset_id,seq,kind,staff_id,condition_note) on public.hr_asset_events to authenticated;
create policy hr_asset_read on public.hr_assets for select to authenticated using(public.att_role()='owner' or (public.att_role() is not null and exists(select 1 from public.hr_asset_events e where e.asset_id=hr_assets.id and e.staff_id=auth.uid())));
create policy hr_asset_create on public.hr_assets for insert to authenticated with check(public.att_role()='owner' and created_by=auth.uid());
create policy hr_asset_event_read on public.hr_asset_events for select to authenticated using(public.att_role()='owner' or (public.att_role() is not null and staff_id=auth.uid()));
create policy hr_asset_event_create on public.hr_asset_events for insert to authenticated with check(public.att_role()='owner' and created_by=auth.uid());
create function public.hr_asset_validate() returns trigger language plpgsql security invoker set search_path='' as $$
declare prev public.hr_asset_events%rowtype; next_seq integer:=1; state text:='available';
begin
 if public.att_role() is distinct from 'owner' or auth.uid() is null or new.created_by is distinct from auth.uid() then raise exception 'Owner required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hr-asset:'||new.asset_id::text,0));
 select * into prev from public.hr_asset_events where asset_id=new.asset_id order by seq desc limit 1;
 if found then next_seq:=prev.seq+1; state:=case prev.kind when 'issue' then 'issued' when 'maintenance' then 'maintenance' when 'retire' then 'retired' else 'available' end; end if;
 if new.seq<>next_seq then raise exception 'Stale asset history; reload'; end if;
 if not ((state='available' and new.kind in ('issue','maintenance','retire')) or (state='issued' and new.kind='return' and new.staff_id=prev.staff_id) or (state='maintenance' and new.kind in ('ready','retire'))) then raise exception 'Invalid asset transition'; end if;
 if new.kind='issue' and not exists(select 1 from public.profiles p where p.id=new.staff_id and p.enabled is true) then raise exception 'Active staff required'; end if;
 new.created_at:=clock_timestamp(); return new;
end; $$;
revoke all on function public.hr_asset_validate() from public,anon,authenticated;
create trigger hr_asset_validate before insert on public.hr_asset_events for each row execute function public.hr_asset_validate();
commit;
