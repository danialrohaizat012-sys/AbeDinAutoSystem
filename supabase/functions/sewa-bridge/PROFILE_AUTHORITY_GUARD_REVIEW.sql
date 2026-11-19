-- V82 REVIEW-ONLY SQL. Do not apply to production without staging tests.
-- This prevents ordinary authenticated users from changing Sewa role/enabled fields,
-- even if an existing UPDATE policy allows edits to other profiles.
-- This is defense in depth, NOT cross-project session revocation.
--
-- Validate compatibility with any existing profile triggers and administrative
-- flows before enabling. Run as migration owner (postgres).
create or replace function public.sewa_protect_profile_authority()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and (
    new.role is distinct from old.role
    or new.enabled is distinct from old.enabled
    or new.id is distinct from old.id
    or new.email is distinct from old.email
  ) then
    raise exception 'Profile authority fields are managed by the server'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists sewa_protect_profile_authority_update on public.profiles;
create trigger sewa_protect_profile_authority_update
before update on public.profiles
for each row execute function public.sewa_protect_profile_authority();

-- Prevent accidental public execution. Triggers do not require client EXECUTE.
revoke all on function public.sewa_protect_profile_authority() from public, anon, authenticated;

-- STAGING acceptance checks:
-- 1. As authenticated owner, UPDATE role/enabled/email on another profile -> 42501.
-- 2. As authenticated owner, UPDATE permitted non-authority field -> subject to RLS.
-- 3. As service_role, trusted bridge UPDATE role/enabled -> succeeds.
-- 4. Existing-session downgrade: verify RLS reads updated role from DB.
-- 5. Existing-session disable: verify RLS returns NULL.
-- 6. Audit all other SECURITY DEFINER paths for bypass of this trigger.
--
-- Rollback (staging only):
-- drop trigger if exists sewa_protect_profile_authority_update on public.profiles;
-- drop function if exists public.sewa_protect_profile_authority();
