-- 되돌리기: supabase/migrations/202607200002_backfill_event_occurrences.sql
-- 이 migration은 schema를 바꾸지 않고 비연속·반복 행사 4건을 회차 방식(schedule_mode = 'occurrences')으로
-- 바꾸고 회차를 넣었다(backfill). 이 rollback은 그 4건을 기간 방식('continuous')으로 되돌리고 회차를 지운다.
-- 202607200001에서 schedule_mode 기본값은 'continuous'였고 event_occurrences는 빈 테이블이었으므로
-- 이 migration 직전 상태는 정확히 알 수 있다. 역순으로 적었다.
-- 이후 migration의 rollback을 먼저 적용했다고 가정한다. 202607200001의 rollback도 같은 4건을 정리하므로
-- 둘을 차례로 적용해도 된다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 이 migration 뒤에 관리자가 4개 행사의 회차를 고쳤거나 더했다면 그 회차도 함께 사라진다.
--   rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.event_occurrences_202607200002 as table public.event_occurrences;
--     create table rollback_backup.events_schedule_mode_202607200002
--       as select id, schedule_mode from public.events;
--
-- 권한 주의
-- - 권한은 바꾸지 않았다.

begin;

-- 2. 4개 행사를 기간 방식으로 되돌림
update public.events
set schedule_mode = 'continuous'
where id in (
  '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
  '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
  '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
  '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
);

-- 1. 4개 행사의 회차 제거
delete from public.event_occurrences
where event_id in (
  '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
  '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
  '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
  '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
);

commit;
