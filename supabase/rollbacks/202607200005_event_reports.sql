-- 되돌리기: supabase/migrations/202607200005_event_reports.sql
-- 방문자 행사 제보 테이블(event_reports)을 제거한다. index, updated_at trigger, RLS 정책, grant, comment는
-- 테이블과 함께 지워진다. 이후 migration의 rollback(202607200006, 20260804014839, 20260804020600 등)을
-- 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 받은 행사 제보와 검토 상태가 모두 사라진다. rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.event_reports_202607200005 as table public.event_reports;
--   psql을 쓰면 파일로 받을 수도 있다.
--     \copy public.event_reports to 'event_reports.csv' with (format csv, header)
--
-- 권한 주의
-- - anon, authenticated의 insert 권한과 관리자 정책도 테이블과 함께 사라진다. 제보 폼도 앱에서 함께 내린다.

-- 1. 테이블 제거(index, trigger, policy, grant, comment 포함)
drop table if exists public.event_reports;
