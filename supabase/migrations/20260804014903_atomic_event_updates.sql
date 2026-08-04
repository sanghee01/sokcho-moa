-- Keep an administrator's event edit as one database transaction. The function updates
-- the event, replaces its structured occurrences, and records the source together, so
-- any validation, trigger, or constraint failure rolls the complete edit back.
create or replace function public.update_event_with_source(
  p_event_id uuid,
  p_event jsonb,
  p_occurrences jsonb default '[]'::jsonb,
  p_source_checked_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_input record;
  updated_event_id uuid;
  derived_external_id text;
begin
  -- SECURITY DEFINER bypasses RLS, so authorization remains an explicit part of this
  -- aggregate command rather than relying on the caller's table privileges.
  if not (select public.is_admin()) then
    raise exception 'admin permission required'
      using errcode = '42501';
  end if;

  if p_event_id is null then
    raise exception 'p_event_id must not be null'
      using errcode = '22023';
  end if;
  if p_event is null or jsonb_typeof(p_event) <> 'object' then
    raise exception 'p_event must be a JSON object'
      using errcode = '22023';
  end if;
  if p_occurrences is null or jsonb_typeof(p_occurrences) <> 'array' then
    raise exception 'p_occurrences must be a JSON array'
      using errcode = '22023';
  end if;

  -- Accept only fields owned by the administrator form. In particular, description is
  -- legacy read fallback data; summary is the only event introduction written here.
  if exists (
    select 1
    from jsonb_object_keys(p_event) as event_key(key)
    where event_key.key not in (
      'slug',
      'title',
      'summary',
      'category',
      'audiences',
      'event_start_at',
      'event_end_at',
      'operating_hours',
      'schedule_mode',
      'application_start_at',
      'application_end_at',
      'location_name',
      'address',
      'price_text',
      'is_free',
      'performer_people',
      'performer_groups',
      'organizer',
      'organizer_url',
      'contact',
      'application_url',
      'image_url',
      'source_name',
      'source_url',
      'is_featured',
      'last_verified_at'
    )
  ) then
    raise exception 'p_event contains an unsupported field'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_occurrences) as occurrence(value)
    cross join lateral jsonb_object_keys(occurrence.value) as occurrence_key(key)
    where jsonb_typeof(occurrence.value) <> 'object'
      or occurrence_key.key not in ('starts_at', 'ends_at')
  ) then
    raise exception 'p_occurrences contains an unsupported field'
      using errcode = '22023';
  end if;

  select parsed_event.*
  into event_input
  from jsonb_to_record(p_event) as parsed_event(
    slug text,
    title text,
    summary text,
    category public.event_category,
    audiences text[],
    event_start_at timestamptz,
    event_end_at timestamptz,
    operating_hours text,
    schedule_mode text,
    application_start_at timestamptz,
    application_end_at timestamptz,
    location_name text,
    address text,
    price_text text,
    is_free boolean,
    performer_people text[],
    performer_groups text[],
    organizer text,
    organizer_url text,
    contact text,
    application_url text,
    image_url text,
    source_name text,
    source_url text,
    is_featured boolean,
    last_verified_at timestamptz
  );

  if nullif(btrim(event_input.source_name), '') is null then
    raise exception 'source name must not be blank'
      using errcode = '22023';
  end if;
  if nullif(btrim(event_input.source_url), '') is null then
    raise exception 'source URL must not be blank'
      using errcode = '22023';
  end if;

  event_input.source_name := btrim(event_input.source_name);
  event_input.source_url := btrim(event_input.source_url);
  if public.normalize_event_source_url(event_input.source_url) is null then
    raise exception 'source URL must be a canonical ASCII-host HTTP(S) URL'
      using errcode = '22023';
  end if;

  event_input.schedule_mode := coalesce(event_input.schedule_mode, 'continuous');
  if event_input.schedule_mode = 'occurrences' and jsonb_array_length(p_occurrences) = 0 then
    raise exception 'occurrence schedule must include at least one occurrence'
      using errcode = '22023';
  end if;
  if event_input.schedule_mode = 'continuous' and jsonb_array_length(p_occurrences) <> 0 then
    raise exception 'continuous schedule must not include occurrences'
      using errcode = '22023';
  end if;

  derived_external_id := public.extract_event_source_external_id(event_input.source_url);

  -- Use the same transaction-wide ordering as deletion and collection. Child rows are
  -- locked before the parent row so this edit cannot race with an aggregate deletion.
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

  perform 1
  from public.events as event
  where event.id = p_event_id
  for update;

  if not found then
    raise exception 'event % was not found', p_event_id
      using errcode = 'P0002';
  end if;

  perform public.lock_event_deletion_identity_keys(
    event_input.slug,
    event_input.source_url,
    derived_external_id
  );
  if public.is_event_collection_excluded(
    event_input.slug,
    event_input.source_url,
    derived_external_id
  ) then
    raise exception 'event_collection_excluded: event matches a durable deletion tombstone'
      using errcode = '23514', constraint = 'events_not_tombstoned';
  end if;

  update public.events as event
  set
    slug = event_input.slug,
    title = event_input.title,
    summary = event_input.summary,
    category = event_input.category,
    audiences = coalesce(event_input.audiences, '{}'::text[]),
    event_start_at = event_input.event_start_at,
    event_end_at = event_input.event_end_at,
    operating_hours = event_input.operating_hours,
    schedule_mode = event_input.schedule_mode,
    application_start_at = event_input.application_start_at,
    application_end_at = event_input.application_end_at,
    location_name = event_input.location_name,
    address = event_input.address,
    price_text = event_input.price_text,
    is_free = event_input.is_free,
    performer_people = coalesce(event_input.performer_people, '{}'::text[]),
    performer_groups = coalesce(event_input.performer_groups, '{}'::text[]),
    organizer = event_input.organizer,
    organizer_url = event_input.organizer_url,
    contact = event_input.contact,
    application_url = event_input.application_url,
    image_url = event_input.image_url,
    source_name = event_input.source_name,
    source_url = event_input.source_url,
    is_featured = coalesce(event_input.is_featured, false),
    last_verified_at = event_input.last_verified_at
  where event.id = p_event_id
  returning event.id into updated_event_id;

  delete from public.event_occurrences
  where event_id = updated_event_id;

  insert into public.event_occurrences (event_id, starts_at, ends_at)
  select
    updated_event_id,
    occurrence.starts_at,
    occurrence.ends_at
  from jsonb_to_recordset(p_occurrences) as occurrence(
    starts_at timestamptz,
    ends_at timestamptz
  );

  insert into public.event_sources (
    event_id,
    provider,
    original_url,
    external_id,
    last_checked_at
  ) values (
    updated_event_id,
    event_input.source_name,
    event_input.source_url,
    derived_external_id,
    p_source_checked_at
  )
  on conflict (event_id, provider, original_url) do update
  set
    external_id = excluded.external_id,
    last_checked_at = excluded.last_checked_at;

  return updated_event_id;
end;
$$;

-- PostgreSQL grants new functions to PUBLIC by default. Expose this privileged RPC only
-- to signed-in callers; the is_admin() check above performs the actual authorization.
revoke all on function public.update_event_with_source(uuid, jsonb, jsonb, timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.update_event_with_source(uuid, jsonb, jsonb, timestamptz)
  to authenticated;

comment on function public.update_event_with_source(uuid, jsonb, jsonb, timestamptz) is
  '관리자 행사·운영 회차·출처 수정을 하나의 트랜잭션으로 저장한다.';
