-- Keep a durable record of deliberately deleted events so a later collection run cannot
-- recreate one under a new UUID or slug until an admin explicitly allows recollection.

create table public.event_deletion_tombstones (
  id uuid primary key default gen_random_uuid(),
  original_event_id uuid not null,
  original_title text not null,
  original_slug text not null,
  event_snapshot jsonb not null,
  deleted_by uuid not null,
  deleted_at timestamptz not null default now(),
  reason text,
  released_at timestamptz,
  released_by uuid,
  constraint event_deletion_tombstones_slug_not_blank
    check (btrim(original_slug) <> ''),
  constraint event_deletion_tombstones_title_not_blank
    check (btrim(original_title) <> ''),
  constraint event_deletion_tombstones_snapshot_is_object
    check (jsonb_typeof(event_snapshot) = 'object'),
  constraint event_deletion_tombstones_reason_not_blank
    check (reason is null or btrim(reason) <> ''),
  constraint event_deletion_tombstones_release_audit_pair
    check ((released_at is null) = (released_by is null))
);

create table public.event_deletion_identities (
  id uuid primary key default gen_random_uuid(),
  tombstone_id uuid not null
    references public.event_deletion_tombstones(id) on delete cascade,
  identity_key text not null,
  kind text not null,
  source_namespace text not null,
  identity_value text not null,
  source_url text,
  created_at timestamptz not null default now(),
  constraint event_deletion_identities_kind_check
    check (kind in ('slug', 'url', 'external_id')),
  constraint event_deletion_identities_namespace_not_blank
    check (btrim(source_namespace) <> ''),
  constraint event_deletion_identities_value_not_blank
    check (btrim(identity_value) <> ''),
  constraint event_deletion_identities_tombstone_key_unique
    unique (tombstone_id, identity_key)
);

create index event_deletion_tombstones_deleted_at_idx
  on public.event_deletion_tombstones (deleted_at desc);
create index event_deletion_tombstones_original_event_id_idx
  on public.event_deletion_tombstones (original_event_id);
create index event_deletion_tombstones_slug_idx
  on public.event_deletion_tombstones (original_slug);
create index event_deletion_tombstones_active_deleted_at_idx
  on public.event_deletion_tombstones (deleted_at desc)
  where released_at is null;
create index event_deletion_identities_tombstone_id_idx
  on public.event_deletion_identities (tombstone_id);
create index event_deletion_identities_identity_key_idx
  on public.event_deletion_identities (identity_key);

alter table public.event_deletion_tombstones enable row level security;
alter table public.event_deletion_identities enable row level security;

create policy "Admins manage event deletion tombstones"
on public.event_deletion_tombstones
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins manage event deletion identities"
on public.event_deletion_identities
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Raw SQL migrations can inherit broad Data API defaults. Keep both tables explicitly
-- authenticated-only. Tombstones and identities are immutable to API roles; an audited
-- SECURITY DEFINER RPC below is the only supported way to allow recollection.
revoke all on table public.event_deletion_tombstones from public, anon, authenticated, service_role;
revoke all on table public.event_deletion_identities from public, anon, authenticated, service_role;
grant select on table public.event_deletion_tombstones to authenticated;
grant select on table public.event_deletion_identities to authenticated;

-- The initial schema allowed API callers to hard-delete events directly. From this
-- migration onward, deliberate deletion must pass through delete_event_and_exclude.
revoke delete on table public.events from anon, authenticated, service_role;

-- This normalization mirrors the collector: discard fragments and tracking parameters,
-- lowercase the scheme/host, remove a trailing path slash, and sort meaningful queries.
create or replace function public.decode_event_url_component(
  p_value text,
  p_plus_as_space boolean default false
)
returns text
language plpgsql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
declare
  decoded_bytes bytea := ''::bytea;
  character_index integer := 1;
  current_character text;
  hex_pair text;
begin
  while character_index <= char_length(p_value) loop
    current_character := substring(p_value from character_index for 1);
    hex_pair := substring(p_value from character_index + 1 for 2);

    if current_character = '%'
      and char_length(hex_pair) = 2
      and hex_pair ~ '^[0-9a-fA-F]{2}$'
    then
      decoded_bytes := decoded_bytes || decode(hex_pair, 'hex');
      character_index := character_index + 3;
    else
      decoded_bytes := decoded_bytes || convert_to(
        case
          when p_plus_as_space and current_character = '+' then ' '
          else current_character
        end,
        'UTF8'
      );
      character_index := character_index + 1;
    end if;
  end loop;

  begin
    return convert_from(decoded_bytes, 'UTF8');
  exception when others then
    -- Malformed upstream encodings remain comparable as their original bytes instead
    -- of aborting collection or deletion.
    return p_value;
  end;
end;
$$;

