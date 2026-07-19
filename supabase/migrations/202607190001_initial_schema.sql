create extension if not exists pgcrypto;

do $$ begin
  create type public.event_category as enum ('performance', 'festival', 'experience', 'education', 'exhibition', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_review_status as enum ('pending', 'published', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  summary text,
  description text,
  category public.event_category not null,
  audiences text[] not null default '{}',
  event_start_at timestamptz,
  event_end_at timestamptz,
  operating_hours text,
  application_start_at timestamptz,
  application_end_at timestamptz,
  location_name text,
  address text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  price_text text,
  is_free boolean,
  organizer text,
  contact text,
  official_url text,
  application_url text,
  image_url text,
  source_name text not null,
  source_url text not null,
  review_status public.event_review_status not null default 'pending',
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  last_verified_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (event_end_at is null or (event_start_at is not null and event_end_at >= event_start_at)),
  constraint events_application_order check (
    application_start_at is null or application_end_at is null or application_end_at >= application_start_at
  ),
  constraint events_latitude check (latitude is null or latitude between -90 and 90),
  constraint events_longitude check (longitude is null or longitude between -180 and 180),
  constraint events_audiences check (audiences <@ array['child', 'youth', 'family', 'adult', 'all']::text[]),
  constraint events_published_fields check (
    review_status <> 'published' or (published_at is not null and event_start_at is not null)
  )
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 200),
  category text not null,
  summary text,
  address text,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  image_url text,
  official_url text,
  map_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  provider text not null,
  original_url text not null,
  external_id text,
  collected_at timestamptz not null default now(),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, provider, original_url)
);

create index if not exists events_public_date_idx on public.events (event_start_at, event_end_at)
  where review_status = 'published';
create index if not exists events_application_idx on public.events (application_end_at)
  where review_status = 'published';
create index if not exists events_category_idx on public.events (category);
create index if not exists events_audiences_gin_idx on public.events using gin (audiences);
create index if not exists places_public_idx on public.places (is_published, name);
create index if not exists event_sources_event_idx on public.event_sources (event_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_places_updated_at on public.places;
create trigger set_places_updated_at before update on public.places
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.events enable row level security;
alter table public.places enable row level security;
alter table public.event_sources enable row level security;

drop policy if exists "Published events are public" on public.events;
create policy "Published events are public" on public.events
for select to anon, authenticated
using (review_status = 'published');

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Published places are public" on public.places;
create policy "Published places are public" on public.places
for select to anon, authenticated
using (is_published = true);

drop policy if exists "Admins manage places" on public.places;
create policy "Admins manage places" on public.places
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Sources of published events are public" on public.event_sources;
create policy "Sources of published events are public" on public.event_sources
for select to anon, authenticated
using (exists (
  select 1 from public.events where events.id = event_sources.event_id and events.review_status = 'published'
));

drop policy if exists "Admins manage event sources" on public.event_sources;
create policy "Admins manage event sources" on public.event_sources
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.events, public.places, public.event_sources to anon, authenticated;
grant insert, update, delete on public.events, public.places, public.event_sources to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Event images are public" on storage.objects;
create policy "Event images are public" on storage.objects
for select to anon, authenticated
using (bucket_id = 'event-images');

drop policy if exists "Admins upload event images" on storage.objects;
create policy "Admins upload event images" on storage.objects
for insert to authenticated
with check (bucket_id = 'event-images' and (select public.is_admin()));

drop policy if exists "Admins update event images" on storage.objects;
create policy "Admins update event images" on storage.objects
for update to authenticated
using (bucket_id = 'event-images' and (select public.is_admin()))
with check (bucket_id = 'event-images' and (select public.is_admin()));

drop policy if exists "Admins delete event images" on storage.objects;
create policy "Admins delete event images" on storage.objects
for delete to authenticated
using (bucket_id = 'event-images' and (select public.is_admin()));

comment on table public.events is '속초모아 행사. pending 후보는 시작일이 null일 수 있고, 공개 시에는 시작일과 published_at이 필수다. 행사/신청 상태는 날짜 필드에서 애플리케이션이 계산한다.';
comment on column public.events.is_demo is 'true이면 UI 확인용 샘플이며 실제 운영 정보가 아니다.';
comment on table public.admin_users is 'Auth 사용자를 단일 운영자로 허용하는 명시적 allow-list.';
comment on table public.event_sources is '행사별 원문 이력. 같은 행사·제공자·URL 조합만 중복 방지하며 출처 변경 이력은 보존한다.';
