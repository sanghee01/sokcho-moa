-- 되돌리기: supabase/migrations/202607190002_event_location_evidence.sql
-- events의 위치 근거 컬럼(location_source_url, location_verified_at)과 좌표·근거 check 제약 3개를 제거한다.
-- 역순으로 적었다. 이후 migration의 rollback(202607190003 등)을 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 행사별 위치 확인 URL과 확인 시각이 사라진다. rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.events_location_evidence_202607190002
--       as select id, location_source_url, location_verified_at from public.events;
--
-- 권한 주의
-- - 컬럼 단위 grant는 없었다. 테이블 grant와 RLS 정책은 바뀌지 않는다.

begin;

-- 2. check 제약 제거
alter table public.events
  drop constraint if exists events_location_source_url_format,
  drop constraint if exists events_location_evidence_pair,
  drop constraint if exists events_coordinates_pair;

-- 1. 위치 근거 컬럼 제거(comment는 컬럼과 함께 지워진다)
alter table public.events
  drop column if exists location_verified_at,
  drop column if exists location_source_url;

commit;
