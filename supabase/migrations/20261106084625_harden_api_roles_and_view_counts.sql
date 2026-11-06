-- DB 보안 점검 후속: 삭제 기록이 다른 행사를 막던 문제, 조회수 부풀리기, Data API 역할의 넓은 기본 권한을 정리한다.
-- 되돌리기: supabase/rollbacks/20261106084625_harden_api_roles_and_view_counts.sql
--
-- 운영 적용 전 확인(읽기 전용): 이미 남은 삭제 기록 중 다른 살아 있는 행사가 쓰는 출처 identity.
-- 이 migration은 앞으로의 삭제만 고친다. 결과가 있으면 그 행사는 계속 수정·공개가 막히므로 따로 판단한다.
--   select tombstone.original_slug, identity.kind, identity.identity_value, event.slug as blocked_event
--   from public.event_deletion_identities as identity
--   join public.event_deletion_tombstones as tombstone
--     on tombstone.id = identity.tombstone_id and tombstone.released_at is null
--   join lateral (
--     select e.id, e.slug, e.source_url, null::text as external_id from public.events as e
--     union all
--     select s.event_id, e.slug, s.original_url, s.external_id
--     from public.event_sources as s join public.events as e on e.id = s.event_id
--   ) as event on true
--   cross join lateral public.event_deletion_identity_keys(null, event.source_url, event.external_id) as live
--   where identity.kind <> 'slug' and live.identity_key = identity.identity_key;

