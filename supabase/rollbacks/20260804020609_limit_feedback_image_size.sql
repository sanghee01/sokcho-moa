-- 되돌리기: supabase/migrations/20260804020609_limit_feedback_image_size.sql
-- feedback-images 버킷의 업로드 크기 제한을 이 migration 이전 값(4MB, 202607200008_feedback_images.sql)으로 되돌린다.
--
-- 데이터 손실 없음. 제한을 넓히기만 하므로 이미 올라간 파일은 그대로 남는다.

update storage.buckets
set file_size_limit = 4194304
where id = 'feedback-images';
