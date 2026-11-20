-- Abe Din Auto V82: Notifikasi ke skrin telefon (Web Push).
-- NOTA: nilai <VAPID_PRIVATE> dan <RAHSIA> disimpan terus dalam pangkalan data, bukan dalam repo.
-- Peranti yang aktifkan notifikasi disimpan dalam push_subscriptions.
-- Setiap notifikasi baharu (app_notifications) -> trigger pg_net -> Edge Function send-push -> Web Push ke telefon.
create extension if not exists pg_net with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table if not exists app_private.push_config (
  id int primary key default 1 check (id = 1),
  vapid_public text not null,
  vapid_private text not null,
  fn_secret text not null,
  fn_url text not null
);
insert into app_private.push_config(id, vapid_public, vapid_private, fn_secret, fn_url)
values (1, 'BCpz6tkMEFgQWUkQe82dhjFT22iOgv7XV6BAYlLORIIZzzmwsobw3WkzuVXSJlTus4mqH7wsWcDmdl51HoHvZyg', '<VAPID_PRIVATE>', '<RAHSIA>', 'https://buzpdyvvoiqgbeventwm.supabase.co/functions/v1/send-push')
on conflict (id) do nothing;

create table if not exists public.push_subscriptions (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  ua         text,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy push_sub_own_read on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_sub_own_del  on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
revoke all on public.push_subscriptions from anon;
grant select, delete on public.push_subscriptions to authenticated;

-- Daftar / kemas kini peranti (endpoint sama dipindah kepada pengguna semasa)
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_ua text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and coalesce(enabled,true)) then
    raise exception 'Akaun tidak aktif.';
  end if;
  if coalesce(p_endpoint,'') !~ '^https://' then raise exception 'Peranti tidak sah.'; end if;
  insert into public.push_subscriptions(user_id, endpoint, p256dh, auth, ua)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_ua, 200))
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, ua = excluded.ua, created_at = now();
end $$;

create or replace function public.push_public_key()
returns text language sql stable security definer set search_path = public, app_private as $$
  select vapid_public from app_private.push_config where id = 1
$$;

-- Hanya untuk Edge Function (service_role)
create or replace function public.push_config_get()
returns jsonb language sql stable security definer set search_path = public, app_private as $$
  select jsonb_build_object('vapid_public', vapid_public, 'vapid_private', vapid_private, 'fn_secret', fn_secret) from app_private.push_config where id = 1
$$;

create or replace function public.push_targets(p_user uuid)
returns table(id bigint, endpoint text, p256dh text, auth text) language sql stable security definer set search_path = public as $$
  select id, endpoint, p256dh, auth from public.push_subscriptions where user_id = p_user
$$;

create or replace function public.push_result(p_ok bigint[], p_gone bigint[])
returns void language sql security definer set search_path = public as $$
  update public.push_subscriptions set last_ok_at = now() where id = any(p_ok);
  delete from public.push_subscriptions where id = any(p_gone);
$$;

-- Trigger: hantar ke Edge Function bila notifikasi baharu dicipta
create or replace function public.push_on_notification()
returns trigger language plpgsql security definer set search_path = public, app_private, extensions as $$
declare c app_private.push_config;
begin
  if not exists (select 1 from public.push_subscriptions where user_id = new.user_id) then return new; end if;
  select * into c from app_private.push_config where id = 1;
  if c.fn_url is null then return new; end if;
  perform net.http_post(
    url := c.fn_url,
    headers := jsonb_build_object('Content-Type','application/json','x-push-secret', c.fn_secret),
    body := jsonb_build_object('user_id', new.user_id, 'title', new.title, 'body', coalesce(new.body,''), 'page', coalesce(new.page,''), 'kind', new.kind, 'id', new.id)
  );
  return new;
exception when others then
  return new; -- jangan gagalkan transaksi asal
end $$;
create trigger push_on_notification_trg after insert on public.app_notifications for each row execute function public.push_on_notification();

revoke all on function public.push_subscribe(text,text,text,text) from public, anon;
grant execute on function public.push_subscribe(text,text,text,text) to authenticated;
revoke all on function public.push_public_key() from public, anon;
grant execute on function public.push_public_key() to authenticated;
revoke all on function public.push_config_get() from public, anon, authenticated;
revoke all on function public.push_targets(uuid) from public, anon, authenticated;
revoke all on function public.push_result(bigint[],bigint[]) from public, anon, authenticated;
grant execute on function public.push_config_get() to service_role;
grant execute on function public.push_targets(uuid) to service_role;
grant execute on function public.push_result(bigint[],bigint[]) to service_role;
revoke all on function public.push_on_notification() from public, anon, authenticated;
