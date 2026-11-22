-- Agent Network V1: privileged approval draft, apply ONLY after agent_network_v1.sql
-- STAGED: do not execute against production until staging tests pass.
-- No updates to existing business tables.
begin;
create schema if not exists agent_internal;
revoke all on schema agent_internal from public, anon, authenticated;
grant usage on schema agent_internal to service_role;
create sequence if not exists agent_internal.agent_code_counter start 1;

create or replace function agent_internal.review_agent_application(
  p_actor uuid, p_application uuid, p_decision text, p_reason text default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_request public.agent_applications%rowtype;
  v_agent_id uuid;
  v_sequence bigint;
  v_code text;
begin
  if p_actor is null or p_application is null
    or p_decision is null or p_decision not in ('approve','reject') then
    raise exception 'Invalid review request' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id=p_actor and p.enabled is true and p.role::text='owner'
  ) then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  select * into v_request from public.agent_applications
    where id=p_application for update;
  if not found then
    raise exception 'Application not found' using errcode='P0002';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Already reviewed' using errcode='23505';
  end if;

  if p_decision='approve' then
    if not exists (
      select 1 from auth.users u
      where u.id=v_request.user_id and u.email_confirmed_at is not null
    ) then
      raise exception 'Applicant email unverified' using errcode='22023';
    end if;
    -- Sequence-based ID is safe across concurrent approvals.
    v_sequence := nextval('agent_internal.agent_code_counter'::regclass);
    v_code := 'ADA-AG-' || lpad(v_sequence::text, greatest(4,length(v_sequence::text)), '0');
    insert into public.agent_profiles (user_id,application_id,agent_code,status)
      values (v_request.user_id,v_request.id,v_code,'active')
      returning id into v_agent_id;
  else
    if nullif(btrim(p_reason),'') is null then
      raise exception 'Rejection reason required' using errcode='22023';
    end if;
  end if;

  update public.agent_applications set
    status=case when p_decision='approve' then 'approved' else 'rejected' end,
    reviewed_at=now(), reviewed_by=p_actor, review_note=left(p_reason,2000)
  where id=v_request.id;
  insert into public.agent_audit_events(actor_user_id,entity_type,entity_id,action,reason)
  values (p_actor,'agent_application',v_request.id,p_decision,left(p_reason,2000));
  if v_agent_id is not null then
    insert into public.agent_audit_events(actor_user_id,entity_type,entity_id,action,reason)
    values (p_actor,'agent_profile',v_agent_id,'activate','Approved application');
  end if;
  return jsonb_build_object(
    'application_id',v_request.id,
    'status',case when p_decision='approve' then 'approved' else 'rejected' end,
    'agent_id',v_agent_id,'agent_code',v_code
  );
end; $$;

revoke all on function agent_internal.review_agent_application(uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function agent_internal.review_agent_application(uuid,uuid,text,text) to service_role;
commit;
