-- 되돌리기: supabase/migrations/202607200006_require_event_report_url.sql
-- event_reports의 출처 링크 필수 제약(event_reports_source_url_required, not valid)을 제거한다.
-- 제약의 comment는 제약과 함께 지워진다. 이후 migration의 rollback을 먼저 적용했다고 가정한다.
-- 20261105090000이 이 제약을 지우고 source_url을 not null로 바꿨는데, 그 rollback은 이 부분을 되돌리지 않는다.
-- 그래서 최신 상태부터 차례로 되돌리면 이 제약은 이미 없고 이 파일은 아무것도 바꾸지 않으며,
-- source_url의 not null은 이 rollback 뒤에도 남는다.
--
-- 데이터 손실 없음. 제약을 지우기만 하므로 백업할 것이 없다.
--
-- 권한 주의
-- - 권한은 바꾸지 않았다.

-- 1. 출처 링크 필수 제약 제거
alter table public.event_reports
  drop constraint if exists event_reports_source_url_required;
