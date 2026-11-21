-- Abe Din Auto V104: Owner boleh padam rekod bayaran (direkod dalam audit_logs).
create or replace function public.delete_payment_record(p_payment_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p record; v_paid numeric; v_price numeric;
begin
  if public.current_staff_role()::text is distinct from 'owner' then
    raise exception 'Hanya Owner boleh padam rekod bayaran.';
  end if;
  select * into p from public.payments where id = p_payment_id;
  if not found then raise exception 'Rekod bayaran tidak dijumpai.'; end if;
  insert into public.audit_logs(action, entity_type, entity_id, actor_id, details)
  values ('payment_deleted', 'payment', p.id::text, auth.uid(),
          jsonb_build_object('sale_id', p.sale_id, 'kind', p.kind, 'amount', p.amount, 'reference_no', p.reference_no, 'confirmed_at', p.confirmed_at, 'notes', p.notes));
  delete from public.payments where id = p_payment_id;
  select coalesce(sum(amount),0) into v_paid from public.payments where sale_id = p.sale_id;
  select agreed_price into v_price from public.sales where id = p.sale_id;
  return jsonb_build_object('paid', v_paid, 'price', v_price, 'balance', coalesce(v_price,0) - v_paid);
end $$;
revoke all on function public.delete_payment_record(uuid) from public, anon;
grant execute on function public.delete_payment_record(uuid) to authenticated;
