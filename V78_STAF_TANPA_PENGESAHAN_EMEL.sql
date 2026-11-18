-- V78: Staf yang mendaftar tidak perlu sahkan emel. Akaun disahkan automatik
-- semasa daftar (staff_register) dan semasa Owner luluskan (staff_reg_decide).

create or replace function public.staff_confirm_email(p_uid uuid)
returns void language sql security definer set search_path = public, auth as $$
  update auth.users set email_confirmed_at = now() where id = p_uid and email_confirmed_at is null;
$$;
revoke all on function public.staff_confirm_email(uuid) from public, anon, authenticated;

-- Hook ke staff_register: sahkan emel sebaik pendaftaran diterima.
create or replace function public.staff_reg_autoconfirm_trg()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.staff_confirm_email(new.user_id);
  return new;
end $$;
drop trigger if exists staff_reg_autoconfirm on public.staff_registrations;
create trigger staff_reg_autoconfirm after insert or update on public.staff_registrations
  for each row execute function public.staff_reg_autoconfirm_trg();

-- Betulkan akaun staf sedia ada yang belum disahkan.
update auth.users u set email_confirmed_at = now()
 where u.email_confirmed_at is null
   and (exists (select 1 from public.staff_registrations r where r.user_id = u.id)
        or exists (select 1 from public.profiles p where p.id = u.id and p.enabled));
