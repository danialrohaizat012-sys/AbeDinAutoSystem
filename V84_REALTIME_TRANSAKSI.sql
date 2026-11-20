-- Abe Din Auto V84: kemas kini transaksi masa nyata (<5 saat) di semua peranti.
-- Jadual transaksi dimasukkan ke dalam publication supabase_realtime; app dengar perubahan dan muat semula halaman semasa.
do $$
declare t text;
begin
  foreach t in array array['vehicles','sales','payments','customers','suppliers','puspakom','checklist_inspections','vehicle_images','vehicle_costs','staff_leaves','staff_claims','staff_advances','staff_hr','staff_pay','attendance_punches','attendance_requests','attendance_day_flags','buyer_applications'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
