-- `event_occurrences_unique_start` already creates the same btree index on
-- (event_id, starts_at), so retaining a second index only adds write overhead.
drop index if exists public.event_occurrences_event_start_idx;
