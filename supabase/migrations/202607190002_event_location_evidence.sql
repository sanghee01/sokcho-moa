alter table public.events
  add column if not exists location_source_url text,
  add column if not exists location_verified_at timestamptz;

alter table public.events
  drop constraint if exists events_coordinates_pair,
  add constraint events_coordinates_pair check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null)
  ),
  drop constraint if exists events_location_evidence_pair,
  add constraint events_location_evidence_pair check (
    (location_source_url is null and location_verified_at is null) or
    (
      location_source_url is not null and
      location_verified_at is not null and
      latitude is not null and
      longitude is not null
    )
  ),
  drop constraint if exists events_location_source_url_format,
  add constraint events_location_source_url_format check (
    location_source_url is null or location_source_url ~ '^https?://'
  );

comment on column public.events.location_source_url is
  '행사 위치와 좌표를 확인한 공개 웹 근거 URL.';
comment on column public.events.location_verified_at is
  'location_source_url을 기준으로 위치와 좌표를 마지막 확인한 시각.';
