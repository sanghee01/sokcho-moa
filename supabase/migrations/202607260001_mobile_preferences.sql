create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  categories public.event_category[] not null default '{}',
  audiences text[] not null default '{}',
  new_events_enabled boolean not null default false,
  closing_soon_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_categories_count
    check (cardinality(categories) <= 6),
  constraint notification_preferences_audiences
    check (
      cardinality(audiences) <= 5
      and audiences <@ array['child', 'youth', 'family', 'adult', 'all']::text[]
    )
);

create table if not exists public.saved_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists saved_events_event_idx
  on public.saved_events (event_id);

drop trigger if exists set_notification_preferences_updated_at
  on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.saved_events enable row level security;

drop policy if exists "Users manage own notification preferences"
  on public.notification_preferences;
create policy "Users manage own notification preferences"
on public.notification_preferences
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own saved events"
  on public.saved_events;
create policy "Users manage own saved events"
on public.saved_events
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.notification_preferences, public.saved_events from anon;
grant select, insert, update, delete
  on public.notification_preferences, public.saved_events
  to authenticated;

comment on table public.notification_preferences is
  '로그인 UI 없이 생성된 익명 Auth 사용자의 관심 분야·대상과 알림 동의. user_id 소유자만 접근한다.';
comment on table public.saved_events is
  '익명 Auth 사용자가 기기에서 저장한 행사. user_id 소유자만 접근하며 행사 삭제 시 함께 정리된다.';
