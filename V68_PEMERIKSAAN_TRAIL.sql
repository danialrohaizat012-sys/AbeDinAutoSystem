-- V68: Jejak transaksi (audit trail) untuk modul Pemeriksaan
-- Setiap cipta, edit, hantar, sahkan, pulangkan, tanda barang siap dan padam direkod secara automatik
-- oleh trigger pangkalan data (tidak boleh diubah atau dipadam dari app).
-- Selamat dijalankan semula.

create table if not exists public.checklist_trail (
  id            bigserial primary key,
  inspection_id text not null,
  plate         text,
  action        text not null,
  from_status   text,
  to_status     text,
  changes       jsonb not null default '[]'::jsonb,
  actor_id      uuid,
  actor_name    text,
  created_at    timestamptz not null default now()
);
create index if not exists checklist_trail_insp_idx on public.checklist_trail (inspection_id, created_at desc);
create index if not exists checklist_trail_created_idx on public.checklist_trail (created_at desc);

create or replace function public.checklist_trail_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name  text;
  v_act   text;
  v_ch    jsonb := '[]'::jsonb;
  k       text;
  o_ng int; n_ng int; o_siap int; n_siap int; o_items int; n_items int;
  labels  jsonb := '{"jenis":"Jenis kereta","tahun":"Tahun","plat":"No. plat","mileage":"Mileage","tarikh":"Tarikh pemeriksaan",
                     "pemeriksa":"Nama pemeriksa","akhir":"Keputusan akhir","grade":"Gred","catatan":"Catatan umum"}'::jsonb;
begin
  select p.full_name into v_name from public.profiles p where p.id = v_actor;

  if tg_op = 'DELETE' then
    insert into public.checklist_trail(inspection_id, plate, action, from_status, actor_id, actor_name, changes)
    values (old.id, nullif(old.plate,''), 'padam', old.status, v_actor, v_name,
            jsonb_build_array('Rekod dipadam (gred ' || coalesce(old.grade,'-') || ', kos RM' || old.kos || ')'));
    return old;
  end if;

  if tg_op = 'INSERT' then
    v_act := case when new.status = 'hantar' then 'cipta_hantar' else 'cipta' end;
    insert into public.checklist_trail(inspection_id, plate, action, to_status, actor_id, actor_name, changes)
    values (new.id, nullif(new.plate,''), v_act, new.status, v_actor, v_name, '[]'::jsonb);
    return new;
  end if;

  -- UPDATE: senaraikan perubahan
  if new.status is distinct from old.status then
    v_act := case new.status when 'hantar' then 'hantar' when 'lulus' then 'sahkan' when 'ulang' then 'pulangkan' else 'tukar_status' end;
  end if;

  if new.grade is distinct from old.grade then
    v_ch := v_ch || jsonb_build_array('Gred: ' || coalesce(old.grade,'-') || ' → ' || coalesce(new.grade,'-'));
  end if;
  if new.kos is distinct from old.kos then
    v_ch := v_ch || jsonb_build_array('Anggaran kos: RM' || old.kos || ' → RM' || new.kos);
  end if;
  if new.plate is distinct from old.plate then
    v_ch := v_ch || jsonb_build_array('No. plat: ' || coalesce(nullif(old.plate,''),'-') || ' → ' || coalesce(nullif(new.plate,''),'-'));
  end if;
  if new.vehicle_id is distinct from old.vehicle_id then
    v_ch := v_ch || jsonb_build_array('Kereta dipautkan semula');
  end if;
  if new.review_note is distinct from old.review_note and coalesce(new.review_note,'') <> '' then
    v_ch := v_ch || jsonb_build_array('Komen Owner: ' || left(new.review_note, 200));
  end if;

  foreach k in array array['jenis','tahun','mileage','tarikh','pemeriksa','catatan'] loop
    if (new.data -> k) is distinct from (old.data -> k) then
      v_ch := v_ch || jsonb_build_array((labels ->> k) || ': ' || coalesce(nullif(old.data ->> k,''),'-') || ' → ' || coalesce(nullif(new.data ->> k,''),'-'));
    end if;
  end loop;
  if (new.data -> 'akhir') is distinct from (old.data -> 'akhir') then
    v_ch := v_ch || jsonb_build_array('Keputusan akhir dikemas kini');
  end if;

  if (new.data -> 'items') is distinct from (old.data -> 'items') then
    select count(*) filter (where value ->> 's' = 'ng'), count(*) filter (where coalesce(value ->> 's','') <> '')
      into o_ng, o_items from jsonb_each(coalesce(old.data -> 'items','{}'::jsonb));
    select count(*) filter (where value ->> 's' = 'ng'), count(*) filter (where coalesce(value ->> 's','') <> '')
      into n_ng, n_items from jsonb_each(coalesce(new.data -> 'items','{}'::jsonb));
    v_ch := v_ch || jsonb_build_array('Senarai semak dikemas kini (' || n_items || ' item diperiksa, NG ' || o_ng || ' → ' || n_ng || ')');
  end if;

  if (new.data -> 'parts') is distinct from (old.data -> 'parts') then
    select count(*) filter (where (value ->> 'siap')::boolean) into o_siap from jsonb_array_elements(coalesce(old.data -> 'parts','[]'::jsonb));
    select count(*) filter (where (value ->> 'siap')::boolean) into n_siap from jsonb_array_elements(coalesce(new.data -> 'parts','[]'::jsonb));
    if jsonb_array_length(coalesce(new.data -> 'parts','[]'::jsonb)) = jsonb_array_length(coalesce(old.data -> 'parts','[]'::jsonb))
       and n_siap <> o_siap
       and (select count(*) from jsonb_array_elements(coalesce(new.data -> 'parts','[]'::jsonb)) a
             join jsonb_array_elements(coalesce(old.data -> 'parts','[]'::jsonb)) b on (a.value - 'siap') = (b.value - 'siap'))
           = jsonb_array_length(coalesce(new.data -> 'parts','[]'::jsonb)) then
      v_ch := v_ch || jsonb_build_array('Barang siap: ' || o_siap || ' → ' || n_siap || ' daripada ' || jsonb_array_length(new.data -> 'parts'));
      v_act := coalesce(v_act, 'barang_siap');
    else
      v_ch := v_ch || jsonb_build_array('Senarai barang perlu tukar dikemas kini (' || jsonb_array_length(coalesce(new.data -> 'parts','[]'::jsonb)) || ' barang)');
    end if;
  end if;

  if v_act is null and jsonb_array_length(v_ch) = 0 then
    return new; -- tiada perubahan bermakna
  end if;

  insert into public.checklist_trail(inspection_id, plate, action, from_status, to_status, actor_id, actor_name, changes)
  values (new.id, nullif(new.plate,''), coalesce(v_act,'edit'), old.status, new.status, v_actor, v_name, v_ch);
  return new;
end $$;

drop trigger if exists checklist_trail_trg on public.checklist_inspections;
create trigger checklist_trail_trg
  after insert or update or delete on public.checklist_inspections
  for each row execute function public.checklist_trail_log();

alter table public.checklist_trail enable row level security;
drop policy if exists checklist_trail_select on public.checklist_trail;
create policy checklist_trail_select on public.checklist_trail
  for select to authenticated using (public.checklist_role() is not null);

revoke all on public.checklist_trail from anon, authenticated;
grant select on public.checklist_trail to authenticated;
revoke all on function public.checklist_trail_log() from public, anon, authenticated;
