-- Abe Din Auto V110: pilihan potongan "pay_rate" — gaji maksimum 8 jam sehari; kekurangan jam dipotong ikut kadar gaji seminit.
alter table public.staff_pay drop constraint if exists staff_pay_late_mode_check;
alter table public.staff_pay add constraint staff_pay_late_mode_check check (late_mode = any (array['none','per_minute','per_late','pay_rate']));
