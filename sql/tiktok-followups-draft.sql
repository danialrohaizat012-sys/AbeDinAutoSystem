-- Append-only follow-up history; apply after verifying existing TikTok lead RLS.
begin;
create table public.tiktok_lead_followups (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.tiktok_leads(id) on delete restrict,
 note text not null check (length(trim(note)) between 1 and 2000),
 next_followup_at timestamptz,
 created_by uuid not null default auth.uid() references public.profiles(id),
 created_at timestamptz not null default now()
);
create index tiktok_followups_lead_idx on public.tiktok_lead_followups(lead_id,created_at desc);
alter table public.tiktok_lead_followups enable row level security;
revoke all on public.tiktok_lead_followups from public,anon,authenticated;
grant select on public.tiktok_lead_followups to authenticated;
grant insert(lead_id,note,next_followup_at) on public.tiktok_lead_followups to authenticated;
create policy followup_read on public.tiktok_lead_followups for select to authenticated using (
 exists(select 1 from public.tiktok_leads l where l.id=lead_id)
);
create policy followup_insert on public.tiktok_lead_followups for insert to authenticated with check (
 created_by=(select auth.uid()) and exists(select 1 from public.tiktok_leads l where l.id=lead_id)
);
commit;
