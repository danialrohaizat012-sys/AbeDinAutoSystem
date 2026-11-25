begin;
create table public.tiktok_sale_links (
 sale_id uuid primary key references public.sales(id) on delete cascade,
 lead_id uuid not null references public.tiktok_leads(id) on delete restrict,
 confirmed_by uuid not null default auth.uid() references public.profiles(id),
 confirmed_at timestamptz not null default now()
);
create index tiktok_sale_links_lead_idx on public.tiktok_sale_links(lead_id);
alter table public.tiktok_sale_links enable row level security;
revoke all on public.tiktok_sale_links from public,anon,authenticated;
grant select, delete on public.tiktok_sale_links to authenticated;
grant insert(sale_id,lead_id) on public.tiktok_sale_links to authenticated;
create policy sale_link_read on public.tiktok_sale_links for select to authenticated using ((select public.current_staff_role())='owner');
create policy sale_link_insert on public.tiktok_sale_links for insert to authenticated with check (
 (select public.current_staff_role())='owner' and confirmed_by=(select auth.uid())
 and exists(select 1 from public.sales s where s.id=sale_id and s.status='sold' and s.sold_at is not null)
 and exists(select 1 from public.tiktok_leads l where l.id=lead_id)
);
create policy sale_link_delete on public.tiktok_sale_links for delete to authenticated using ((select public.current_staff_role())='owner');
create function public.tiktok_sales_summary()
returns table(converted_leads bigint,completed_sales bigint,sales_value numeric)
language sql stable security invoker set search_path=''
as $$
select count(distinct x.lead_id),count(*),coalesce(sum(s.agreed_price),0)
from public.tiktok_sale_links x join public.sales s on s.id=x.sale_id
where s.status='sold' and s.sold_at is not null and (select public.current_staff_role())='owner';
$$;
revoke all on function public.tiktok_sales_summary() from public,anon,authenticated;
grant execute on function public.tiktok_sales_summary() to authenticated;
commit;
