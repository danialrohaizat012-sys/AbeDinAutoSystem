-- TikTok Lead: benarkan betulkan maklumat lead selepas import.
-- RLS tiktok_update sedia ada kekal: owner semua, sales_advisor lead sendiri sahaja.
grant update(name,phone,city,state,occupation) on public.tiktok_leads to authenticated;

-- Ejaan "staff" dalam laporan prestasi.
create or replace function public.tiktok_staff_performance()
returns table(staff_id uuid,staff_name text,total bigint,contacted bigint,interested bigint,closed bigint,overdue bigint)
language sql stable security invoker set search_path=''
as $$
select l.assigned_to,coalesce(p.full_name::text,'Belum ditetapkan / staff terdahulu'),count(*),
count(*) filter(where l.status in ('contacted','interested','closed','not_interested')),
count(*) filter(where l.status='interested'),
count(*) filter(where l.status='closed'),
count(*) filter(where l.status not in ('closed','not_interested') and (f.next_followup_at at time zone 'Asia/Kuala_Lumpur')::date < (now() at time zone 'Asia/Kuala_Lumpur')::date)
from public.tiktok_leads l
left join public.profiles p on p.id=l.assigned_to
left join lateral (select h.next_followup_at from public.tiktok_lead_followups h where h.lead_id=l.id order by h.created_at desc,h.id desc limit 1) f on true
group by l.assigned_to,p.full_name
order by count(*) desc,l.assigned_to;
$$;
