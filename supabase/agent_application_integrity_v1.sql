-- STAGING ONLY. Add after agent_admin_review_v1.sql.
-- Protects only new agent_applications, not existing staff or sales data.
begin;
create or replace function agent_internal.guard_application_identity_v1()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_email text;
  v_confirmed timestamptz;
begin
  if tg_op <> 'INSERT' then
    raise exception 'Application may not be edited by applicants' using errcode='23514';
  end if;
  if new.status <> 'pending'
     or new.reviewed_at is not null or new.reviewed_by is not null
     or new.review_note is not null then
    raise exception 'An application must start pending' using errcode='23514';
  end if;
  select u.email,u.email_confirmed_at into v_email,v_confirmed
  from auth.users u where u.id=new.user_id;
  if v_email is null or v_confirmed is null
     or lower(btrim(new.email)) <> lower(v_email) then
    raise exception 'Applicant must use their own verified email address'
    using errcode='23514';
  end if;
  return new;
end; $$;
revoke all on function agent_internal.guard_application_identity_v1() from public,anon,authenticated;
drop trigger if exists agent_application_identity_v1 on public.agent_applications;
create trigger agent_application_identity_v1 before insert on public.agent_applications
for each row execute function agent_internal.guard_application_identity_v1();
commit;

-- Checks to run on isolated staging:
-- A valid confirmed user can insert own pending application.
-- An unconfirmed or mismatched-email account cannot insert, including via REST.
-- Another user_id is blocked by RLS.
-- Owner review remains possible via existing agent_internal.review_agent_application.
