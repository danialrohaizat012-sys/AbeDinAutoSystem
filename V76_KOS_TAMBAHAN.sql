-- V76: Kos tambahan setiap kereta (tukar nama, Puspakom, transport) untuk kiraan untung.
alter table public.vehicles add column if not exists cost_transfer numeric(12,2) not null default 0 check (cost_transfer >= 0);
alter table public.vehicles add column if not exists cost_puspakom numeric(12,2) not null default 0 check (cost_puspakom >= 0);
alter table public.vehicles add column if not exists cost_transport numeric(12,2) not null default 0 check (cost_transport >= 0);
