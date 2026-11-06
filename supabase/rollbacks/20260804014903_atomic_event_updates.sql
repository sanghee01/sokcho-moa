-- 되돌리기: supabase/migrations/20260804014903_atomic_event_updates.sql
-- 이 migration이 새로 만든 행사 수정 RPC를 제거한다. 이전 migration에는 같은 이름의 함수가 없었다.
--
-- 데이터 손실 없음. 다만 관리자 행사 수정 server action이 이 RPC를 호출하므로
-- 앱 코드도 이 migration 이전으로 되돌려야 행사 수정이 동작한다.

drop function if exists public.update_event_with_source(uuid, jsonb, jsonb, timestamptz);
