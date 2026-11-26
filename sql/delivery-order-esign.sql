-- Private server-only immutable signing records (existing project migration).
create table public.delivery_order_esign (
 sale_id uuid primary key, snapshot jsonb not null, token_hash text not null unique check(length(token_hash)=64),
 expires_at timestamptz not null, created_by uuid not null, created_at timestamptz not null default now(),
 signed_at timestamptz, signature jsonb, signed_pdf text,
 check ((signed_at is null and signature is null and signed_pdf is null) or (signed_at is not null and signature is not null and signed_pdf is not null)),
 check (signed_pdf is null or length(signed_pdf)<=1000000)
);
alter table public.delivery_order_esign enable row level security;
revoke all on public.delivery_order_esign from public,anon,authenticated;
grant select,insert,update on public.delivery_order_esign to service_role;
