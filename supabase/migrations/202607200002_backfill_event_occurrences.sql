-- 공식 원문과 속초 행사포털 개별 회차로 확인한 비연속·반복 행사만 변환한다.
-- 모든 timestamp는 Asia/Seoul 벽시각과 +09 offset을 명시한다.

do $$
declare
  present_targets integer;
  matched_targets integer;
begin
  select count(*)
  into present_targets
  from public.events
  where id in (
    '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
    '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
    '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
    '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
  );

  select count(*)
  into matched_targets
  from public.events as event
  join (values
    ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, '2026년 풀이음친구랑 무비 나잇'::text),
    ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, '2026년 풀이음친구랑 Bloom Up'::text),
    ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026 속초시립박물관 지혜학교'::text),
    ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '청소년 시네마스쿨'::text)
  ) as target(id, title) on target.id = event.id and target.title = event.title;

  if present_targets <> 0 and (present_targets <> 4 or matched_targets <> 4) then
    raise exception 'Occurrence backfill aborted: expected four exact event id/title targets, found %', matched_targets;
  end if;
end;
$$;

delete from public.event_occurrences
where event_id in (
  '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
  '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
  '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
  '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
);

insert into public.event_occurrences (event_id, starts_at, ends_at)
select desired.event_id, desired.starts_at, desired.ends_at
from (values
  -- 2026년 풀이음친구랑 무비 나잇: 공식 안내 2회
  ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, '2026-07-22 19:00:00+09'::timestamptz, '2026-07-22 21:00:00+09'::timestamptz),
  ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, '2026-07-29 19:00:00+09'::timestamptz, '2026-07-29 21:00:00+09'::timestamptz),

  -- 2026년 풀이음친구랑 Bloom Up: 공식 안내 5회
  ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, '2026-07-23 10:00:00+09'::timestamptz, '2026-07-23 12:00:00+09'::timestamptz),
  ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, '2026-07-24 10:00:00+09'::timestamptz, '2026-07-24 12:00:00+09'::timestamptz),
  ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, '2026-07-27 10:00:00+09'::timestamptz, '2026-07-27 12:00:00+09'::timestamptz),
  ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, '2026-07-28 10:00:00+09'::timestamptz, '2026-07-28 12:00:00+09'::timestamptz),
  ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, '2026-07-29 10:00:00+09'::timestamptz, '2026-07-29 12:00:00+09'::timestamptz),

  -- 지혜학교: 행사포털 eventSeq 682~693의 실제 12회(8/12, 9/9 없음)
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-07-29 10:00:00+09'::timestamptz, '2026-07-29 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-08-05 10:00:00+09'::timestamptz, '2026-08-05 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-08-19 10:00:00+09'::timestamptz, '2026-08-19 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-08-26 10:00:00+09'::timestamptz, '2026-08-26 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-09-02 10:00:00+09'::timestamptz, '2026-09-02 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-09-16 10:00:00+09'::timestamptz, '2026-09-16 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-09-23 10:00:00+09'::timestamptz, '2026-09-23 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-09-30 10:00:00+09'::timestamptz, '2026-09-30 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-10-07 10:00:00+09'::timestamptz, '2026-10-07 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-10-14 10:00:00+09'::timestamptz, '2026-10-14 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-10-21 10:00:00+09'::timestamptz, '2026-10-21 13:00:00+09'::timestamptz),
  ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, '2026-10-28 10:00:00+09'::timestamptz, '2026-10-28 13:00:00+09'::timestamptz),

  -- 청소년 시네마스쿨: 8/5부터 매주 수요일 총 10회
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-08-05 16:00:00+09'::timestamptz, '2026-08-05 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-08-12 16:00:00+09'::timestamptz, '2026-08-12 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-08-19 16:00:00+09'::timestamptz, '2026-08-19 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-08-26 16:00:00+09'::timestamptz, '2026-08-26 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-09-02 16:00:00+09'::timestamptz, '2026-09-02 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-09-09 16:00:00+09'::timestamptz, '2026-09-09 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-09-16 16:00:00+09'::timestamptz, '2026-09-16 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-09-23 16:00:00+09'::timestamptz, '2026-09-23 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-09-30 16:00:00+09'::timestamptz, '2026-09-30 19:00:00+09'::timestamptz),
  ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, '2026-10-07 16:00:00+09'::timestamptz, '2026-10-07 19:00:00+09'::timestamptz)
) as desired(event_id, starts_at, ends_at)
join public.events as event on event.id = desired.event_id
on conflict (event_id, starts_at) do update set ends_at = excluded.ends_at;

update public.events
set schedule_mode = 'occurrences'
where id in (
  '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
  '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
  '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
  '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
);

do $$
declare
  invalid_count integer;
begin
  select count(*)
  into invalid_count
  from (values
    ('729b8b08-e935-40c7-a605-e158e875a322'::uuid, 2),
    ('51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid, 5),
    ('94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid, 12),
    ('0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid, 10)
  ) as expected(event_id, occurrence_count)
  join public.events as event on event.id = expected.event_id
  left join lateral (
    select count(*)::integer as actual_count
    from public.event_occurrences as occurrence
    where occurrence.event_id = expected.event_id
  ) as actual on true
  where actual.actual_count <> expected.occurrence_count
    or event.schedule_mode <> 'occurrences';

  if invalid_count <> 0 then
    raise exception 'Occurrence backfill verification failed for % target events', invalid_count;
  end if;
end;
$$;

-- Data rollback (run only after a snapshot and only for these four target events):
-- delete from public.event_occurrences where event_id in (<the four UUIDs above>);
-- update public.events set schedule_mode = 'continuous' where id in (<the four UUIDs above>);
