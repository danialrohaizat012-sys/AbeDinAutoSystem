-- Abe Din Auto V69: gambar bukti untuk setiap item Pemeriksaan.
-- Bucket PERIBADI "checklist-photos" (bukan katalog awam). Selamat dijalankan semula.
-- Akses ikut checklist_role(): staf yang boleh buka Pemeriksaan boleh lihat & muat naik;
-- padam: Owner, atau staf yang memuat naik gambar itu sendiri.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('checklist-photos', 'checklist-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists checklist_photos_select on storage.objects;
create policy checklist_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'checklist-photos' and public.checklist_role() is not null);

drop policy if exists checklist_photos_insert on storage.objects;
create policy checklist_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'checklist-photos' and public.checklist_role() is not null);

drop policy if exists checklist_photos_delete on storage.objects;
create policy checklist_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'checklist-photos' and (public.checklist_role() = 'owner' or (public.checklist_role() is not null and owner_id = auth.uid()::text)));
