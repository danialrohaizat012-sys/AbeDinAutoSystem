-- HR delegation candidate. Test-only, no automatic promotion to Owner.
BEGIN;
create table public.hr_delegate_access (
 staff_id uuid primary key references public.profiles(id),
 enabled boolean not null default false,
 revision integer not null check(revision>0),
 changed_by uuid not null references public.profiles(id),
 changed_at timestamptz not null default now()
);
create table public.hr_delegate_audit (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.profiles(id),
 enabled boolean not null, revision integer not null,
 changed_by uuid not null references public.profiles(id),
 changed_at timestamptz not null default now(),
 unique(staff_id,revision)
);
create table public.hr_delegate_requests (
 id uuid primary key default gen_random_uuid(),
 requester uuid not null references public.profiles(id),
 access_revision integer not null,
 staff_id uuid not null references public.profiles(id),
 category text not null check(category in ('letter','discipline')),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=80000),
 state text not null default 'pending' check(state in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 decided_by uuid references public.profiles(id), decided_at timestamptz,
 decision_note text, result_id uuid,
 check(requester<>staff_id)
);
create index hr_delegate_request_queue on public.hr_delegate_requests(state,created_at desc);
create index hr_delegate_request_actor on public.hr_delegate_requests(requester,created_at desc);
alter table public.hr_delegate_access enable row level security;
alter table public.hr_delegate_audit enable row level security;
alter table public.hr_delegate_requests enable row level security;
revoke all on public.hr_delegate_access,public.hr_delegate_audit,public.hr_delegate_requests from public,anon,authenticated;
grant select on public.hr_delegate_access,public.hr_delegate_audit,public.hr_delegate_requests to authenticated;
create policy hr_delegate_access_read on public.hr_delegate_access for select to authenticated using(public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
create policy hr_delegate_audit_read on public.hr_delegate_audit for select to authenticated using(public.att_role()='owner');
create policy hr_delegate_request_read on public.hr_delegate_requests for select to authenticated using(public.att_role()='owner' or (requester=auth.uid() and public.att_role() is not null and exists(select 1 from public.hr_delegate_access a where a.staff_id=auth.uid() and a.enabled)));
create function public.hr_set_delegate(p_staff uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
declare a public.hr_delegate_access%rowtype;
begin
 if auth.uid() is null or public.att_role() is distinct from 'owner' then raise exception 'Owner required' using errcode='42501'; end if;
 if p_staff is null or p_enabled is null or p_staff=auth.uid() or not exists(select 1 from public.profiles p where p.id=p_staff and p.role::text<>'owner' and (p.enabled or not p_enabled)) then raise exception 'Invalid staff account'; end if;
 insert into public.hr_delegate_access(staff_id,enabled,revision,changed_by) values(p_staff,p_enabled,1,auth.uid())
 on conflict(staff_id) do update set enabled=excluded.enabled,revision=public.hr_delegate_access.revision+1,changed_by=auth.uid(),changed_at=now()
 where public.hr_delegate_access.enabled is distinct from excluded.enabled
 returning * into a;
 if found then insert into public.hr_delegate_audit(staff_id,enabled,revision,changed_by) values(a.staff_id,a.enabled,a.revision,a.changed_by); end if;
end $$;
create function public.hr_delegate_directory() returns table(id uuid,full_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or public.att_role() is null or not exists(select 1 from public.hr_delegate_access a where a.staff_id=auth.uid() and a.enabled) then raise exception 'HR permission required' using errcode='42501'; end if;
 return query select p.id,p.full_name from public.profiles p where p.enabled and p.role::text<>'owner' and p.id<>auth.uid() order by p.full_name;
end $$;
create function public.hr_delegate_submit(p_staff uuid,p_category text,p_payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare rev integer; result uuid; due date;
begin
 if auth.uid() is null or public.att_role() is null then raise exception 'Active staff required' using errcode='42501'; end if;
 select revision into rev from public.hr_delegate_access where staff_id=auth.uid() and enabled for update;
 if not found then raise exception 'HR permission required' using errcode='42501'; end if;
 if p_staff=auth.uid() or not exists(select 1 from public.profiles p where p.id=p_staff and p.enabled and p.role::text<>'owner') then raise exception 'Invalid recipient'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>80000 then raise exception 'Invalid payload'; end if;
 if p_category='letter' then
  if coalesce(p_payload->>'kind','') not in ('offer','contract','confirmation','increment','show_cause','warning','general') or length(btrim(coalesce(p_payload->>'subject',''))) not between 1 and 200 or length(btrim(coalesce(p_payload->>'body',''))) not between 1 and 20000 or length(btrim(coalesce(p_payload->>'reason',''))) not between 1 and 1000 then raise exception 'Invalid letter draft'; end if;
  if nullif(p_payload->>'effective_date','') is not null then perform (p_payload->>'effective_date')::date; end if;
 elsif p_category='discipline' then
  due:=(p_payload->>'response_due')::date;
  if due is null or due<=(now() at time zone 'Asia/Kuala_Lumpur')::date or length(btrim(coalesce(p_payload->>'body',''))) not between 10 and 10000 then raise exception 'Invalid proposed notice'; end if;
 else raise exception 'Invalid request category'; end if;
 insert into public.hr_delegate_requests(requester,access_revision,staff_id,category,payload) values(auth.uid(),rev,p_staff,p_category,p_payload) returning id into result;
 return result;
end $$;
create function public.hr_delegate_decide(p_request uuid,p_approve boolean,p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare r public.hr_delegate_requests%rowtype; result uuid; recipient text;
begin
 if auth.uid() is null or public.att_role() is distinct from 'owner' then raise exception 'Owner required' using errcode='42501'; end if;
 if p_approve is null or length(btrim(coalesce(p_note,''))) not between 1 and 1000 then raise exception 'Decision note required'; end if;
 select * into r from public.hr_delegate_requests where id=p_request for update;
 if not found or r.state<>'pending' then raise exception 'Request not pending'; end if;
 if p_approve then
  perform 1 from public.hr_delegate_access a join public.profiles p on p.id=a.staff_id where a.staff_id=r.requester and a.enabled and a.revision=r.access_revision and p.enabled and p.role::text<>'owner' for update of a;
  if not found then raise exception 'Delegation changed; reject and request a new draft'; end if;
  select p.full_name into recipient from public.profiles p where p.id=r.staff_id and p.enabled and p.role::text<>'owner';
  if not found or length(btrim(coalesce(recipient,''))) not between 1 and 200 then raise exception 'Recipient unavailable'; end if;
  if r.category='letter' then
   insert into public.hr_letters(staff_id,series_id,revision,kind,state,subject,recipient,body,effective_date,reason)
   values(r.staff_id,gen_random_uuid(),1,r.payload->>'kind','draft',r.payload->>'subject',recipient,r.payload->>'body',nullif(r.payload->>'effective_date','')::date,r.payload->>'reason') returning id into result;
  elsif r.category='discipline' then
   result:=gen_random_uuid();
   insert into public.hr_discipline_events(case_id,staff_id,seq,kind,body,response_due)
   values(result,r.staff_id,1,'notice',r.payload->>'body',(r.payload->>'response_due')::date);
  end if;
 end if;
 update public.hr_delegate_requests set state=case when p_approve then 'approved' else 'rejected' end,decided_by=auth.uid(),decided_at=now(),decision_note=btrim(p_note),result_id=result where id=r.id;
 return result;
end $$;
revoke all on function public.hr_set_delegate(uuid,boolean),public.hr_delegate_directory(),public.hr_delegate_submit(uuid,text,jsonb),public.hr_delegate_decide(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.hr_set_delegate(uuid,boolean),public.hr_delegate_directory(),public.hr_delegate_submit(uuid,text,jsonb),public.hr_delegate_decide(uuid,boolean,text) to authenticated;
COMMIT;
