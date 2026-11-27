-- One current private share per sale/document type. No browser table access.
create table public.delivery_order_share (
 sale_id uuid not null,
 signed boolean not null,
 vehicle_id uuid not null,
 customer_id uuid not null,
 token_hash text not null unique check (length(token_hash)=64),
 expires_at timestamptz not null,
 pdf text check (pdf is null or length(pdf)<=1000000),
 filename text not null,
 created_by uuid not null,
 primary key(sale_id,signed),
 check ((signed and pdf is null) or (not signed and pdf is not null))
);
alter table public.delivery_order_share enable row level security;
revoke all on public.delivery_order_share from public,anon,authenticated;
grant select,insert,update on public.delivery_order_share to service_role;
