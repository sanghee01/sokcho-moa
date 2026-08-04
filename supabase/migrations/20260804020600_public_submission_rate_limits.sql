-- Public submissions are rate-limited by an atomic database counter. Keep the
-- counters outside exposed API schemas and persist only an application-keyed HMAC
-- of the visitor address, never the address itself.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated, service_role;

create table if not exists private.public_submission_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  window_ends_at timestamptz not null,
  request_count integer not null,
  updated_at timestamptz not null,
  primary key (scope, key_hash),
  constraint public_submission_rate_limits_scope_check
    check (scope in ('event_report', 'site_feedback')),
  constraint public_submission_rate_limits_key_hash_check
    check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint public_submission_rate_limits_window_check
    check (window_ends_at > window_started_at),
  constraint public_submission_rate_limits_request_count_check
    check (request_count > 0)
);

create index if not exists public_submission_rate_limits_expiry_idx
  on private.public_submission_rate_limits (window_ends_at);

alter table private.public_submission_rate_limits enable row level security;
revoke all on table private.public_submission_rate_limits
  from public, anon, authenticated, service_role;

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

comment on table private.public_submission_rate_limits is
  'Fixed-window counters for public submissions. key_hash is an HMAC-SHA256 digest; raw visitor addresses are never stored.';
comment on function public.consume_public_submission_rate_limit(text, text, integer, integer) is
  'Atomically consumes one public-submission allowance and returns an exact retry delay when denied.';
