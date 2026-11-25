-- V124: Perbelanjaan → Pemeriksaan (kos kereta sentiasa sama)
-- Bila resit perbelanjaan dikaitkan dengan kereta, jumlahnya dimasukkan terus ke senarai
-- "barang perlu tukar" pemeriksaan kereta itu (kos pemeriksaan = kos yang dikira dalam untung kereta).
--   insp_mode: auto  = tambah sebagai barang baru (V124b: tiada padanan automatik ikut harga)
--              part  = padankan dengan barang tertentu (inspection_part_id) — harga barang ditukar kepada jumlah resit
--              new   = sentiasa tambah sebagai barang baru
--              none  = jangan masukkan ke pemeriksaan
-- Resit ditolak / jumlah 0 / tiada kereta / dipadam → pautan dibuang (barang baru "exp-…" dipadam; barang asal dikekalkan).

alter table public.expenses
  add column if not exists insp_mode text not null default 'auto',
  add column if not exists inspection_id text,
  add column if not exists inspection_part_id text;
do $$ begin
  alter table public.expenses add constraint expenses_insp_mode_chk check (insp_mode in ('auto','part','new','none'));
exception when duplicate_object then null; end $$;

-- Benarkan kemas kini dalaman (daripada trigger perbelanjaan) melepasi semakan peranan checklist.
create or replace function public.checklist_guard()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare r text;
begin
  if coalesce(current_setting('ada.exp_sync', true), '') = '1' then
    new.updated_at := now();
    if tg_op = 'UPDATE' then new.created_by := old.created_by; new.created_at := old.created_at; end if;
    return new;
  end if;
  r := public.checklist_role();
  if r is null then
    raise exception 'Tiada akses modul Checklist.';
  end if;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    if r <> 'owner' then
      if new.status not in ('draf','hantar') then new.status := 'draf'; end if;
      new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    end if;
    return new;
  end if;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  if r <> 'owner' then
    if new.review_note is distinct from old.review_note
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'Hanya Owner boleh menyemak checklist.';
    end if;
    if old.status = 'lulus' then
      if new.status is distinct from old.status or new.grade is distinct from old.grade
         or new.vehicle_id is distinct from old.vehicle_id or new.plate is distinct from old.plate
         or new.car is distinct from old.car or (new.data - 'parts') is distinct from (old.data - 'parts') then
        raise exception 'Checklist sudah disahkan Owner dan dikunci.';
      end if;
    elsif new.status = 'lulus' then
      raise exception 'Hanya Owner boleh mengesahkan checklist.';
    elsif new.status = 'ulang' and old.status <> 'ulang' then
      raise exception 'Hanya Owner boleh memulangkan checklist.';
    end if;
  end if;
  return new;
end $function$;

create or replace function public.insp_parts_total(p jsonb)
 returns numeric language sql immutable as $$
  select coalesce(sum(coalesce(nullif(e->>'qty','')::numeric, 1) * coalesce(nullif(e->>'harga','')::numeric, 0)
                      + coalesce(nullif(e->>'upah','')::numeric, 0)), 0)
  from jsonb_array_elements(coalesce(p, '[]'::jsonb)) e
$$;

-- Buang pautan satu resit daripada pemeriksaan.
create or replace function public.exp_insp_unlink(p_insp text, p_part text)
 returns void language plpgsql security definer set search_path to 'public' as $$
declare v_parts jsonb;
begin
  if p_insp is null or p_part is null then return; end if;
  select data->'parts' into v_parts from checklist_inspections where id = p_insp;
  if v_parts is null then return; end if;
  if p_part like 'exp-%' then
    select coalesce(jsonb_agg(e), '[]'::jsonb) into v_parts from jsonb_array_elements(v_parts) e where e->>'id' is distinct from p_part;
  else
    select coalesce(jsonb_agg(case when e->>'id' = p_part then e - 'resit' else e end), '[]'::jsonb) into v_parts from jsonb_array_elements(v_parts) e;
  end if;
  perform set_config('ada.exp_sync', '1', true);
  update checklist_inspections set data = jsonb_set(data, '{parts}', v_parts), kos = insp_parts_total(v_parts) where id = p_insp;
  perform set_config('ada.exp_sync', '', true);
end $$;

create or replace function public.exp_insp_sync()
 returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_mode text; v_insp text; v_part text; v_parts jsonb; v_veh record; v_name text; v_found boolean;
