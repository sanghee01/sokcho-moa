-- 되돌리기: supabase/migrations/20260803015356_prevent_deleted_event_recollection.sql
-- 삭제 행사 재수집 차단(tombstone 테이블, URL 정규화·identity 함수, 직렬화·차단 trigger, 행사 생성·삭제 RPC)을
-- 제거하고 events의 delete 권한을 이 migration 이전 상태로 되돌린다. 역순으로 적었다.
-- 이 함수들을 쓰는 이후 migration의 rollback(20261106084625, 20261105090000, 20260804014903 등)을
-- 먼저 적용했다고 가정한다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - public.event_deletion_tombstones, public.event_deletion_identities를 지운다. 관리자가 삭제한 행사의
--   삭제 직전 snapshot(event_snapshot), 삭제·차단 해제 감사 기록, 재수집 차단 identity가 모두 사라지고,
--   rollback 뒤에는 삭제했던 행사가 다시 수집될 수 있다. 삭제된 행사 자체는 rollback으로 돌아오지 않는다.
--   rollback 전에 Data API에 노출되지 않는 schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.event_deletion_tombstones_20260803015356
--       as table public.event_deletion_tombstones;
--     create table rollback_backup.event_deletion_identities_20260803015356
--       as table public.event_deletion_identities;
--   psql을 쓰면 파일로 받을 수도 있다.
--     \copy public.event_deletion_tombstones to 'event_deletion_tombstones.csv' with (format csv, header)
--     \copy public.event_deletion_identities to 'event_deletion_identities.csv' with (format csv, header)
--
-- 권한 주의
-- - 이 migration 이전에는 Supabase 기본 권한으로 anon, authenticated, service_role이 events를 직접 delete할 수
--   있었다(RLS 정책상 실제 삭제는 관리자만). 3번은 그 권한을 그대로 복구한다.
-- - 행사 생성·삭제 RPC가 사라지므로 앱 코드도 이 migration 이전으로 되돌린다.

-- 3. events 직접 삭제 권한 복구
grant delete on table public.events to anon, authenticated, service_role;

-- 2. 함수 제거(trigger를 먼저 지워야 trigger 함수를 지울 수 있다)
drop trigger if exists prevent_deleted_event_source_recollection on public.event_sources;
drop trigger if exists prevent_deleted_event_publish on public.events;
drop trigger if exists prevent_deleted_event_recollection on public.events;
drop trigger if exists serialize_event_occurrence_collection_mutations on public.event_occurrences;
drop trigger if exists serialize_event_source_collection_mutations on public.event_sources;
drop trigger if exists serialize_event_collection_mutations on public.events;

drop function if exists public.reject_tombstoned_event_publish();
drop function if exists public.reject_tombstoned_event_source_insert();
drop function if exists public.reject_tombstoned_event_insert();
drop function if exists public.create_event_with_source(jsonb, jsonb, timestamptz);
drop function if exists public.release_event_collection_exclusion(uuid);
drop function if exists public.delete_event_and_exclude(uuid, text);
drop function if exists public.is_event_collection_excluded(text, text, text);
drop function if exists public.serialize_event_collection_mutations();
drop function if exists public.lock_event_deletion_identity_keys(text, text, text);
drop function if exists public.event_deletion_identity_keys(text, text, text);
drop function if exists public.event_deletion_identity_key(text, text, text);
drop function if exists public.event_source_global_namespace(text);
drop function if exists public.event_source_namespace(text);
drop function if exists public.extract_event_source_external_id(text);
drop function if exists public.normalize_event_source_url(text);
drop function if exists public.canonicalize_event_url_path(text);
drop function if exists public.decode_event_url_component(text, boolean);

-- 1. tombstone 테이블 제거(index, policy, grant, comment는 테이블과 함께 지워진다)
drop table if exists public.event_deletion_identities;
drop table if exists public.event_deletion_tombstones;
