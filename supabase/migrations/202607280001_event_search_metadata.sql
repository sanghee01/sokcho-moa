alter table public.events
  add column if not exists performer_people text[] not null default '{}',
  add column if not exists performer_groups text[] not null default '{}',
  add column if not exists organizer_url text;

alter table public.events
  drop constraint if exists events_performer_people_nonempty,
  add constraint events_performer_people_nonempty
    check (array_position(performer_people, '') is null and cardinality(performer_people) <= 50),
  drop constraint if exists events_performer_groups_nonempty,
  add constraint events_performer_groups_nonempty
    check (array_position(performer_groups, '') is null and cardinality(performer_groups) <= 50);
