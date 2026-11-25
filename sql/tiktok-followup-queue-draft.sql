begin;
create function public.tiktok_followup_queue(p_filter text)
returns setof public.tiktok_leads
language sql stable security invoker set search_path=''
as $$
select l.* from public.tiktok_leads l
left join lateral (
 select h.id,h.next_followup_at from public.tiktok_lead_followups h
 where h.lead_id=l.id order by h.created_at desc,h.id desc limit 1
) f on true
where l.status not in ('closed','not_interested')
and case p_filter
 when 'never' then f.id is null
 when 'today' then (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date=(now() at time zone 'Asia/Kuala_Lumpur')::date
 when 'overdue' then (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date<(now() at time zone 'Asia/Kuala_Lumpur')::date
 when 'upcoming' then (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date>(now() at time zone 'Asia/Kuala_Lumpur')::date
 when 'unscheduled' then f.id is not null and f.next_followup_at is null
 else false end;
$$;
revoke all on function public.tiktok_followup_queue(text) from public,anon,authenticated;
grant execute on function public.tiktok_followup_queue(text) to authenticated;
commit;
