-- Service-only Data API gateway for private admin approval function.
-- Apply after agent_admin_review_v1.sql, in staging only until QA passes.
begin;
create or replace function public.agent_admin_review_v1(
  p_actor uuid, p_application uuid, p_decision text, p_reason text default null
) returns jsonb
language sql security invoker set search_path = ''
as $$
  select agent_internal.review_agent_application(p_actor,p_application,p_decision,p_reason);
$$;
revoke all on function public.agent_admin_review_v1(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.agent_admin_review_v1(uuid,uuid,text,text) to service_role;
commit;
