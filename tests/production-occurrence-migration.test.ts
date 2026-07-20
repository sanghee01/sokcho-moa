import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202607200002_backfill_event_occurrences.sql"),
  "utf8",
);
const valuesSection = migration.split("insert into public.event_occurrences (event_id, starts_at, ends_at)")[1]
  ?.split("on conflict (event_id, starts_at)")[0] ?? "";

const expected: Record<string, string[]> = {
  "729b8b08-e935-40c7-a605-e158e875a322": ["2026-07-22 19:00:00+09", "2026-07-29 19:00:00+09"],
  "51bcb313-3395-4171-b71d-33e4cb0ef3fd": [
    "2026-07-23 10:00:00+09",
    "2026-07-24 10:00:00+09",
    "2026-07-27 10:00:00+09",
    "2026-07-28 10:00:00+09",
    "2026-07-29 10:00:00+09",
  ],
  "94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6": [
    "2026-07-29 10:00:00+09",
    "2026-08-05 10:00:00+09",
    "2026-08-19 10:00:00+09",
    "2026-08-26 10:00:00+09",
    "2026-09-02 10:00:00+09",
    "2026-09-16 10:00:00+09",
    "2026-09-23 10:00:00+09",
    "2026-09-30 10:00:00+09",
    "2026-10-07 10:00:00+09",
    "2026-10-14 10:00:00+09",
    "2026-10-21 10:00:00+09",
    "2026-10-28 10:00:00+09",
  ],
  "0ad45614-75ec-4451-81ba-ee6c0c4de1ec": [
    "2026-08-05 16:00:00+09",
    "2026-08-12 16:00:00+09",
    "2026-08-19 16:00:00+09",
    "2026-08-26 16:00:00+09",
    "2026-09-02 16:00:00+09",
    "2026-09-09 16:00:00+09",
    "2026-09-16 16:00:00+09",
    "2026-09-23 16:00:00+09",
    "2026-09-30 16:00:00+09",
    "2026-10-07 16:00:00+09",
  ],
};

function insertedStartsFor(eventId: string) {
  const pattern = new RegExp(`\\('${eventId}'::uuid, '([^']+)'::timestamptz`, "g");
  return [...valuesSection.matchAll(pattern)].map((match) => match[1]);
}

describe("production occurrence backfill migration", () => {
  it("backfills only the four authoritative occurrence schedules with all 29 sessions", () => {
    for (const [eventId, startsAt] of Object.entries(expected)) {
      expect(insertedStartsFor(eventId)).toEqual(startsAt);
    }
    expect(Object.values(expected).reduce((total, values) => total + values.length, 0)).toBe(29);
    expect((valuesSection.match(/::uuid,/g) ?? [])).toHaveLength(29);
  });

  it("preserves the two proven 지혜학교 exception Wednesdays", () => {
    const wisdomStarts = insertedStartsFor("94ccb9f9-cf2c-4c2f-bba2-88e0a9da28d6");

    expect(wisdomStarts).not.toContain("2026-08-12 10:00:00+09");
    expect(wisdomStarts).not.toContain("2026-09-09 10:00:00+09");
  });

  it("is fail-closed, rerunnable, count-verified, and rollback-documented", () => {
    expect(migration).toContain("if present_targets <> 0 and (present_targets <> 4 or matched_targets <> 4) then");
    expect(migration).toContain("join public.events as event on event.id = desired.event_id");
    expect(migration).toContain("delete from public.event_occurrences");
    expect(migration).toContain("on conflict (event_id, starts_at) do update");
    expect(migration).toContain("if invalid_count <> 0 then");
    expect(migration).toContain("Data rollback");
    expect(migration).toContain("set schedule_mode = 'occurrences'");
  });
});
