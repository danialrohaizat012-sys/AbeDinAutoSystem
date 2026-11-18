-- V77: Sales Advisor boleh ubah status kereta (Available/Reserved/Sold) dalam Inventori.
create or replace function public.set_catalogue_status(p_vehicle_id uuid, p_status text)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r public.staff_role;
  s text := lower(trim(coalesce(p_status,'')));
begin
  r := public.current_staff_role();
  if r is null or r not in ('owner','sales_advisor') then
    raise exception 'Owner atau Sales Advisor sahaja boleh ubah status';
  end if;
  if s not in ('available','reserved','sold') then
    raise exception 'Status catalogue tidak sah';
  end if;
  update public.vehicles
     set catalogue_status=s, updated_at=now()
   where id=p_vehicle_id;
  if not found then raise exception 'Kenderaan tidak ditemui'; end if;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
  values(auth.uid(),'catalogue_status_update','vehicle',p_vehicle_id::text,jsonb_build_object('catalogue_status',s));
  return s;
end;
$function$;