-- Represent each decoded path segment as UTF-8 hex while retaining slash boundaries.
-- This makes literal/percent-encoded text and hex-case variants comparable without
-- confusing an encoded slash inside a segment with an actual path separator.
create or replace function public.canonicalize_event_url_path(p_path text)
returns text
language plpgsql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
declare
  canonical_segments text[] := '{}'::text[];
  raw_segment text;
  decoded_segment text;
  segment_order bigint;
begin
  if p_path = '' then
    return '/';
  end if;

  for raw_segment, segment_order in
    select path_segment, part_order
    from unnest(string_to_array(p_path, '/'))
      with ordinality as path_segments(path_segment, part_order)
    order by part_order
  loop
    if segment_order = 1 and raw_segment = '' then
      continue;
    end if;

    decoded_segment := public.decode_event_url_component(raw_segment, false);
    if decoded_segment = '.' then
      continue;
    elsif decoded_segment = '..' then
      if cardinality(canonical_segments) > 0 then
        canonical_segments := canonical_segments[1:cardinality(canonical_segments) - 1];
      end if;
      continue;
    end if;

    canonical_segments := array_append(
      canonical_segments,
      encode(convert_to(decoded_segment, 'UTF8'), 'hex')
    );
  end loop;

  return '/' || array_to_string(canonical_segments, '/');
end;
$$;

create or replace function public.normalize_event_source_url(p_source_url text)
returns text
language plpgsql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
declare
  source_without_fragment text := btrim(split_part(p_source_url, '#', 1));
  url_parts text[];
  normalized_path text;
  normalized_authority text;
  raw_query text;
  normalized_query text;
begin
  if source_without_fragment = '' then
    return null;
  end if;

  url_parts := regexp_match(
    source_without_fragment,
    '^([a-z][a-z0-9+.-]*)://([^/?#]+)([^?#]*)(?:[?](.*))?$',
    'i'
  );

  if url_parts is null or lower(url_parts[1]) not in ('http', 'https') then
    return null;
  end if;
  if octet_length(url_parts[2]) <> char_length(url_parts[2])
    or strpos(source_without_fragment, E'\\') > 0
  then
    return null;
  end if;

  normalized_authority := lower(url_parts[2]);
  normalized_authority := regexp_replace(
    normalized_authority,
    ':0+([1-9][0-9]*)$',
    E':\\1'
  );
  normalized_authority := regexp_replace(normalized_authority, ':0+$', ':0');
  if lower(url_parts[1]) = 'https' then
    normalized_authority := regexp_replace(normalized_authority, ':0*443$', '');
  elsif lower(url_parts[1]) = 'http' then
    normalized_authority := regexp_replace(normalized_authority, ':0*80$', '');
  end if;
  normalized_authority := regexp_replace(normalized_authority, ':$', '');

  normalized_path := public.canonicalize_event_url_path(coalesce(url_parts[3], ''));
  if length(normalized_path) > 1 then
    normalized_path := regexp_replace(normalized_path, '/+$', '');
    if normalized_path = '' then
      normalized_path := '/';
    end if;
  end if;

  raw_query := url_parts[4];
  select string_agg(
    encode(convert_to(query_key, 'UTF8'), 'hex')
      || '=' || encode(convert_to(query_value, 'UTF8'), 'hex'),
    '&' order by query_key collate "C", part_order
  )
  into normalized_query
  from (
    select
      public.decode_event_url_component(split_part(query_part, '=', 1), true) as query_key,
      public.decode_event_url_component(
        case
          when strpos(query_part, '=') = 0 then ''
          else substring(query_part from strpos(query_part, '=') + 1)
        end,
        true
      ) as query_value,
      part_order
    from unnest(string_to_array(coalesce(raw_query, ''), '&'))
      with ordinality as query_parts(query_part, part_order)
    where query_part <> ''
  ) as decoded_query_parts
  where lower(query_key) not like 'utm\_%' escape '\'
    and lower(query_key) not in ('fbclid', 'gclid', 'dclid', 'msclkid');

  return lower(url_parts[1]) || '://' || normalized_authority || normalized_path
    || case
      when normalized_query is null or normalized_query = '' then ''
      else '?' || normalized_query
    end;
end;
$$;

-- The first recognized ID follows source query order, matching URLSearchParams iteration
-- in the application. Path IDs cover the official library URLs already in production.
create or replace function public.extract_event_source_external_id(p_source_url text)
returns text
language plpgsql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
declare
  source_without_fragment text := split_part(p_source_url, '#', 1);
  raw_query text;
  external_id text;
  path_value text;
