-- V84: Shared Runner trip editing for active Operations staff.
-- Already applied to Supabase project bu zp... on 2026-11-19.
-- Run only on a project with V47_RUNNER_MIGRATION.sql already installed.
-- Owner-only money controls and trip deletion remain unchanged.
create or replace function public.runner_trips_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r text := public.runner_role();
begin
  if r is null or r not in ('owner','operations') then
    raise exception 'Tiada akses modul Runner.';
  end if;

  if tg_op = 'INSERT' then
    if r <> 'owner' then new.upah := 0; end if;
    new.created_by := auth.uid();
    return new;
  end if;

  -- All Operations staff may edit shared trip details, not just its creator.
  -- Financial amount and record ownership stay protected.
  if r <> 'owner' then
    if new.upah is distinct from old.upah
       or new.created_ms is distinct from old.created_ms
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at
       or new.id is distinct from old.id then
      raise exception 'Hanya Owner boleh ubah upah atau maklumat pemilikan rekod.';
    end if;
    if new.exp is distinct from old.exp
       and exists (select 1 from public.runner_payments p where p.trip_id = old.id) then
      raise exception 'Trip sudah dibayar, tuntutan dikunci.';
    end if;
  end if;
  return new;
end $$;
