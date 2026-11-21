-- Isolated PostgreSQL fixture schema. NEVER execute against AbeDin Auto Supabase.
-- The CI job starts with a fresh empty PostgreSQL service container.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text not null,
  email_confirmed_at timestamptz
);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;

create type public.staff_role as enum ('owner','sales_advisor','operations');
create table public.profiles (
 id uuid primary key references auth.users(id),
 role public.staff_role not null,
 enabled boolean not null default true
);
create table public.vehicles (
 id uuid primary key,
 status text not null
);
create table public.customers (
 id uuid primary key,
 full_name text not null,
 phone text not null
);
create table public.sales (
 id uuid primary key,
 vehicle_id uuid not null references public.vehicles(id),
 customer_id uuid not null references public.customers(id),
 status text not null,
 sold_at timestamptz,
 agreed_price numeric(14,2) not null
);
create table public.payments (
 id uuid primary key,
 sale_id uuid not null references public.sales(id),
 amount numeric(14,2) not null
);

-- service_role emulates the server role on Supabase; authenticated is RLS-limited.
grant usage on schema auth to authenticated,service_role;
grant usage on schema public to anon,authenticated,service_role;
grant select on auth.users to service_role;
grant select on public.profiles,public.sales,public.customers,public.vehicles to service_role;

-- Synthetic fixtures, no actual personal or business records.
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000001','owner-a@test.invalid',now()),
 ('00000000-0000-4000-8000-000000000002','owner-b@test.invalid',now()),
 ('00000000-0000-4000-8000-000000000003','agent-a@test.invalid',now()),
 ('00000000-0000-4000-8000-000000000004','agent-b@test.invalid',now()),
 ('00000000-0000-4000-8000-000000000005','unverified@test.invalid',null);
insert into public.profiles(id,role,enabled) values
 ('00000000-0000-4000-8000-000000000001','owner',true),
 ('00000000-0000-4000-8000-000000000002','owner',true);
insert into public.vehicles(id,status) values
 ('10000000-0000-4000-8000-000000000001','sold'),
 ('10000000-0000-4000-8000-000000000002','sold');
insert into public.customers(id,full_name,phone) values
 ('20000000-0000-4000-8000-000000000001','Synthetic Customer A','0121111111'),
 ('20000000-0000-4000-8000-000000000002','Synthetic Customer B','0122222222');
insert into public.sales(id,vehicle_id,customer_id,status,sold_at,agreed_price) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','sold',now(),16000),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','sold',now(),21000);
