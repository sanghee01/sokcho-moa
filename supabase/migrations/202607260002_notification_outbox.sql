create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique
    check (char_length(expo_push_token) between 20 and 512),
  platform text not null check (platform in ('ios', 'android')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('new_event', 'closing_soon')),
  dedupe_key text not null unique check (char_length(dedupe_key) between 1 and 500),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 500),
  data jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'dry_run', 'sent', 'failed', 'skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lock_id uuid,
  locked_at timestamptz,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.notification_outbox(id) on delete cascade,
  device_id uuid not null references public.push_devices(id) on delete cascade,
  status text not null
    check (status in ('processing', 'dry_run', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_code text,
  attempted_at timestamptz not null default now(),
  unique (outbox_id, device_id)
);

create index if not exists push_devices_user_active_idx
  on public.push_devices (user_id, enabled)
  where invalidated_at is null;
create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (scheduled_for, created_at)
  where status in ('pending', 'processing');
create index if not exists notification_deliveries_outbox_idx
  on public.notification_deliveries (outbox_id);

drop trigger if exists set_push_devices_updated_at on public.push_devices;
create trigger set_push_devices_updated_at
before update on public.push_devices
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_outbox_updated_at
  on public.notification_outbox;
create trigger set_notification_outbox_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

alter table public.push_devices enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "Users manage own push devices" on public.push_devices;
create policy "Users manage own push devices"
on public.push_devices
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.push_devices from anon;
grant select, insert, update, delete on public.push_devices to authenticated;

revoke all on public.notification_outbox, public.notification_deliveries
  from anon, authenticated;
grant select, insert, update, delete
  on public.notification_outbox, public.notification_deliveries
  to service_role;
grant select
  on public.events, public.notification_preferences, public.saved_events,
    public.push_devices
  to service_role;

create or replace function public.claim_notification_outbox(
  p_batch_limit integer default 100,
  p_claim_id uuid default gen_random_uuid()
)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service_role required';
  end if;

  return query
  with claimable as (
    select candidate.id
    from public.notification_outbox as candidate
    where candidate.scheduled_for <= now()
      and (
        candidate.status = 'pending'
        or (
          candidate.status = 'processing'
          and candidate.locked_at < now() - interval '15 minutes'
        )
      )
    order by candidate.scheduled_for, candidate.created_at
    for update skip locked
    limit least(greatest(p_batch_limit, 1), 500)
  )
  update public.notification_outbox as outbox
  set
    status = 'processing',
    lock_id = p_claim_id,
    locked_at = now(),
    attempt_count = outbox.attempt_count + 1,
    last_error = null
  from claimable
  where outbox.id = claimable.id
  returning outbox.*;
end;
$$;

revoke all on function public.claim_notification_outbox(integer, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_notification_outbox(integer, uuid)
  to service_role;

comment on table public.push_devices is
  '익명 Auth 사용자와 연결된 Expo push token. 실제 토큰 등록은 출시 자격증명 준비 후 활성화한다.';
comment on table public.notification_outbox is
  '결정론적 dedupe key로 한 번만 생성되는 알림 작업. Edge Function은 원자적으로 claim한다.';
comment on table public.notification_deliveries is
  'outbox와 device 조합당 한 행만 허용하는 전송 또는 DRY_RUN 기록.';
