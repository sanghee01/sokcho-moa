-- 되돌리기: supabase/migrations/20260804020600_public_submission_rate_limits.sql
-- 요청 제한 RPC, 카운터 테이블, private schema를 제거한다. 이후 migration의 rollback
-- (20261106084625 등)을 먼저 적용했다고 가정한다.
--
-- 데이터 손실
-- - private.public_submission_rate_limits의 요청 제한 카운터가 사라진다. 카운터는 제한 시간 창이 끝나면
--   의미가 없는 임시 값이고 방문자 주소 원문이 아닌 HMAC만 담고 있다. 보관이 필요하면 rollback 전에
--   아래처럼 Data API에 노출되지 않는 schema로 복사한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.public_submission_rate_limits_20260804020600
--       as table private.public_submission_rate_limits;
-- - 이 RPC를 호출하는 server action은 rollback 뒤 실패하므로 앱 코드도 이 migration 이전으로 되돌린다.

drop function if exists public.consume_public_submission_rate_limit(text, text, integer, integer);
drop table if exists private.public_submission_rate_limits;

-- private schema는 이 migration이 만들었다. 다른 객체(백업 테이블 등)가 남아 있으면 지우지 않는다.
do $$
begin
  drop schema if exists private;
exception when dependent_objects_still_exist then
  raise notice 'private schema was kept because it still contains other objects';
end;
$$;
