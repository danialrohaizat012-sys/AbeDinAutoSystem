-- Abe Din Auto V80: Sales Advisor boleh buat booking Puspakom.
-- Sales Advisor: tambah / kemas kini tempahan (tarikh, masa, lokasi, runner, dokumen, catatan),
--                termasuk keputusan Lulus/Gagal. Padam rekod kekal Owner sahaja.

create policy puspakom_insert_sa on public.puspakom
  for insert to authenticated with check (public.puspakom_role() = 'sales_advisor');
create policy puspakom_update_sa on public.puspakom
  for update to authenticated using (public.puspakom_role() = 'sales_advisor') with check (public.puspakom_role() = 'sales_advisor');

create or replace function public.puspakom_sa_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;  -- tiada sekatan status untuk Sales Advisor
end
$$;
revoke all on function public.puspakom_sa_guard() from public, anon, authenticated;
create trigger puspakom_sa_guard before insert or update on public.puspakom
  for each row execute function public.puspakom_sa_guard();
