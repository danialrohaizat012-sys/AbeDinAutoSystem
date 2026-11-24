-- V126: Nama ejen dalam mesej WhatsApp "Daftar Minat" (agent-inquiry.html).
-- public_agent_ref_label_v1 kini terima share token (32 hex) ATAU kod ejen (ADA-AG-####).
create or replace function public.public_agent_ref_label_v1(p_token text)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select jsonb_build_object('code',p.agent_code,'name',split_part(btrim(coalesce(nullif(d.display_name,''),a.full_name,'')),' ',1))
  from agent_profiles p
  left join agent_applications a on a.user_id=p.user_id
  left join agent_account_details d on d.user_id=p.user_id
  where p.status='active'
    and (
      (p_token ~ '^[a-f0-9]{32}$' and exists(select 1 from agent_public_share_tokens t where t.agent_id=p.id and t.token=p_token))
      or (p_token ~ '^ADA-AG-[0-9]{4,}$' and length(p_token)<=30 and p.agent_code=p_token)
    )
  limit 1
$function$;
grant execute on function public.public_agent_ref_label_v1(text) to anon, authenticated;
