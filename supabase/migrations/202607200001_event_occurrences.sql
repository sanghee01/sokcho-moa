-- 구조화된 운영 회차를 추가한다. 행사 전체 기간과 사람이 읽는 운영일정 문구는 그대로 보존한다.
alter table public.events
  add column if not exists schedule_mode text not null default 'continuous';

alter table public.events
  drop constraint if exists events_schedule_mode_check;
alter table public.events
  add constraint events_schedule_mode_check
  check (schedule_mode in ('continuous', 'occurrences'));

create table if not exists public.event_occurrences (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint event_occurrences_time_order check (ends_at is null or ends_at >= starts_at),
  constraint event_occurrences_unique_start unique (event_id, starts_at)
);

create index if not exists event_occurrences_event_start_idx
  on public.event_occurrences (event_id, starts_at);

alter table public.event_occurrences enable row level security;

drop policy if exists "Occurrences of published events are public" on public.event_occurrences;
create policy "Occurrences of published events are public" on public.event_occurrences
for select to anon, authenticated
using (exists (
  select 1
  from public.events
  where events.id = event_occurrences.event_id
    and events.review_status = 'published'
));

drop policy if exists "Admins manage event occurrences" on public.event_occurrences;
create policy "Admins manage event occurrences" on public.event_occurrences
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.event_occurrences to anon, authenticated;
grant insert, update, delete on public.event_occurrences to authenticated;

-- 한 행사의 회차 교체는 삭제와 삽입을 한 트랜잭션으로 묶어 중간 상태를 노출하지 않는다.
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

comment on column public.events.schedule_mode is 'continuous이면 행사기간 전체, occurrences이면 구조화된 실제 회차만 캘린더 운영일로 사용한다.';
comment on table public.event_occurrences is '선택일·반복·복수 회차를 자유문장 파싱 없이 표현하는 실제 운영 회차.';

-- 운영 적용 전 events/event_occurrences snapshot을 확보한다. 복구 시에는 이 migration의
-- 함수·정책·테이블을 제거한 뒤 events.schedule_mode를 제거할 수 있다. 운영 데이터 backfill은
-- 공식 일정 검증 후 별도 migration으로 수행한다.
