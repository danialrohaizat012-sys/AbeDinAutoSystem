-- Abe Din Auto V99: resit perbelanjaan dikemas kini masa nyata di dashboard.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='expenses') then
    alter publication supabase_realtime add table public.expenses;
  end if;
end $$;
