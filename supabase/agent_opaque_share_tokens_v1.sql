-- Opaque customer-facing share tokens; private agent_code stays server-side.
begin;
create table if not exists public.agent_public_share_tokens (
  agent_id uuid primary key references public.agent_profiles(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz not null default now(),
  constraint agent_public_share_tokens_valid check(token ~ '^[a-f0-9]{32}$')
);
alter table public.agent_public_share_tokens enable row level security;
revoke all on public.agent_public_share_tokens from public,anon,authenticated;
grant select on public.agent_public_share_tokens to service_role;
insert into public.agent_public_share_tokens(agent_id)
select id from public.agent_profiles
on conflict(agent_id) do nothing;

create or replace function agent_internal.create_agent_share_token_v1()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 insert into public.agent_public_share_tokens(agent_id)
 values(new.id) on conflict(agent_id) do nothing;
 return new;
end $$;
revoke all on function agent_internal.create_agent_share_token_v1()
from public,anon,authenticated;
drop trigger if exists agent_public_token_on_activation on public.agent_profiles;
create trigger agent_public_token_on_activation
after insert on public.agent_profiles
for each row execute function agent_internal.create_agent_share_token_v1();
commit;