begin
  if source_without_fragment !~* '^https?://' then
    return null;
  end if;

  if strpos(source_without_fragment, '?') > 0 then
    raw_query := substring(source_without_fragment from strpos(source_without_fragment, '?') + 1);

    select parsed_query.query_value
    into external_id
    from (
      select
        lower(public.decode_event_url_component(split_part(query_part, '=', 1), true))
          as query_key,
        nullif(btrim(public.decode_event_url_component(
          case
            when strpos(query_part, '=') = 0 then ''
            else substring(query_part from strpos(query_part, '=') + 1)
          end,
          true
        )), '') as query_value,
        part_order
      from unnest(string_to_array(raw_query, '&'))
        with ordinality as query_parts(query_part, part_order)
    ) as parsed_query
    where parsed_query.query_key in (
      'fstvlcntntsid',
      'eventseq',
      'articleseq',
      'contentseq',
      'pseq',
      'eduno',
      'idx',
      'ntt_id',
      'destid'
    )
      and parsed_query.query_value is not null
    order by parsed_query.part_order
    limit 1;
  end if;

  if external_id is not null then
    return external_id;
  end if;

  path_value := substring(
    split_part(source_without_fragment, '?', 1)
    from '/(?:post|movie)/([^/]+)/?$'
  );
  if nullif(btrim(path_value), '') is not null then
    return nullif(btrim(public.decode_event_url_component(path_value, false)), '');
  end if;

  path_value := substring(
    split_part(source_without_fragment, '?', 1)
    from '/([^/]+[.](?:avif|gif|jpe?g|png|webp))$'
  );
  return nullif(btrim(public.decode_event_url_component(path_value, false)), '');
end;
$$;

-- External IDs are only unique inside their originating source. Include both host and
-- ID carrier (query key/path family) so unrelated feeds cannot suppress one another.
create or replace function public.event_source_namespace(p_source_url text)
returns text
language plpgsql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
declare
  normalized_url text := public.normalize_event_source_url(p_source_url);
  source_without_fragment text := split_part(p_source_url, '#', 1);
  raw_query text;
  namespace_host text;
  external_id_key text;
  board_scope text;
  source_path text;
  raw_source_path text;
begin
  if normalized_url is null then
    return null;
  end if;

  namespace_host := lower(split_part(split_part(normalized_url, '://', 2), '/', 1));
  namespace_host := regexp_replace(namespace_host, '^www[.]', '', 'i');
  source_path := split_part(split_part(normalized_url, '?', 1), '://', 2);
  if strpos(source_path, '/') > 0 then
    source_path := substring(source_path from strpos(source_path, '/'));
  else
    source_path := '/';
  end if;
  source_path := coalesce(nullif(source_path, ''), '/');
  if length(source_path) > 1 then
    source_path := regexp_replace(source_path, '/+$', '');
  end if;

  raw_source_path := split_part(split_part(source_without_fragment, '?', 1), '://', 2);
  if strpos(raw_source_path, '/') > 0 then
    raw_source_path := substring(raw_source_path from strpos(raw_source_path, '/'));
  else
    raw_source_path := '/';
  end if;

  if strpos(source_without_fragment, '?') > 0 then
    raw_query := substring(source_without_fragment from strpos(source_without_fragment, '?') + 1);

    select lower(public.decode_event_url_component(split_part(query_part, '=', 1), true))
    into external_id_key
    from unnest(string_to_array(raw_query, '&'))
      with ordinality as query_parts(query_part, part_order)
    where lower(public.decode_event_url_component(split_part(query_part, '=', 1), true)) in (
      'fstvlcntntsid',
      'eventseq',
      'articleseq',
      'contentseq',
      'pseq',
      'eduno',
      'idx',
      'ntt_id',
      'destid'
    )
      and nullif(btrim(public.decode_event_url_component(
        case
          when strpos(query_part, '=') = 0 then ''
          else substring(query_part from strpos(query_part, '=') + 1)
        end,
        true
      )
      ), '') is not null
    order by part_order
    limit 1;

    -- Generic board counters such as idx/ntt_id can restart in different boards that
    -- share one endpoint. Retain a board discriminator when the source provides one.
    select lower(public.decode_event_url_component(split_part(query_part, '=', 1), true))
      || '=' || btrim(public.decode_event_url_component(
        substring(query_part from strpos(query_part, '=') + 1),
        true
      ))
    into board_scope
    from unnest(string_to_array(raw_query, '&'))
      with ordinality as query_parts(query_part, part_order)
    where lower(public.decode_event_url_component(split_part(query_part, '=', 1), true))
      in ('bbsid', 'bbs_id', 'bbsidx', 'bbs_idx')
      and strpos(query_part, '=') > 0
      and nullif(btrim(public.decode_event_url_component(
        substring(query_part from strpos(query_part, '=') + 1),
        true
      )), '') is not null
    order by part_order
    limit 1;
  end if;

  if external_id_key is not null then
    return namespace_host || ':path:' || source_path || ':query:' || external_id_key
      || case when board_scope is null then '' else ':scope:' || board_scope end;
  end if;
  if raw_source_path ~* '/post/[^/]+/?$' then
    return namespace_host || ':path:' || regexp_replace(source_path, '/[^/]+/?$', '');
  end if;
  if raw_source_path ~* '/movie/[^/]+/?$' then
    return namespace_host || ':path:' || regexp_replace(source_path, '/[^/]+/?$', '');
  end if;
  if raw_source_path ~* '[.](avif|gif|jpe?g|png|webp)$' then
    return namespace_host || ':file:' || regexp_replace(source_path, '/[^/]+$', '');
  end if;

  return namespace_host || ':path:' || source_path;
