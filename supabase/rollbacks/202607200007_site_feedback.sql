-- 되돌리기: supabase/migrations/202607200007_site_feedback.sql
-- 사이트 의견 테이블(site_feedback)을 제거한다. index, updated_at trigger, RLS 정책, grant, comment는
-- 테이블과 함께 지워진다. 이후 migration의 rollback(202607200008, 20260804014839, 20260804020600 등)을
-- 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 받은 사이트 의견과 검토 상태가 모두 사라진다. rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.site_feedback_202607200007 as table public.site_feedback;
--   psql을 쓰면 파일로 받을 수도 있다.
--     \copy public.site_feedback to 'site_feedback.csv' with (format csv, header)
--
-- 권한 주의
-- - anon, authenticated의 insert 권한과 관리자 정책도 테이블과 함께 사라진다. 의견 폼도 앱에서 함께 내린다.

-- 1. 테이블 제거(index, trigger, policy, grant, comment 포함)
drop table if exists public.site_feedback;
