-- AbeDinAuto Puspakom: shared editing for active Operations staff.
-- Owner and Sales Advisor retain existing INSERT/UPDATE rights.
-- DELETE remains restricted to Owner. Profile enabled check is enforced by puspakom_role().
-- Safe to re-run.
drop policy if exists puspakom_insert_operations on public.puspakom;
create policy puspakom_insert_operations on public.puspakom
  for insert to authenticated
  with check (public.puspakom_role() = 'operations');

drop policy if exists puspakom_update_operations on public.puspakom;
create policy puspakom_update_operations on public.puspakom
  for update to authenticated
  using (public.puspakom_role() = 'operations')
  with check (public.puspakom_role() = 'operations');