end;
$$;

-- Only IDs whose upstream systems define them as host-wide receive a route-independent
-- companion namespace. Generic idx/ntt_id/eduNo remain path-scoped to avoid false blocks.
create or replace function public.event_source_global_namespace(p_source_url text)
returns text
language plpgsql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
declare
  normalized_url text := public.normalize_event_source_url(p_source_url);
  source_without_fragment text := split_part(p_source_url, '#', 1);
  raw_query text;
  namespace_host text;
  external_id_key text;
begin
  if normalized_url is null or strpos(source_without_fragment, '?') = 0 then
    return null;
  end if;

  namespace_host := lower(split_part(split_part(normalized_url, '://', 2), '/', 1));
  namespace_host := regexp_replace(namespace_host, '^www[.]', '', 'i');
  raw_query := substring(source_without_fragment from strpos(source_without_fragment, '?') + 1);

  select lower(public.decode_event_url_component(split_part(query_part, '=', 1), true))
  into external_id_key
  from unnest(string_to_array(raw_query, '&'))
    with ordinality as query_parts(query_part, part_order)
  where lower(public.decode_event_url_component(split_part(query_part, '=', 1), true)) in (
    'fstvlcntntsid',
    'eventseq',
    'articleseq',
    'contentseq',
    'pseq',
    'destid'
  )
    and strpos(query_part, '=') > 0
    and nullif(btrim(public.decode_event_url_component(
      substring(query_part from strpos(query_part, '=') + 1),
      true
    )), '') is not null
  order by part_order
  limit 1;

  if external_id_key is null then
    return null;
  end if;
  return namespace_host || ':query:' || external_id_key;
end;
$$;

-- Hash a length-prefixed payload so punctuation cannot make the key ambiguous and very
-- long official URLs cannot exceed PostgreSQL's B-tree index tuple limit. The readable
-- namespace/value remain available in their dedicated columns.
create or replace function public.event_deletion_identity_key(
  p_kind text,
  p_namespace text,
  p_value text
)
returns text
language sql
immutable
strict
parallel safe
security invoker
set search_path = ''
as $$
  select lower(btrim(p_kind)) || ':sha256:' || encode(
    sha256(convert_to(
      octet_length(btrim(p_namespace))::text || ':' || btrim(p_namespace)
        || ':' || octet_length(btrim(p_value))::text || ':' || btrim(p_value),
      'UTF8'
    )),
    'hex'
  );
$$;

-- Expand one candidate source into every durable identity we know: slug, normalized
-- URL, the URL-derived external ID, and a separately supplied event_sources.external_id.
create or replace function public.event_deletion_identity_keys(
  p_slug text,
  p_source_url text,
  p_external_id text default null
)
returns table (
  identity_key text,
  kind text,
  source_namespace text,
  identity_value text,
  source_url text
)
language sql
immutable
parallel safe
security invoker
set search_path = ''
as $$
  with prepared as (
    select
      nullif(btrim(p_slug), '') as slug_value,
      public.normalize_event_source_url(p_source_url) as normalized_url,
      public.event_source_namespace(p_source_url) as url_namespace,
      public.event_source_global_namespace(p_source_url) as global_namespace,
      public.extract_event_source_external_id(p_source_url) as extracted_external_id,
      nullif(btrim(p_external_id), '') as supplied_external_id
  ), candidate_identities as (
    select
      'slug'::text as kind,
      'events'::text as source_namespace,
      lower(slug_value) as identity_value,
      null::text as source_url
    from prepared
    where slug_value is not null

    union

    select
      'url',
      coalesce(nullif(url_namespace, ''), 'unknown'),
      normalized_url,
      p_source_url
    from prepared
    where normalized_url is not null

    union

    select
      'external_id',
      coalesce(nullif(url_namespace, ''), 'unknown'),
      extracted_external_id,
      p_source_url
    from prepared
    where extracted_external_id is not null

    union

    select
      'external_id',
      coalesce(nullif(url_namespace, ''), 'unknown'),
      supplied_external_id,
      p_source_url
    from prepared
    where supplied_external_id is not null

    union

    select
      'external_id',
      global_namespace,
      extracted_external_id,
      p_source_url
    from prepared
    where global_namespace is not null
      and extracted_external_id is not null

    union

    select
      'external_id',
      global_namespace,
      supplied_external_id,
      p_source_url
    from prepared
    where global_namespace is not null
      and supplied_external_id is not null
  )
  select
    public.event_deletion_identity_key(
      candidate_identities.kind,
      candidate_identities.source_namespace,
      candidate_identities.identity_value
    ),
    candidate_identities.kind,
    candidate_identities.source_namespace,
    candidate_identities.identity_value,
    candidate_identities.source_url
  from candidate_identities;
