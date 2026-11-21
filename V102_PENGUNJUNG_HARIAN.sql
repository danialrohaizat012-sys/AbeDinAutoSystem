-- Abe Din Auto V102: pengunjung harian (unik, ikut waktu Malaysia) di katalog awam.
create table if not exists public.public_visitor_daily (
  day date not null,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (day, visitor_id)
);
alter table public.public_visitor_daily enable row level security;
revoke all on public.public_visitor_daily from anon, authenticated;
create or replace function public.register_public_catalogue_visit(p_visitor_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_total bigint := 0;
  v_today bigint := 0;
  v_day date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  v_total := public.register_public_catalogue_visitor(p_visitor_id);
  insert into public.public_visitor_daily(day, visitor_id) values (v_day, p_visitor_id) on conflict do nothing;
  select count(*) into v_today from public.public_visitor_daily where day = v_day;
  return jsonb_build_object('total', coalesce(v_total,0), 'today', v_today);
end $$;
revoke all on function public.register_public_catalogue_visit(uuid) from public;
grant execute on function public.register_public_catalogue_visit(uuid) to anon, authenticated;