begin
  if tg_op = 'DELETE' then
    perform exp_insp_unlink(old.inspection_id, old.inspection_part_id);
    return old;
  end if;

  v_mode := coalesce(new.insp_mode, 'auto');
  -- Tiada perubahan berkaitan → tiada kerja
  if tg_op = 'UPDATE' and new.vehicle_id is not distinct from old.vehicle_id and new.amount is not distinct from old.amount
     and new.status is not distinct from old.status and v_mode is not distinct from old.insp_mode
     and new.inspection_part_id is not distinct from old.inspection_part_id and new.vendor is not distinct from old.vendor
     and new.inspection_id is not null then
    return new;
  end if;

  if new.vehicle_id is null or new.status = 'ditolak' or coalesce(new.amount, 0) <= 0 or v_mode = 'none' then
    if tg_op = 'UPDATE' then perform exp_insp_unlink(old.inspection_id, old.inspection_part_id); end if;
    new.inspection_id := null;
    if v_mode <> 'part' then new.inspection_part_id := null; end if;
    return new;
  end if;

  select id, plate, make, model into v_veh from vehicles where id = new.vehicle_id;
  if not found then return new; end if;

  -- Pemeriksaan sasaran: kekalkan yang sedia dipautkan (kereta sama), jika tidak pilih yang lulus / terkini.
  if tg_op = 'UPDATE' and old.inspection_id is not null and old.vehicle_id = new.vehicle_id
     and exists (select 1 from checklist_inspections where id = old.inspection_id and vehicle_id = new.vehicle_id::text) then
    v_insp := old.inspection_id;
  else
    if tg_op = 'UPDATE' then perform exp_insp_unlink(old.inspection_id, old.inspection_part_id); end if;
    select id into v_insp from checklist_inspections where vehicle_id = new.vehicle_id::text
      order by (status = 'lulus') desc, updated_at desc limit 1;
  end if;

  perform set_config('ada.exp_sync', '1', true);
  if v_insp is null then
    insert into checklist_inspections (vehicle_id, plate, car, status, kos, data)
    values (new.vehicle_id::text, coalesce(v_veh.plate, ''), trim(coalesce(v_veh.make, '') || ' ' || coalesce(v_veh.model, '')), 'draf', 0,
            jsonb_build_object('plat', coalesce(v_veh.plate, ''), 'jenis', trim(coalesce(v_veh.make, '') || ' ' || coalesce(v_veh.model, '')),
                               'tarikh', to_char(current_date, 'YYYY-MM-DD'), 'catatan', 'Rekod kos dicipta automatik daripada Perbelanjaan.',
                               'items', '{}'::jsonb, 'parts', '[]'::jsonb))
    returning id into v_insp;
  end if;
  perform set_config('ada.exp_sync', '', true);

  select coalesce(data->'parts', '[]'::jsonb) into v_parts from checklist_inspections where id = v_insp;

  -- Tentukan barang yang dipautkan
  v_part := null;
  if v_mode = 'part' and new.inspection_part_id is not null
     and exists (select 1 from jsonb_array_elements(v_parts) e where e->>'id' = new.inspection_part_id) then
    v_part := new.inspection_part_id;
  elsif tg_op = 'UPDATE' and old.inspection_id = v_insp and old.inspection_part_id like 'exp-%' and v_mode <> 'part'
     and exists (select 1 from jsonb_array_elements(v_parts) e where e->>'id' = old.inspection_part_id) then
    v_part := old.inspection_part_id;
  end if;
  -- V124b: 'auto' TIDAK lagi memadankan ikut harga (harga sama tidak semestinya barang sama) — sentiasa tambah barang baru.

  -- Jika barang lama berbeza daripada sasaran baharu, buang pautan lama
  if tg_op = 'UPDATE' and old.inspection_id = v_insp and old.inspection_part_id is not null
     and old.inspection_part_id is distinct from coalesce(v_part, 'exp-' || new.id) then
    perform exp_insp_unlink(old.inspection_id, old.inspection_part_id);
    select coalesce(data->'parts', '[]'::jsonb) into v_parts from checklist_inspections where id = v_insp;
  end if;

  v_name := coalesce(nullif(trim(new.vendor), ''), 'Resit') || ' (resit ' || to_char(coalesce(new.receipt_date, current_date), 'DD/MM') || ')';
  if v_part is null then
    v_part := 'exp-' || new.id;
    v_found := exists (select 1 from jsonb_array_elements(v_parts) e where e->>'id' = v_part);
    if not v_found then
      v_parts := v_parts || jsonb_build_array(jsonb_build_object('id', v_part, 'nama', v_name, 'bhg', 'lain', 'qty', 1,
                   'harga', new.amount, 'upah', 0, 'siap', true, 'resit', new.id));
    end if;
  end if;
  select coalesce(jsonb_agg(case when e->>'id' = v_part then
           e || jsonb_build_object('qty', 1, 'harga', new.amount, 'upah', 0, 'siap', true, 'resit', new.id)
             || case when v_part like 'exp-%' then jsonb_build_object('nama', v_name) else '{}'::jsonb end
         else e end), '[]'::jsonb)
    into v_parts from jsonb_array_elements(v_parts) e;

  perform set_config('ada.exp_sync', '1', true);
  update checklist_inspections set data = jsonb_set(data, '{parts}', v_parts), kos = insp_parts_total(v_parts) where id = v_insp;
  perform set_config('ada.exp_sync', '', true);

  new.inspection_id := v_insp;
  new.inspection_part_id := v_part;
  return new;
end $$;

revoke all on function public.exp_insp_sync() from public, anon, authenticated;
revoke all on function public.exp_insp_unlink(text, text) from public, anon, authenticated;

drop trigger if exists exp_insp_sync_trg on public.expenses;
create trigger exp_insp_sync_trg before insert or update on public.expenses
  for each row execute function public.exp_insp_sync();
drop trigger if exists exp_insp_unsync_trg on public.expenses;
create trigger exp_insp_unsync_trg after delete on public.expenses
  for each row execute function public.exp_insp_sync();
