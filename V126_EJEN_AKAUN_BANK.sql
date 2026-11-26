-- V126: Maklumat akaun bank ejen (untuk bayaran komisen)
-- Ejen isi sendiri di Portal Ejen → Profil. Owner nampak dalam Pengurusan Ejen (senarai ejen & payout).
alter table public.agent_account_details
  add column if not exists bank_name text,
  add column if not exists bank_account_no text,
  add column if not exists bank_account_holder text;
do $$ begin
  alter table public.agent_account_details add constraint agent_bank_len_chk check (
    char_length(coalesce(bank_name,'')) <= 80 and char_length(coalesce(bank_account_no,'')) <= 34
    and char_length(coalesce(bank_account_holder,'')) <= 160 and coalesce(bank_account_no,'') ~ '^[0-9 -]*$');
exception when duplicate_object then null; end $$;

create or replace function public.owner_agent_list_v1()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
begin
  perform agent_internal.assert_owner_v1();
  return coalesce((
    select jsonb_agg(r order by r.sort_status, r.activated_at desc nulls last, r.applied_at desc nulls last)
    from (
      select coalesce(p.user_id,a.user_id) as user_id, p.id as agent_profile_id, a.id as application_id,
             coalesce(nullif(d.display_name,''),a.full_name) as name,
             coalesce(nullif(d.phone,''),a.phone) as phone,
             coalesce(a.email,u.email) as email,
             coalesce(nullif(d.state,''),a.state) as state,
             d.city, d.address, d.bank_name, d.bank_account_no, d.bank_account_holder,
             p.agent_code, coalesce(p.status,'tiada profil') as agent_status,
             a.status as application_status, a.applied_at, p.activated_at,
             case when p.status='active' then 0 when a.status='pending' then 1 when p.status='suspended' then 2 else 3 end as sort_status,
             (select count(*) from agent_click_events c where c.agent_id=p.id) as clicks,
             (select count(*) from agent_click_events c where c.agent_id=p.id and c.clicked_on>=current_date-30) as clicks_30d,
             (select count(*) from agent_leads l where l.agent_id=p.id) as leads,
             (select count(*) from agent_commissions m where m.agent_id=p.id) as commissions,
             (select coalesce(sum(m.agreed_amount),0) from agent_commissions m where m.agent_id=p.id) as commission_total,
             (select coalesce(sum(o.amount),0) from agent_payouts o where o.agent_id=p.id and o.status='paid') as paid_total
      from agent_applications a
      full join agent_profiles p on p.user_id=a.user_id
      left join agent_account_details d on d.user_id=coalesce(p.user_id,a.user_id)
      left join auth.users u on u.id=coalesce(p.user_id,a.user_id)
    ) r), '[]'::jsonb);
end $function$;
