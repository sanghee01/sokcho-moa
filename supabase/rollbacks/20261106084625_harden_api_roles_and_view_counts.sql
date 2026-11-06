-- 되돌리기: supabase/migrations/20261106084625_harden_api_roles_and_view_counts.sql
-- 각 항목을 이 migration 이전 정의로 되돌린다. 역순으로 적었다.
--
-- 되돌리지 못하는 것
-- - 1번(삭제 기록): 이 migration이 적용된 동안 삭제한 행사는 "다른 행사가 쓰던 출처" identity가 기록되지 않았다.
--   rollback으로 함수를 되돌려도 그 기록은 생기지 않는다(기록하지 않은 것이 의도이므로 백업할 데이터도 없다).
-- - 3번(요청 제한): scope check를 예전 값으로 되돌리려면 event_view 카운터 행을 먼저 지워야 한다. 요청 제한 카운터는
--   최대 10분짜리 임시 값이라 백업하지 않는다.

-- 5. Storage: 행사 이미지 목록을 다시 누구나 조회할 수 있게 한다.
drop policy if exists "Admins read event images" on storage.objects;
drop policy if exists "Event images are public" on storage.objects;
create policy "Event images are public" on storage.objects
for select to anon, authenticated
using (bucket_id = 'event-images');

-- 4. Data API 역할의 기본 권한 복구
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated;
alter default privileges for role postgres
  grant execute on functions to public;

grant all on table public.admin_users to anon, authenticated;
grant truncate, references, trigger
  on table public.events, public.event_sources, public.event_occurrences, public.places,
    public.event_reports, public.site_feedback
  to authenticated;
grant update, delete, truncate, references, trigger
  on table public.event_reports, public.site_feedback
  to anon;
-- events의 delete는 20260803015356이 모든 API 역할에서 회수했으므로 되돌리지 않는다.
grant insert, update, truncate, references, trigger on table public.events to anon;
grant insert, update, delete, truncate, references, trigger
  on table public.event_sources, public.event_occurrences, public.places
  to anon;

-- 3. 요청 제한 함수·scope 복구(20260804020600과 같은 정의)
delete from private.public_submission_rate_limits where scope = 'event_view';
alter table private.public_submission_rate_limits
  drop constraint public_submission_rate_limits_scope_check;
alter table private.public_submission_rate_limits
  add constraint public_submission_rate_limits_scope_check
  check (scope in ('event_report', 'site_feedback'));

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
  if p_scope is null or p_scope not in ('event_report', 'site_feedback') then
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

  -- INSERT ... ON CONFLICT takes a row lock for this scope/key pair. Concurrent
  -- requests therefore increment one counter without a read-then-write race.
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

  -- Expired hashes no longer serve an abuse-prevention purpose. Prune them on
  -- normal traffic while preserving the row consumed by this call.
  with stale_rows as (
    select candidate.ctid
    from private.public_submission_rate_limits as candidate
    where candidate.window_ends_at <= v_now
      and (candidate.scope, candidate.key_hash) <> (p_scope, p_key_hash)
    order by candidate.window_ends_at
    limit 100
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

-- 2. 조회수 RPC·updated_at trigger 복구(202607200004 + 20260804014839의 search_path)
drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events
for each row execute function public.set_updated_at();

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
  returning view_count into updated_view_count;

  return updated_view_count;
end;
$$;

revoke all on function public.increment_event_view(text) from public;
grant execute on function public.increment_event_view(text) to anon, authenticated, service_role;

-- 1. 행사 삭제 RPC 복구(20260803015356과 같은 정의)
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

  -- The statement-level guards on events, event_sources, and event_occurrences take
  -- this same lock before row selection. Holding it for the whole deletion makes the
  -- child-to-parent snapshot below safe even for upserts and multi-statement writers.
  perform pg_advisory_xact_lock(
    hashtextextended('sokcho-moa:event-collection-mutations:v1', 0)
  );

  -- Child writers lock their source/occurrence row before the parent event. Use one
  -- deterministic child-to-parent order here so collection, schedule replacement, and
  -- deletion cannot deadlock or snapshot an identity that is concurrently changing.
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

  -- Lock the complete identity set in one deterministic order. Repeating the candidate
  -- query below is intentional: after waiting, READ COMMITTED sees any source row that
  -- linearized before this deletion.
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
  select
    new_tombstone_id,
    identity.identity_key,
    identity.kind,
    identity.source_namespace,
    identity.identity_value,
    identity.source_url
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

revoke all on function public.delete_event_and_exclude(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.delete_event_and_exclude(uuid, text) to authenticated;
