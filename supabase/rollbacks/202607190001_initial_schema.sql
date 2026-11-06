-- 되돌리기: supabase/migrations/202607190001_initial_schema.sql
-- 첫 schema migration을 되돌린다. 이 migration이 만든 것이 속초모아 DB의 바탕이므로, 이 rollback은
-- 사실상 속초모아 데이터 전체 삭제다. public의 admin_users, events, places, event_sources 테이블과
-- 그 index·trigger·RLS 정책·grant·comment, set_updated_at·is_admin 함수, event_category·event_review_status
-- type, event-images 버킷과 storage.objects 정책을 모두 지운다. 역순으로 적었다.
-- 이후 모든 migration(202607190002부터 최신까지)의 rollback을 먼저 적용했다고 가정한다.
-- 운영에서는 프로젝트를 처음부터 다시 만드는 경우가 아니면 실행하지 않는다.
--
-- 되돌릴 수 없는 것(데이터 손실)
-- - 행사, 원문 이력, 장소, 관리자 allow-list가 모두 사라진다. rollback 전에 Data API에 노출되지 않는
--   schema로 백업한다.
--     create schema if not exists rollback_backup;
--     create table rollback_backup.admin_users_202607190001 as table public.admin_users;
--     create table rollback_backup.events_202607190001 as table public.events;
--     create table rollback_backup.places_202607190001 as table public.places;
--     create table rollback_backup.event_sources_202607190001 as table public.event_sources;
--   psql을 쓰면 파일로 받을 수도 있다.
--     \copy public.events to 'events.csv' with (format csv, header)
-- - event-images 버킷의 이미지 파일. 파일 본체는 Storage 저장소에 있어 SQL로 지우면 파일이 고아로 남는다.
--   먼저 대시보드나 Storage API로 파일을 내려받아 보관하고, 같은 방법으로 버킷을 비운다. 버킷에 파일이
--   남아 있으면 6번에서 transaction 전체를 중단한다.
--
-- 되돌리지 않는 것
-- - pgcrypto extension. Supabase 프로젝트에 기본으로 설치돼 있어 이 migration의
--   `create extension if not exists`는 아무것도 하지 않았다. 지우면 다른 기능이 깨질 수 있다.
-- - auth.users의 관리자 계정. admin_users만 지우고 Auth 사용자는 그대로 둔다.
--
-- 권한 주의
-- - 테이블·함수를 지우면 그 grant와 RLS 정책도 함께 사라진다. storage.objects 정책은 테이블에 딸린 것이
--   아니므로 6번에서 따로 지운다.

begin;

-- 6. event-images 버킷과 storage.objects 정책 제거
drop policy if exists "Admins delete event images" on storage.objects;
drop policy if exists "Admins update event images" on storage.objects;
drop policy if exists "Admins upload event images" on storage.objects;
drop policy if exists "Event images are public" on storage.objects;

do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'event-images') then
    raise exception 'Rollback aborted: event-images 버킷을 Storage API로 먼저 비워야 한다';
  end if;
end
$$;

-- Supabase Storage는 storage 테이블의 직접 삭제를 막는다. 비어 있음을 확인한 버킷만 이 transaction에서 지운다.
set local storage.allow_delete_query = 'true';
delete from storage.buckets where id = 'event-images';

-- 5. grant, 4. RLS 정책, 3. updated_at trigger, 2. index, comment는 테이블과 함께 지워진다.
-- 1. 테이블 제거(정책이 is_admin()을 참조하므로 함수보다 먼저 지운다)
drop table if exists public.event_sources;
drop table if exists public.places;
drop table if exists public.events;
drop table if exists public.admin_users;

-- 함수와 type 제거
drop function if exists public.is_admin();
drop function if exists public.set_updated_at();

drop type if exists public.event_review_status;
drop type if exists public.event_category;

commit;
