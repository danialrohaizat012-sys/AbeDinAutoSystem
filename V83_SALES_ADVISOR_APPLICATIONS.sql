-- V83: Permohonan pelanggan, full workflow for enabled Owner / Operations / Sales Advisor.
-- Uses archive (soft delete) to retain an audit trail instead of irreversible DELETE.
-- Existing anonymous submission RPCs and INSERT privileges remain unchanged.
begin;
alter table public.buyer_applications
  add column if not exists read_at timestamptz,
  add column if not exists read_by uuid,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid;

-- Restore the existing read privilege and permit only the required UPDATE operation.
grant select, update on public.buyer_applications to authenticated;
revoke delete on public.buyer_applications from authenticated;

drop policy if exists buyer_applications_staff_read on public.buyer_applications;
create policy buyer_applications_staff_read
on public.buyer_applications for select to authenticated
using (
  deleted_at is null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.enabled is true
      and p.role in ('owner','operations','sales_advisor')
  )
);

drop policy if exists buyer_applications_staff_update on public.buyer_applications;
create policy buyer_applications_staff_update
on public.buyer_applications for update to authenticated
using (
  deleted_at is null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.enabled is true
      and p.role in ('owner','operations','sales_advisor')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.enabled is true
      and p.role in ('owner','operations','sales_advisor')
  )
);

create index if not exists buyer_applications_active_read_idx
  on public.buyer_applications (created_at desc) where deleted_at is null;

-- Sales Advisor is authorized for the Permohonan menu on request.
-- Preserve each employee's other menu permissions and all application records.
update public.profiles
set permissions = jsonb_set(coalesce(permissions,'{}'::jsonb),'{applications}','true'::jsonb,true)
where role='sales_advisor' and enabled is true
  and permissions->>'applications'='false';

commit;
