-- Draft only: run on isolated test database before production.
BEGIN;
create table public.hr_kpi_targets (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.profiles(id),
 period date not null check (extract(day from period)=1),
 metric text not null check (metric in ('sales','inspections','runner','followups','tasks')),
 revision integer not null check (revision>0),
 target integer not null check (target between 1 and 1000000),
 reason text not null check (length(btrim(reason)) between 1 and 1000),
 created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
 unique(staff_id,period,metric,revision), unique(id,staff_id)
);
create table public.hr_kpi_reviews (
 id uuid primary key default gen_random_uuid(), target_id uuid not null,
 staff_id uuid not null,
 revision integer not null check (revision>0),
 actual integer not null check (actual between 0 and 1000000),
 evidence text not null check (length(btrim(evidence)) between 1 and 2000),
 context text not null check (length(btrim(context)) between 1 and 2000),
 created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
 foreign key(target_id,staff_id) references public.hr_kpi_targets(id,staff_id),
 unique(target_id,revision), unique(id,staff_id)
);
create table public.hr_kpi_feedback (
 id uuid primary key default gen_random_uuid(), review_id uuid not null,
 staff_id uuid not null default auth.uid(),
 message text not null check (length(btrim(message)) between 1 and 2000),
 created_at timestamptz not null default now(),
 foreign key(review_id,staff_id) references public.hr_kpi_reviews(id,staff_id)
);
create index hr_kpi_feedback_staff_idx on public.hr_kpi_feedback(staff_id,created_at);
create index hr_kpi_reviews_staff_idx on public.hr_kpi_reviews(staff_id,created_at);
alter table public.hr_kpi_targets enable row level security;
alter table public.hr_kpi_reviews enable row level security;
alter table public.hr_kpi_feedback enable row level security;
revoke all on public.hr_kpi_targets, public.hr_kpi_reviews, public.hr_kpi_feedback from public, anon, authenticated;
grant select on public.hr_kpi_targets, public.hr_kpi_reviews, public.hr_kpi_feedback to authenticated;
grant insert(staff_id,period,metric,revision,target,reason) on public.hr_kpi_targets to authenticated;
grant insert(target_id,staff_id,revision,actual,evidence,context) on public.hr_kpi_reviews to authenticated;
grant insert(review_id,message) on public.hr_kpi_feedback to authenticated;
create policy kpi_targets_read on public.hr_kpi_targets for select to authenticated using (public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
create policy kpi_targets_owner_add on public.hr_kpi_targets for insert to authenticated with check (public.att_role()='owner' and created_by=auth.uid());
create policy kpi_reviews_read on public.hr_kpi_reviews for select to authenticated using (public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
create policy kpi_reviews_owner_add on public.hr_kpi_reviews for insert to authenticated with check (public.att_role()='owner' and created_by=auth.uid() and exists(select 1 from public.hr_kpi_targets t where t.id=target_id and (t.period+interval '1 month')::date <= (now() at time zone 'Asia/Kuala_Lumpur')::date));
create policy kpi_feedback_read on public.hr_kpi_feedback for select to authenticated using (public.att_role()='owner' or (staff_id=auth.uid() and public.att_role() is not null));
create policy kpi_feedback_self_add on public.hr_kpi_feedback for insert to authenticated with check (staff_id=auth.uid() and public.att_role() is not null);
-- No UPDATE/DELETE grants or policies: preserve published history.
COMMIT;
