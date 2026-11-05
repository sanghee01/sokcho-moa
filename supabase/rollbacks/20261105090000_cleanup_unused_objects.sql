-- 되돌리기: supabase/migrations/20261105090000_cleanup_unused_objects.sql
-- 4번(source_url not null)은 되돌리지 않는다. 운영 DB가 원래 가졌어야 할 상태이고,
-- 되돌리면 두 환경의 schema가 다시 달라진다.

-- 3. authenticated의 insert 권한 복구
grant insert on table public.event_reports to authenticated;
grant insert on table public.site_feedback to authenticated;

-- 2. index 복구
create index if not exists event_sources_event_idx on public.event_sources (event_id);
create index if not exists event_deletion_identities_tombstone_id_idx
  on public.event_deletion_identities (tombstone_id);

-- 1. 회차 교체 RPC 복구(202607200001_event_occurrences.sql과 같은 정의)
create or replace function public.replace_event_occurrences(
  p_event_id uuid,
  p_occurrences jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'admin permission required';
  end if;
  if jsonb_typeof(p_occurrences) <> 'array' then
    raise exception 'p_occurrences must be a JSON array';
  end if;

  delete from public.event_occurrences where event_id = p_event_id;

  insert into public.event_occurrences (event_id, starts_at, ends_at)
  select
    p_event_id,
    (item ->> 'starts_at')::timestamptz,
    nullif(item ->> 'ends_at', '')::timestamptz
  from jsonb_array_elements(p_occurrences) as item;
end;
$$;

revoke all on function public.replace_event_occurrences(uuid, jsonb) from public;
grant execute on function public.replace_event_occurrences(uuid, jsonb) to authenticated;
