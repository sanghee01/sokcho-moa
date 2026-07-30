-- `summary` is the single public event introduction. Preserve the existing
-- summary where both values exist, and recover legacy description-only rows.
update public.events
set summary = description
where nullif(btrim(summary), '') is null
  and nullif(btrim(description), '') is not null;
