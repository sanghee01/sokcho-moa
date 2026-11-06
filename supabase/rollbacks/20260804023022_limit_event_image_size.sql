-- 되돌리기: supabase/migrations/20260804023022_limit_event_image_size.sql
-- event-images 버킷의 업로드 크기 제한을 이 migration 이전 값(5MB, 202607190001_initial_schema.sql)으로 되돌린다.
--
-- 데이터 손실 없음. 제한을 넓히기만 하므로 이미 올라간 파일은 그대로 남는다.
-- 애플리케이션의 3MB 검사는 그대로이므로, 5MB 업로드를 허용하려면 앱 코드도 함께 되돌린다.

update storage.buckets
set file_size_limit = 5242880
where id = 'event-images';
