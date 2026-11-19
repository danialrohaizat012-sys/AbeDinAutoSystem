create or replace function public.runner_staff_choices()
returns table(id uuid,full_name text)
language sql stable security definer set search_path=public as $$
 select p.id,p.full_name from public.profiles p
 where auth.uid() is not null and public.runner_role() in ('owner','operations')
 and p.enabled is true and p.role::text in ('owner','operations')
 order by p.full_name,id
$$;
revoke all on function public.runner_staff_choices() from public,anon;
grant execute on function public.runner_staff_choices() to authenticated;