-- V89: Prevent paid-trip financial edits, validate exact payment amount.
create or replace function public.runner_paid_financial_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if (new.upah is distinct from old.upah or new.exp is distinct from old.exp)
  and (exists(select 1 from public.runner_payments p where p.trip_id=old.id)
   or exists(select 1 from public.runner_ownerpaid o where o.trip_id=old.id)) then
  raise exception 'Trip telah dibayar. Batalkan bayaran sebelum edit upah atau tuntutan.';
 end if;
 return new;
end $$;
revoke all on function public.runner_paid_financial_guard() from public,anon,authenticated;
drop trigger if exists runner_paid_financial_guard_trg on public.runner_trips;
create trigger runner_paid_financial_guard_trg before update on public.runner_trips
 for each row execute function public.runner_paid_financial_guard();

create or replace function public.runner_payment_amount_guard()
returns trigger language plpgsql security definer set search_path=public as $$
declare expected numeric(12,2);
begin
 -- Existing runner_payment_guard has already checked Owner and pending requests.
 if new.amount is null or new.amount<0 then raise exception 'Amaun bayaran tidak sah.'; end if;
 select round(t.upah+coalesce(
  (select sum(coalesce((e->>'a')::numeric,0)) from jsonb_array_elements(t.exp) as e),0
 ),2) into expected from public.runner_trips t where t.id=new.trip_id for update;
 if expected is null then raise exception 'Trip tidak ditemui.'; end if;
 if round(new.amount,2)<>expected then
  raise exception 'Jumlah bayaran tidak sepadan dengan upah dan tuntutan semasa.';
 end if;
 return new;
end $$;
revoke all on function public.runner_payment_amount_guard() from public,anon,authenticated;
drop trigger if exists runner_payment_amount_guard_trg on public.runner_payments;
create trigger runner_payment_amount_guard_trg before insert or update on public.runner_payments
 for each row execute function public.runner_payment_amount_guard();