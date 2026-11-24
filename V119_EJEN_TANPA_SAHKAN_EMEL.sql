-- V119: akaun ejen dari agent.html disahkan automatik (tiada pengesahan e-mel)
create or replace function public.agent_signup_autoconfirm()
returns trigger language plpgsql security definer set search_path = auth, public as $$
begin
  if coalesce(new.raw_user_meta_data->>'signup_source','') = 'agent_portal' and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end $$;
revoke all on function public.agent_signup_autoconfirm() from public, anon, authenticated;
drop trigger if exists agent_signup_autoconfirm_trg on auth.users;
create trigger agent_signup_autoconfirm_trg before insert on auth.users
  for each row execute function public.agent_signup_autoconfirm();
