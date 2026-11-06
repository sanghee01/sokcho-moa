-- 되돌리기: supabase/migrations/202607200004_event_view_counts.sql
-- events.view_count 컬럼, 0 이상 check 제약, 조회순 index, 조회수 증가 RPC(increment_event_view)를 제거한다.
-- 역순으로 적었다. 조회수 함수를 바꾼 이후 migration의 rollback(20261106084625 등)을 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 행사별 누적 조회수가 사라진다. rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.events_view_count_202607200004
--       as select id, view_count from public.events;
--
-- 권한 주의
-- - increment_event_view의 execute 권한(anon, authenticated)은 함수와 함께 사라진다. 앱 코드도 이 RPC를
--   부르지 않는 버전으로 되돌린다.

begin;

-- 3. 조회수 증가 RPC 제거
drop function if exists public.increment_event_view(text);

-- 2. 조회순 index 제거
drop index if exists public.events_public_view_count_idx;

-- 1. check 제약과 컬럼 제거(comment는 컬럼과 함께 지워진다)
alter table public.events
  drop constraint if exists events_view_count_nonnegative;
alter table public.events
  drop column if exists view_count;

commit;
