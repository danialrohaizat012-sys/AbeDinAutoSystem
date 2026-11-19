-- Notify Owner and requester in AbeDinAuto's existing app_notifications bell.
create or replace function public.runner_upah_send_notices()
returns trigger language plpgsql security definer set search_path=public as $$
declare p record; vplate text;
begin
 select plate into vplate from public.runner_trips where id=new.trip_id;
 if tg_op='INSERT' and new.status='pending' then
  for p in select id from public.profiles where role::text='owner' and enabled is true loop
   insert into public.app_notifications(user_id,kind,title,body,page,ref_id)
    values(p.id,'runner_upah','Permohonan pelarasan upah Runner',
    coalesce(vplate,'Trip')||' · '||case when new.direction='tambah' then 'Tambah ' else 'Kurang ' end||
    'RM'||to_char(new.amount,'FM999999990.00')||' menunggu kelulusan.',
    'runner',new.id::text);
  end loop;
 elsif tg_op='UPDATE' and new.status is distinct from old.status and new.status in ('approved','rejected') then
  insert into public.app_notifications(user_id,kind,title,body,page,ref_id)
   values(new.requested_by,'runner_upah',
    case when new.status='approved' then 'Permohonan upah diluluskan' else 'Permohonan upah ditolak' end,
    coalesce(vplate,'Trip')||' · '||case when new.status='approved' then 'Diluluskan' else 'Ditolak' end||
    ' oleh Owner.','runner',new.id::text);
 end if;
 return new;
end $$;
revoke all on function public.runner_upah_send_notices() from public,anon,authenticated;
drop trigger if exists runner_upah_send_notices_trg on public.runner_upah_requests;
create trigger runner_upah_send_notices_trg after insert or update of status on public.runner_upah_requests
 for each row execute function public.runner_upah_send_notices();