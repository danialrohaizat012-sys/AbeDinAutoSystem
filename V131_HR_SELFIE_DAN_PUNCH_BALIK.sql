-- V131: (1) selfie punch mesti baharu dan tidak boleh diguna semula
--       (2) draf/rekod gaji ditolak jika bulan itu ada hari tanpa punch balik

create or replace function public.attendance_selfie_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Punch manual (Owner / tuntutan staff) tidak disemak.
  if coalesce(new.manual, false) or new.photo_path is null then return new; end if;
  if not exists (select 1 from storage.objects o
                  where o.bucket_id = 'attendance-selfies' and o.name = new.photo_path
                    and o.created_at > now() - interval '10 minutes') then
    raise exception 'Selfie tidak sah atau sudah lama. Ambil selfie baharu.';
  end if;
  if exists (select 1 from public.attendance_punches p where p.photo_path = new.photo_path) then
    raise exception 'Selfie ini sudah digunakan. Ambil selfie baharu.';
  end if;
  return new;
end $$;
revoke all on function public.attendance_selfie_guard() from public, anon, authenticated;
drop trigger if exists attendance_selfie_guard_trg on public.attendance_punches;
create trigger attendance_selfie_guard_trg before insert on public.attendance_punches
  for each row execute function public.attendance_selfie_guard();
create unique index if not exists attendance_punches_photo_once
  on public.attendance_punches (photo_path) where photo_path is not null;

create or replace function public.hr_open_punch_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_days text;
begin
  -- Hari "terbuka": punch masuk/balik terakhir pada hari itu ialah masuk (sama seperti computeDays).
  select string_agg(to_char(d.day, 'DD/MM/YYYY'), ', ' order by d.day) into v_days
    from (select (p.punched_at at time zone 'Asia/Kuala_Lumpur')::date as day,
                 (array_agg(p.kind order by p.punched_at desc))[1] as last_kind
            from public.attendance_punches p
           where p.staff_id = new.staff_id and p.kind in ('in', 'out')
             and p.punched_at >= (new.pay_month::timestamp at time zone 'Asia/Kuala_Lumpur')
             and p.punched_at <  ((new.pay_month + interval '1 month') at time zone 'Asia/Kuala_Lumpur')
           group by 1) d
   where d.last_kind = 'in';
  if v_days is not null then
    raise exception 'Draf gaji ditahan: tiada punch balik pada %. Betulkan rekod Kehadiran dahulu.', v_days;
  end if;
  return new;
end $$;
revoke all on function public.hr_open_punch_guard() from public, anon, authenticated;
drop trigger if exists hr_open_punch_guard_trg on public.hr_payroll_handoffs;
create trigger hr_open_punch_guard_trg before insert on public.hr_payroll_handoffs
  for each row execute function public.hr_open_punch_guard();
drop trigger if exists hr_open_punch_guard_trg on public.hr_payroll_submissions;
create trigger hr_open_punch_guard_trg before insert on public.hr_payroll_submissions
  for each row execute function public.hr_open_punch_guard();
drop trigger if exists hr_open_punch_guard_trg on public.staff_payroll_records;
create trigger hr_open_punch_guard_trg before insert on public.staff_payroll_records
  for each row execute function public.hr_open_punch_guard();
