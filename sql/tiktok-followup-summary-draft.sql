-- Review before applying. Invoker rights preserve existing lead and history RLS.
begin;
create function public.tiktok_followup_summary()
returns table(total bigint,new_leads bigint,interested bigint,closed bigint,never_followed bigint,due_today bigint,overdue bigint,upcoming bigint)
language sql stable security invoker set search_path=''
as $$
 select count(*),count(*) filter(where l.status='new'),count(*) filter(where l.status='interested'),count(*) filter(where l.status='closed'),
 count(*) filter(where f.id is null and l.status not in ('closed','not_interested')),
 count(*) filter(where l.status not in ('closed','not_interested') and (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date=(now() at time zone 'Asia/Kuala_Lumpur')::date),
 count(*) filter(where l.status not in ('closed','not_interested') and (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date<(now() at time zone 'Asia/Kuala_Lumpur')::date),
 count(*) filter(where l.status not in ('closed','not_interested') and (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date>(now() at time zone 'Asia/Kuala_Lumpur')::date)
 from public.tiktok_leads l
 left join lateral (select h.id,h.next_followup_at from public.tiktok_lead_followups h where h.lead_id=l.id order by h.created_at desc,h.id desc limit 1) f on true;
$$;
revoke all on function public.tiktok_followup_summary() from public,anon,authenticated;
grant execute on function public.tiktok_followup_summary() to authenticated;
commit;
