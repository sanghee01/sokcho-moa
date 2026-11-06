-- 되돌리기: supabase/migrations/202607280001_event_search_metadata.sql
-- events의 출연자·출연 단체·주최 URL 컬럼(performer_people, performer_groups, organizer_url)과
-- 출연자 배열 check 제약 2개를 제거한다. 역순으로 적었다.
-- 이 컬럼을 쓰는 이후 migration의 rollback(20260804014903, 20260803015356 등)을 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 행사별 출연자, 출연 단체, 주최 URL이 사라진다. rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.events_search_metadata_202607280001
--       as select id, performer_people, performer_groups, organizer_url from public.events;
--
-- 권한 주의
-- - 컬럼 단위 grant는 없었다. 테이블 grant와 RLS 정책은 바뀌지 않는다.

begin;

-- 2. check 제약 제거
alter table public.events
  drop constraint if exists events_performer_groups_nonempty,
  drop constraint if exists events_performer_people_nonempty;

-- 1. 컬럼 제거
alter table public.events
  drop column if exists organizer_url,
  drop column if exists performer_groups,
  drop column if exists performer_people;

commit;
