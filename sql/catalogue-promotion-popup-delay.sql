-- Applied to the catalogue's existing Supabase project; existing settings preserved.
alter table public.catalogue_promotion_settings add column if not exists popup_delay_seconds integer not null default 10 check (popup_delay_seconds between 0 and 300);