-- 1. 삭제 기록(tombstone)이 다른 살아 있는 행사의 출처를 막지 않게 한다.
--    events.source_url은 unique가 아니라 한 공고 URL에 행사가 여러 개 걸린다. 그중 하나를 지우면서 공고 URL·
--    external_id를 기록하면, 수정 RPC·공개 trigger가 남은 행사까지 "재수집 제외"로 거부했다.
--    삭제 시점에 다른 행사(events.source_url 또는 event_sources)가 쓰는 출처 identity는 기록하지 않는다.
--    slug identity는 항상 기록한다. 그 밖의 정의는 20260803015356과 같다.
create or replace function public.delete_event_and_exclude(
  p_event_id uuid,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_event public.events%rowtype;
  new_tombstone_id uuid := gen_random_uuid();
  affected_rows integer;
  locked_identity_key text;
begin
  if not (select public.is_admin()) then
    raise exception 'admin permission required'
      using errcode = '42501';
  end if;

  -- 모든 행사·출처·회차 쓰기가 statement trigger에서 같은 lock을 잡는다. 이 lock을 삭제 끝까지 쥐고 있으므로
  -- 아래에서 "다른 행사가 쓰는 출처"를 읽은 뒤 commit까지 다른 쓰기가 끼어들 수 없다.
  perform pg_advisory_xact_lock(
    hashtextextended('sokcho-moa:event-collection-mutations:v1', 0)
  );

  perform 1
  from public.event_sources as event_source
  where event_source.event_id = p_event_id
  order by event_source.id
  for update;

  perform 1
  from public.event_occurrences as occurrence
  where occurrence.event_id = p_event_id
  order by occurrence.id
  for update;

  select event.*
  into deleted_event
  from public.events as event
  where event.id = p_event_id
  for update;

  if not found then
    raise exception 'event % was not found', p_event_id
      using errcode = 'P0002';
  end if;

  for locked_identity_key in
    select distinct_identity.identity_key
    from (
      select distinct identity.identity_key
      from (
        select
          deleted_event.slug as event_slug,
          deleted_event.source_url as source_url,
          null::text as external_id

        union all

        select
          null::text,
          event_source.original_url,
          event_source.external_id
        from public.event_sources as event_source
        where event_source.event_id = p_event_id
      ) as source_candidate
      cross join lateral public.event_deletion_identity_keys(
        source_candidate.event_slug,
        source_candidate.source_url,
        source_candidate.external_id
      ) as identity
    ) as distinct_identity
    order by distinct_identity.identity_key collate "C"
  loop
    perform pg_advisory_xact_lock(hashtextextended(locked_identity_key, 0));
  end loop;

  insert into public.event_deletion_tombstones (
    id,
    original_event_id,
    original_title,
    original_slug,
    event_snapshot,
    deleted_by,
    reason
  ) values (
    new_tombstone_id,
    deleted_event.id,
    deleted_event.title,
    deleted_event.slug,
    to_jsonb(deleted_event),
    (select auth.uid()),
    nullif(btrim(p_reason), '')
  );

  insert into public.event_deletion_identities (
    tombstone_id,
    identity_key,
    kind,
    source_namespace,
    identity_value,
    source_url
  )
  with deleted_candidates as (
    select
      deleted_event.slug as event_slug,
      deleted_event.source_url as source_url,
      null::text as external_id

    union all

    select
      null::text,
      event_source.original_url,
      event_source.external_id
    from public.event_sources as event_source
    where event_source.event_id = p_event_id
  ),
  -- 출처 identity의 namespace·값은 모두 정규화한 host를 포함한다. 같은 host 문자열이 없는 다른 출처는
  -- 같은 identity가 될 수 없으므로, 비싼 정규화 함수를 다른 행사 전체에 돌리기 전에 걸러 낸다.
  -- 정규화할 수 없는 URL('unknown' namespace)이 있으면 host가 null이 되어 거르지 않는다.
  deleted_hosts as (
    select distinct regexp_replace(
      regexp_replace(
        regexp_replace(
          split_part(split_part(public.normalize_event_source_url(candidate.source_url), '://', 2), '/', 1),
          '^.*@', ''
        ),
        ':[0-9]*$', ''
      ),
      '^www[.]', ''
    ) as host
    from deleted_candidates as candidate
    where candidate.source_url is not null
  ),
  other_candidates as (
    select other_event.source_url, null::text as external_id
    from public.events as other_event
    where other_event.id <> p_event_id

    union all

    select other_source.original_url, other_source.external_id
    from public.event_sources as other_source
    where other_source.event_id <> p_event_id
  ),
  identities_in_use as (
    select other_identity.identity_key
    from other_candidates as other_candidate
    cross join lateral public.event_deletion_identity_keys(
      null,
      other_candidate.source_url,
      other_candidate.external_id
    ) as other_identity
    where exists (
      select 1
      from deleted_hosts
      where deleted_hosts.host is null
        or strpos(lower(other_candidate.source_url), deleted_hosts.host) > 0
    )
  )
  select
    new_tombstone_id,
    identity.identity_key,
    identity.kind,
    identity.source_namespace,
    identity.identity_value,
    identity.source_url
  from deleted_candidates as source_candidate
  cross join lateral public.event_deletion_identity_keys(
    source_candidate.event_slug,
    source_candidate.source_url,
    source_candidate.external_id
  ) as identity
  where identity.kind = 'slug'
    or not exists (
      select 1
      from identities_in_use
      where identities_in_use.identity_key = identity.identity_key
    )
  on conflict (tombstone_id, identity_key) do nothing;

  delete from public.events
  where id = p_event_id;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'expected to delete one event, deleted %', affected_rows;
  end if;

  return deleted_event.slug;
end;
$$;

-- create or replace는 기존 권한을 유지하지만, 이 함수의 공개 범위를 이 파일에서도 분명히 한다.
revoke all on function public.delete_event_and_exclude(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.delete_event_and_exclude(uuid, text) to authenticated;

-- 2. 조회수: 방문자가 PostgREST로 RPC를 직접 불러 요청 제한 없이 조회수를 올릴 수 있었다.
--    서버 route가 요청 제한을 거친 뒤 service_role로만 부른다. 샘플(is_demo) 행사는 세지 않는다.
create or replace function public.increment_event_view(p_slug text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_view_count integer;
begin
  update public.events
  set view_count = view_count + 1
  where slug = p_slug
    and review_status = 'published'
    and is_demo = false
  returning view_count into updated_view_count;

  return updated_view_count;
end;
$$;

revoke all on function public.increment_event_view(text) from public, anon, authenticated, service_role;
grant execute on function public.increment_event_view(text) to service_role;

-- 조회수만 바뀐 update는 updated_at을 바꾸지 않는다. updated_at은 관리자 목록 정렬에 쓰여,
-- 조회될 때마다 행사가 "방금 수정됨"으로 올라갔다. 그 밖의 update(내용 변경 없는 저장 포함)는 그대로 갱신한다.
drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row
when (
  old.view_count is not distinct from new.view_count
  or (to_jsonb(old) - 'view_count' - 'updated_at') is distinct from (to_jsonb(new) - 'view_count' - 'updated_at')
)
execute function public.set_updated_at();

-- 3. 요청 제한: 조회수 scope를 추가하고, 만료 행 정리가 동시 요청끼리 서로 기다리다 deadlock 나지 않게
--    이미 다른 요청이 잠근 행은 건너뛴다(skip locked). 그 밖의 정의는 20260804020600과 같다.
alter table private.public_submission_rate_limits
  drop constraint public_submission_rate_limits_scope_check;
alter table private.public_submission_rate_limits
  add constraint public_submission_rate_limits_scope_check
  check (scope in ('event_report', 'site_feedback', 'event_view'));

create or replace function public.consume_public_submission_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  if p_scope is null or p_scope not in ('event_report', 'site_feedback', 'event_view') then
    raise exception 'invalid rate-limit scope' using errcode = '22023';
  end if;
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid rate-limit key hash' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'rate-limit limit must be between 1 and 1000' using errcode = '22023';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'rate-limit window must be between 1 and 86400 seconds' using errcode = '22023';
  end if;

  with consumed as (
    insert into private.public_submission_rate_limits as rate_limit (
      scope,
      key_hash,
      window_started_at,
      window_ends_at,
      request_count,
      updated_at
    ) values (
      p_scope,
      p_key_hash,
      v_now,
      v_now + make_interval(secs => p_window_seconds),
      1,
      v_now
    )
    on conflict (scope, key_hash) do update
    set
      window_started_at = case
        when rate_limit.window_ends_at <= v_now then excluded.window_started_at
        else rate_limit.window_started_at
      end,
      window_ends_at = case
        when rate_limit.window_ends_at <= v_now then excluded.window_ends_at
        else rate_limit.window_ends_at
      end,
      request_count = case
        when rate_limit.window_ends_at <= v_now then 1
        else least(rate_limit.request_count, p_limit) + 1
      end,
      updated_at = v_now
    returning rate_limit.request_count, rate_limit.window_ends_at
  )
  select
    consumed.request_count <= p_limit,
    case
      when consumed.request_count <= p_limit then 0
      else greatest(
        1,
        ceil(extract(epoch from (consumed.window_ends_at - v_now)))::integer
      )
    end
  into allowed, retry_after_seconds
  from consumed;

  -- 만료 행 정리. 동시에 도는 다른 요청이 같은 만료 행을 다른 순서로 잠그면 서로 기다리다 deadlock이
  -- 날 수 있으므로, 이미 잠긴 행은 건너뛴다. 남은 행은 다음 요청이 정리한다.
  with stale_rows as (
    select candidate.ctid
    from private.public_submission_rate_limits as candidate
    where candidate.window_ends_at <= v_now
      and (candidate.scope, candidate.key_hash) <> (p_scope, p_key_hash)
    order by candidate.window_ends_at
    limit 100
    for update skip locked
  )
  delete from private.public_submission_rate_limits as stale
  using stale_rows
  where stale.ctid = stale_rows.ctid;

  return next;
end;
$$;

revoke all on function public.consume_public_submission_rate_limit(text, text, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.consume_public_submission_rate_limit(text, text, integer, integer)
  to service_role;

-- 4. Data API 역할의 table 권한. Supabase 기본값은 anon·authenticated에 모든 권한을 준다.
--    RLS가 행을 막아도 권한이 남아 있으면 BEFORE trigger(security definer인 재수집 제외 검사 포함)가 RLS보다 먼저
--    실행되고, TRUNCATE는 RLS를 아예 거치지 않는다.
--    - anon: 읽기(select)만 남긴다. 방문자 쓰기는 서버가 service_role로 한다.
--    - authenticated: 관리자 세션이 RLS 아래에서 쓰는 insert·update·delete는 남기고, RLS를 거치지 않는
--      truncate와 쓰지 않는 references·trigger만 회수한다.
--    - admin_users: 앱은 is_admin()(security definer)으로만 확인하므로 API 역할의 직접 접근을 모두 회수한다.
revoke insert, update, delete, truncate, references, trigger
  on table public.events, public.event_sources, public.event_occurrences, public.places
  from anon;
revoke update, delete, truncate, references, trigger
  on table public.event_reports, public.site_feedback
  from anon;
revoke truncate, references, trigger
  on table public.events, public.event_sources, public.event_occurrences, public.places,
    public.event_reports, public.site_feedback
  from authenticated;
revoke all on table public.admin_users from anon, authenticated;

-- 앞으로 postgres가 만드는 함수는 PUBLIC·anon·authenticated가 자동으로 실행할 수 없다.
-- 필요한 함수는 지금처럼 migration에서 명시적으로 grant한다. 이미 있는 함수의 권한은 바뀌지 않는다.
-- PUBLIC 실행 권한은 PostgreSQL 전역 기본값이라 schema 단위(in schema)로는 회수되지 않아 전역으로 회수한다.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- 5. Storage: event-images는 public bucket이라 파일은 공개 URL로 읽힌다(이 경로는 RLS를 보지 않는다).
--    anon select 정책은 파일 목록 조회만 열어 주었다(Supabase lint 0025). 관리자만 조회할 수 있게 바꾼다.
--    관리자 이미지 삭제(storage remove)는 select와 delete 정책이 모두 필요하다.
drop policy if exists "Event images are public" on storage.objects;
drop policy if exists "Admins read event images" on storage.objects;
create policy "Admins read event images" on storage.objects
for select to authenticated
using (bucket_id = 'event-images' and (select public.is_admin()));