$$;

-- Identity checks and tombstone creation take the same transaction-scoped advisory
-- locks in bytewise key order. Whichever transaction wins becomes the serialization
-- point: an insert that follows a delete must observe the committed tombstone.
create or replace function public.lock_event_deletion_identity_keys(
  p_slug text,
  p_source_url text,
  p_external_id text default null
)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  locked_identity_key text;
begin
  for locked_identity_key in
    select distinct_identity.identity_key
    from (
      select distinct candidate.identity_key
      from public.event_deletion_identity_keys(p_slug, p_source_url, p_external_id) as candidate
    ) as distinct_identity
    order by distinct_identity.identity_key collate "C"
  loop
    perform pg_advisory_xact_lock(hashtextextended(locked_identity_key, 0));
  end loop;
end;
$$;

-- A collection transaction can touch events, sources, and occurrences in different
-- statements (including INSERT ... ON CONFLICT DO UPDATE). Take one transaction-scoped
-- lock before any row in those tables is changed so deletion never waits on a child or
-- parent row held by a writer that is itself waiting for the deletion transaction.
create or replace function public.serialize_event_collection_mutations()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('sokcho-moa:event-collection-mutations:v1', 0)
  );
  return null;
end;
$$;

create or replace function public.is_event_collection_excluded(
  p_slug text,
  p_source_url text,
  p_external_id text
)
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_deletion_identity_keys(p_slug, p_source_url, p_external_id) as candidate
    join public.event_deletion_identities as deleted_identity
      on deleted_identity.identity_key = candidate.identity_key
    join public.event_deletion_tombstones as tombstone
      on tombstone.id = deleted_identity.tombstone_id
     and tombstone.released_at is null
  );
$$;

-- Lock the event before copying it. Identity rows are inserted before the hard delete
-- because public.event_sources is removed by its ON DELETE CASCADE foreign key.
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

