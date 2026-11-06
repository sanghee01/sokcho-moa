-- Run only when rolling back migrations 202607200001 and 202607200002.
-- The transaction aborts if an administrator has since added occurrences for another event.
begin;

update public.events
set schedule_mode = 'continuous'
where id in (
  '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
  '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
  '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
  '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
);

delete from public.event_occurrences
where event_id in (
  '729b8b08-e935-40c7-a605-e158e875a322'::uuid,
  '51bcb313-3395-4171-b71d-33e4cb0ef3fd'::uuid,
  '94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6'::uuid,
  '0ad45614-75ec-4451-81ba-ee6c0c4de1ec'::uuid
);

do $$
declare
  protected_occurrences integer;
begin
  select count(*) into protected_occurrences from public.event_occurrences;
  if protected_occurrences <> 0 then
    raise exception 'Rollback aborted: % non-backfill occurrences must be preserved', protected_occurrences;
  end if;
end;
$$;

drop function if exists public.replace_event_occurrences(uuid, jsonb);
drop table public.event_occurrences;
alter table public.events drop constraint if exists events_schedule_mode_check;
alter table public.events drop column if exists schedule_mode;

commit;
