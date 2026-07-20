alter table public.site_feedback
  add column if not exists image_path text
  check (image_path is null or char_length(image_path) between 1 and 500);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-images', 'feedback-images', false, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins read feedback images" on storage.objects;
create policy "Admins read feedback images" on storage.objects
for select to authenticated
using (bucket_id = 'feedback-images' and (select public.is_admin()));

drop policy if exists "Admins delete feedback images" on storage.objects;
create policy "Admins delete feedback images" on storage.objects
for delete to authenticated
using (bucket_id = 'feedback-images' and (select public.is_admin()));

comment on column public.site_feedback.image_path is '비공개 feedback-images 버킷에 저장된 선택 첨부 이미지 경로.';