-- Release only the active suppression state. The tombstone, snapshot, identities, and
-- both actor timestamps remain available as an audit trail.
create or replace function public.release_event_collection_exclusion(
  p_tombstone_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
  locked_identity_key text;
begin
  if not (select public.is_admin()) then
    raise exception 'admin permission required'
      using errcode = '42501';
  end if;

  perform 1
  from public.event_deletion_tombstones as tombstone
  where tombstone.id = p_tombstone_id
  for update;

  if not found then
    return false;
  end if;

  for locked_identity_key in
    select distinct_identity.identity_key
    from (
      select distinct identity.identity_key
      from public.event_deletion_identities as identity
      where identity.tombstone_id = p_tombstone_id
    ) as distinct_identity
    order by distinct_identity.identity_key collate "C"
  loop
    perform pg_advisory_xact_lock(hashtextextended(locked_identity_key, 0));
  end loop;

  update public.event_deletion_tombstones
  set
    released_at = statement_timestamp(),
    released_by = (select auth.uid())
  where id = p_tombstone_id
    and released_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

-- Create the aggregate in one transaction. A network failure can no longer commit an
-- event without its first source, and source/occurrence rejection rolls the event back.
-- Only an explicit column allow-list is copied from the JSON record; publication,
-- demo/view counters, IDs, and audit timestamps remain server-owned.
create or replace function public.create_event_with_source(
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
  new_event_id uuid;
  derived_external_id text;
begin
  if not (select public.is_admin()) then
    raise exception 'admin permission required'
      using errcode = '42501';
  end if;

  if p_event is null or jsonb_typeof(p_event) <> 'object' then
    raise exception 'p_event must be a JSON object'
      using errcode = '22023';
  end if;
  if p_occurrences is null or jsonb_typeof(p_occurrences) <> 'array' then
    raise exception 'p_occurrences must be a JSON array'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_event) as event_key(key)
    where event_key.key not in (
      'slug',
      'title',
      'summary',
      'description',
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
      'latitude',
      'longitude',
      'location_source_url',
      'location_verified_at',
      'price_text',
      'is_free',
      'performer_people',
      'performer_groups',
      'organizer',
      'organizer_url',
      'contact',
      'official_url',
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

  select parsed_event.*
  into event_input
  from jsonb_to_record(p_event) as parsed_event(
    slug text,
    title text,
    summary text,
    description text,
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
    latitude numeric,
    longitude numeric,
    location_source_url text,
    location_verified_at timestamptz,
    price_text text,
    is_free boolean,
    performer_people text[],
    performer_groups text[],
    organizer text,
    organizer_url text,
    contact text,
    official_url text,
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
  derived_external_id := public.extract_event_source_external_id(event_input.source_url);

  perform pg_advisory_xact_lock(
    hashtextextended('sokcho-moa:event-collection-mutations:v1', 0)
  );
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

  insert into public.events (
    slug,
    title,
    summary,
    description,
    category,
    audiences,
    event_start_at,
    event_end_at,
    operating_hours,
    schedule_mode,
    application_start_at,
    application_end_at,
    location_name,
    address,
    latitude,
    longitude,
    location_source_url,
    location_verified_at,
    price_text,
    is_free,
    performer_people,
    performer_groups,
    organizer,
    organizer_url,
    contact,
    official_url,
    application_url,
    image_url,
    source_name,
    source_url,
    review_status,
    is_featured,
    is_demo,
    last_verified_at
  ) values (
    event_input.slug,
    event_input.title,
    event_input.summary,
    event_input.description,
    event_input.category,
    coalesce(event_input.audiences, '{}'::text[]),
    event_input.event_start_at,
    event_input.event_end_at,
    event_input.operating_hours,
    coalesce(event_input.schedule_mode, 'continuous'),
    event_input.application_start_at,
    event_input.application_end_at,
    event_input.location_name,
    event_input.address,
    event_input.latitude,
    event_input.longitude,
    event_input.location_source_url,
    event_input.location_verified_at,
    event_input.price_text,
    event_input.is_free,
    coalesce(event_input.performer_people, '{}'::text[]),
    coalesce(event_input.performer_groups, '{}'::text[]),
    event_input.organizer,
    event_input.organizer_url,
    event_input.contact,
    event_input.official_url,
    event_input.application_url,
    event_input.image_url,
    event_input.source_name,
    event_input.source_url,
    'pending',
    coalesce(event_input.is_featured, false),
    false,
    event_input.last_verified_at
  )
  returning id into new_event_id;

  insert into public.event_sources (
    event_id,
    provider,
    original_url,
    external_id,
    last_checked_at
  ) values (
    new_event_id,
    event_input.source_name,
    event_input.source_url,
    derived_external_id,
    p_source_checked_at
  );

  insert into public.event_occurrences (event_id, starts_at, ends_at)
  select
    new_event_id,
    occurrence.starts_at,
    occurrence.ends_at
  from jsonb_to_recordset(p_occurrences) as occurrence(
    starts_at timestamptz,
    ends_at timestamptz
  );

  return new_event_id;
end;
$$;

create or replace function public.reject_tombstoned_event_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Let RLS return the same denial for every non-admin authenticated write. Trusted
  -- service/owner collection still reaches the privileged tombstone check.
  if current_setting('role', true) = 'authenticated'
    and not (select public.is_admin())
  then
    return new;
  end if;

  if public.normalize_event_source_url(new.source_url) is null then
    raise exception 'event source URL must be a canonical ASCII-host HTTP(S) URL'
      using errcode = '22023', constraint = 'events_source_url_canonical';
  end if;

  perform public.lock_event_deletion_identity_keys(new.slug, new.source_url, null);
  if public.is_event_collection_excluded(new.slug, new.source_url, null) then
    raise exception 'event_collection_excluded: event matches a durable deletion tombstone'
      using errcode = '23514', constraint = 'events_not_tombstoned';
  end if;
  return new;
end;
$$;

create or replace function public.reject_tombstoned_event_source_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('role', true) = 'authenticated'
    and not (select public.is_admin())
  then
    return new;
  end if;

  if public.normalize_event_source_url(new.original_url) is null then
    raise exception 'event source URL must be a canonical ASCII-host HTTP(S) URL'
      using errcode = '22023', constraint = 'event_sources_url_canonical';
  end if;

  perform 1
  from public.events as event
  where event.id = new.event_id
  for key share;

  perform public.lock_event_deletion_identity_keys(null, new.original_url, new.external_id);
  if public.is_event_collection_excluded(null, new.original_url, new.external_id) then
    raise exception 'event_collection_excluded: event source matches a durable deletion tombstone'
      using errcode = '23514', constraint = 'event_sources_not_tombstoned';
  end if;
  return new;
end;
$$;

create or replace function public.reject_tombstoned_event_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  locked_identity_key text;
begin
  if current_setting('role', true) = 'authenticated'
    and not (select public.is_admin())
  then
    return new;
  end if;

  -- Lock the event identity and every historical source identity in one bytewise order.
  -- This uses the same order as deletion/release and therefore cannot deadlock with an
  -- admin releasing a tombstone while another admin tries to publish the event.
  for locked_identity_key in
    select distinct_identity.identity_key
    from (
      select distinct identity.identity_key
      from (
        select
          new.slug as event_slug,
          new.source_url as source_url,
          null::text as external_id

        union all

        select
          null::text,
          source.original_url,
          source.external_id
        from public.event_sources as source
        where source.event_id = new.id
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

  if public.is_event_collection_excluded(new.slug, new.source_url, null)
    or exists (
      select 1
      from public.event_sources as source
      where source.event_id = new.id
        and public.is_event_collection_excluded(
          null,
          source.original_url,
          source.external_id
        )
    )
  then
    raise exception 'event_collection_excluded: event or source matches a durable deletion tombstone'
      using errcode = '23514', constraint = 'events_not_tombstoned';
  end if;

  return new;
end;
$$;

-- Use a statement trigger, rather than only row triggers, because PostgreSQL may lock
-- an existing conflict row before running the UPDATE branch of an upsert. One shared
-- lock also gives multi-statement collection/admin transactions a single lock order.
drop trigger if exists serialize_event_collection_mutations on public.events;
create trigger serialize_event_collection_mutations
before insert or delete or update of
  id,
  slug,
  title,
  summary,
  description,
  category,
  audiences,
  event_start_at,
  event_end_at,
  operating_hours,
  schedule_mode,
  application_start_at,
  application_end_at,
  location_name,
  address,
  latitude,
  longitude,
  location_source_url,
  location_verified_at,
  price_text,
  is_free,
  performer_people,
  performer_groups,
  organizer,
  organizer_url,
  contact,
  official_url,
  application_url,
  image_url,
  source_name,
  source_url,
  review_status,
  is_featured,
  is_demo,
  last_verified_at,
  published_at,
  created_at,
  updated_at
on public.events
for each statement execute function public.serialize_event_collection_mutations();

drop trigger if exists serialize_event_source_collection_mutations on public.event_sources;
create trigger serialize_event_source_collection_mutations
before insert or update or delete on public.event_sources
for each statement execute function public.serialize_event_collection_mutations();

drop trigger if exists serialize_event_occurrence_collection_mutations on public.event_occurrences;
create trigger serialize_event_occurrence_collection_mutations
before insert or update or delete on public.event_occurrences
for each statement execute function public.serialize_event_collection_mutations();

drop trigger if exists prevent_deleted_event_recollection on public.events;
create trigger prevent_deleted_event_recollection
before insert or update of slug, source_url on public.events
for each row execute function public.reject_tombstoned_event_insert();

drop trigger if exists prevent_deleted_event_publish on public.events;
create trigger prevent_deleted_event_publish
before update of review_status on public.events
for each row
when (
  new.review_status = 'published'
  and old.review_status is distinct from new.review_status
)
execute function public.reject_tombstoned_event_publish();

drop trigger if exists prevent_deleted_event_source_recollection on public.event_sources;
create trigger prevent_deleted_event_source_recollection
before insert or update of event_id, original_url, external_id on public.event_sources
for each row execute function public.reject_tombstoned_event_source_insert();

-- PostgreSQL grants EXECUTE to PUBLIC by default. Revoke every function explicitly,
-- then expose only the helpers/RPC that authenticated collection and admin flows need.
revoke all on function public.decode_event_url_component(text, boolean) from public, anon, authenticated, service_role;
revoke all on function public.canonicalize_event_url_path(text) from public, anon, authenticated, service_role;
revoke all on function public.normalize_event_source_url(text) from public, anon, authenticated, service_role;
revoke all on function public.extract_event_source_external_id(text) from public, anon, authenticated, service_role;
revoke all on function public.event_source_namespace(text) from public, anon, authenticated, service_role;
revoke all on function public.event_source_global_namespace(text) from public, anon, authenticated, service_role;
revoke all on function public.event_deletion_identity_key(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.event_deletion_identity_keys(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.lock_event_deletion_identity_keys(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.serialize_event_collection_mutations() from public, anon, authenticated, service_role;
revoke all on function public.is_event_collection_excluded(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.delete_event_and_exclude(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.release_event_collection_exclusion(uuid) from public, anon, authenticated, service_role;
revoke all on function public.create_event_with_source(jsonb, jsonb, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.reject_tombstoned_event_insert() from public, anon, authenticated, service_role;
revoke all on function public.reject_tombstoned_event_source_insert() from public, anon, authenticated, service_role;
revoke all on function public.reject_tombstoned_event_publish() from public, anon, authenticated, service_role;

grant execute on function public.decode_event_url_component(text, boolean) to authenticated;
grant execute on function public.canonicalize_event_url_path(text) to authenticated;
grant execute on function public.normalize_event_source_url(text) to authenticated;
grant execute on function public.extract_event_source_external_id(text) to authenticated;
grant execute on function public.event_source_namespace(text) to authenticated;
grant execute on function public.event_source_global_namespace(text) to authenticated;
grant execute on function public.event_deletion_identity_key(text, text, text) to authenticated;
grant execute on function public.event_deletion_identity_keys(text, text, text) to authenticated;
grant execute on function public.lock_event_deletion_identity_keys(text, text, text) to authenticated;
grant execute on function public.is_event_collection_excluded(text, text, text) to authenticated;
grant execute on function public.delete_event_and_exclude(uuid, text) to authenticated;
grant execute on function public.release_event_collection_exclusion(uuid) to authenticated;
grant execute on function public.create_event_with_source(jsonb, jsonb, timestamptz) to authenticated;

comment on table public.event_deletion_tombstones is
  '관리자가 삭제한 행사의 snapshot, 삭제 감사, 재수집 허용 감사를 삭제 없이 영구 보존한다.';
comment on column public.event_deletion_tombstones.event_snapshot is
  '삭제 직전 public.events 행 전체를 to_jsonb로 저장한 복구·감사용 snapshot.';
comment on column public.event_deletion_tombstones.deleted_by is
  '삭제를 승인한 auth 사용자 UUID. 사용자 계정 삭제 뒤에도 감사값을 보존하기 위해 FK를 두지 않는다.';
comment on column public.event_deletion_tombstones.released_at is
  'null이면 재수집 차단 중이며, 값이 있으면 관리자 RPC로 차단을 해제한 시각이다.';
comment on column public.event_deletion_tombstones.released_by is
  '재수집 차단을 해제한 auth 사용자 UUID. 감사값 보존을 위해 FK를 두지 않는다.';
comment on table public.event_deletion_identities is
  '삭제 행사 재수집을 차단하는 slug, 정규화 URL, 출처별 external ID의 영구 identity ledger.';
comment on column public.event_deletion_identities.identity_key is
  '종류·namespace·값으로 만든 비교 키. 중복 삭제도 각각 해제할 수 있도록 tombstone 안에서만 고유하다.';
comment on function public.decode_event_url_component(text, boolean) is
  'URL component의 percent encoding과 query plus-space 표현을 UTF-8 비교값으로 해석한다.';
comment on function public.canonicalize_event_url_path(text) is
  '경로 segment를 percent-decode한 UTF-8 hex로 표현하고 dot segment를 제거해 동등 URL을 비교한다.';
comment on function public.normalize_event_source_url(text) is
  '행사 원문 URL에서 fragment/tracking query/trailing slash 차이를 제거하고 query를 정렬한다.';
comment on function public.extract_event_source_external_id(text) is
  '지원 query key 또는 공식 path/file URL에서 수집처의 external ID를 추출한다.';
comment on function public.event_source_namespace(text) is
  'external ID 충돌을 막기 위해 host와 query/path 계열로 출처 namespace를 만든다.';
comment on function public.event_source_global_namespace(text) is
  '전역성이 명확한 source ID에만 host/query-key 보조 namespace를 만들어 route 변경을 견딘다.';
comment on function public.event_deletion_identity_keys(text, text, text) is
  'slug와 source URL 하나를 tombstone 비교용 identity 행 집합으로 확장한다.';
comment on function public.lock_event_deletion_identity_keys(text, text, text) is
  '삭제와 수집 경합을 직렬화하도록 정렬된 identity advisory transaction lock을 획득한다.';
comment on function public.serialize_event_collection_mutations() is
  '행사·출처·운영 회차 쓰기와 삭제가 교착 없이 한 순서로 처리되도록 statement 시작 시 transaction lock을 획득한다.';
comment on function public.is_event_collection_excluded(text, text, text) is
  '후보 slug/source/external ID 중 하나라도 삭제 identity와 일치하는지 확인한다.';
comment on function public.delete_event_and_exclude(uuid, text) is
  '관리자만 호출한다. 행사와 모든 출처 identity를 보존한 뒤 행사를 원자적으로 hard-delete한다.';
comment on function public.release_event_collection_exclusion(uuid) is
  '관리자만 호출한다. tombstone을 삭제하지 않고 released_at/released_by 감사값으로 차단을 해제한다.';
comment on function public.create_event_with_source(jsonb, jsonb, timestamptz) is
  '관리자만 호출한다. 신규 행사·첫 출처·운영 회차를 하나의 transaction으로 생성해 부분 저장과 삭제 identity 재수집을 막는다.';
