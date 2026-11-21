-- Abe Din Auto V93: Notifikasi resit (modul Perbelanjaan).
-- * Setiap resit baharu di-upload  -> semua Owner (kecuali yang upload sendiri) dapat notifikasi + push telefon.
-- * Owner sahkan / tolak resit staf -> staf yang upload dapat notifikasi.
-- Perlu V81 (app_notifications, notif_owners, notif_send) dan V91/V92 (expenses).

create or replace function public.notif_expenses() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text; v_cat text; v_txt text;
begin
  select full_name into v_name from public.profiles where id = new.created_by;
  v_cat := case new.jenis when 'inventori' then 'Inventori' when 'overhead' then 'Overhead' else 'Pembelian' end
           || ' · ' || initcap(replace(new.category, '_', ' '));
  v_txt := coalesce(nullif(trim(new.vendor), ''), 'Kedai tidak dikenal pasti') || ' · ' || public.notif_rm(new.amount)
           || ' · ' || to_char(new.receipt_date, 'DD/MM/YYYY');
  if tg_op = 'INSERT' then
    perform public.notif_owners('resit', '📸 Resit baharu — ' || coalesce(v_name, 'Staf'),
      v_txt || ' (' || v_cat || ')' || case when new.paid_by = 'staf' then ' · Tuntutan staf' else '' end,
      'belanja', new.id::text, new.created_by);
  elsif new.status is distinct from old.status and new.status in ('disahkan','ditolak')
        and new.created_by is distinct from auth.uid() then
    perform public.notif_send(new.created_by, 'resit',
      case new.status when 'disahkan' then 'Resit disahkan ✓' else 'Resit ditolak' end,
      v_txt || coalesce(' · ' || nullif(new.review_note, ''), ''), 'belanja', new.id::text);
  end if;
  return new;
end $$;
revoke all on function public.notif_expenses() from public, anon, authenticated;
drop trigger if exists notif_expenses_trg on public.expenses;
create trigger notif_expenses_trg after insert or update of status on public.expenses
  for each row execute function public.notif_expenses();
