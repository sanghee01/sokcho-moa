-- 되돌리기: supabase/migrations/202607200008_feedback_images.sql
-- 사이트 의견 첨부 이미지 기능을 제거한다. storage.objects의 관리자 정책 2개, 비공개 feedback-images 버킷,
-- site_feedback.image_path 컬럼(check 제약, comment 포함)을 지운다. 역순으로 적었다.
-- 이 버킷과 정책을 바꾼 이후 migration의 rollback(20260804020609, 20260804014839 등)을 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 의견별 첨부 이미지 경로가 사라진다. rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.site_feedback_image_path_202607200008
--       as select id, image_path from public.site_feedback where image_path is not null;
-- - feedback-images 버킷의 이미지 파일. 파일 본체는 Storage 저장소에 있어 SQL로 지우면 파일이 고아로 남는다.
--   먼저 대시보드나 Storage API로 파일을 내려받아 보관하고, 같은 방법으로 버킷을 비운다. 버킷에 파일이
--   남아 있으면 2번에서 transaction 전체를 중단한다.
--
-- 권한 주의
-- - storage.objects 정책은 테이블에 딸린 것이 아니므로 3번에서 따로 지운다.

begin;

-- 3. storage.objects 관리자 정책 제거
drop policy if exists "Admins delete feedback images" on storage.objects;
drop policy if exists "Admins read feedback images" on storage.objects;

-- 2. feedback-images 버킷 제거
do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'feedback-images') then
    raise exception 'Rollback aborted: feedback-images 버킷을 Storage API로 먼저 비워야 한다';
  end if;
end
$$;

-- Supabase Storage는 storage 테이블의 직접 삭제를 막는다. 비어 있음을 확인한 버킷만 이 transaction에서 지운다.
set local storage.allow_delete_query = 'true';
delete from storage.buckets where id = 'feedback-images';

-- 1. 첨부 이미지 경로 컬럼 제거(check 제약과 comment는 컬럼과 함께 지워진다)
alter table public.site_feedback
  drop column if exists image_path;

commit;
