-- 1차 리팩토링: 쓰지 않는 DB 객체와 필요 이상으로 넓은 권한을 정리한다.
-- 되돌리기: supabase/rollbacks/20261105090000_cleanup_unused_objects.sql
--
-- 운영 적용 전 확인(읽기 전용):
--   select count(*) from public.event_reports where source_url is null;  -- 0이어야 4번이 성공한다

-- 1. 회차 교체 RPC는 create/update_event_with_source가 행사·회차·출처를 한 번에 저장하면서
--    쓰이지 않게 됐다. 남겨 두면 로그인 사용자 누구나 호출할 수 있는 경로로 남는다.
drop function if exists public.replace_event_occurrences(uuid, jsonb);

-- 2. unique 제약이 만든 index의 첫 컬럼과 겹치는 index. 같은 이유로
--    20260804014934_remove_redundant_occurrence_index.sql이 회차 index를 지운 기준을 따른다.
drop index if exists public.event_sources_event_idx;
drop index if exists public.event_deletion_identities_tombstone_id_idx;

-- 3. 방문자 제보·의견 insert는 server action이 service_role로만 한다.
--    authenticated에 남은 insert 권한은 어떤 코드도 쓰지 않는다.
revoke insert on table public.event_reports from authenticated;
revoke insert on table public.site_feedback from authenticated;

-- 4. 202607200005_event_reports.sql은 적용된 뒤 source_url을 not null로 고쳐,
--    운영 DB는 nullable + NOT VALID check, 새 DB는 not null로 서로 다르다.
--    두 환경을 같은 상태(not null, 별도 check 없음)로 맞춘다.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'event_reports_source_url_required'
      and conrelid = 'public.event_reports'::regclass
  ) then
    alter table public.event_reports validate constraint event_reports_source_url_required;
  end if;
end $$;

alter table public.event_reports alter column source_url set not null;
alter table public.event_reports drop constraint if exists event_reports_source_url_required;
