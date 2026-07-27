import { describe, expect, it } from "vitest";
import {
  createNotificationCandidates,
  isDryRun,
  type NotificationEvent,
  type NotificationPreference,
} from "@/supabase/functions/_shared/notification-policy";

const now = new Date("2026-07-26T00:00:00.000Z");
const events: NotificationEvent[] = [
  {
    id: "event-festival",
    slug: "summer-family-festival",
    title: "여름 가족 축제",
    category: "festival",
    audiences: ["family"],
    reviewStatus: "published",
    publishedAt: "2026-07-25T23:00:00.000Z",
    applicationEndAt: null,
  },
  {
    id: "event-education",
    slug: "youth-coding-class",
    title: "청소년 코딩 교실",
    category: "education",
    audiences: ["youth"],
    reviewStatus: "published",
    publishedAt: "2026-07-25T22:00:00.000Z",
    applicationEndAt: "2026-07-27T00:00:00.000Z",
  },
  {
    id: "event-old",
    slug: "old-family-festival",
    title: "지난 가족 축제",
    category: "festival",
    audiences: ["family"],
    reviewStatus: "published",
    publishedAt: "2026-07-20T00:00:00.000Z",
    applicationEndAt: "2026-08-10T00:00:00.000Z",
  },
  {
    id: "event-pending",
    slug: "pending-event",
    title: "검수 중 행사",
    category: "festival",
    audiences: ["all"],
    reviewStatus: "pending",
    publishedAt: "2026-07-25T23:00:00.000Z",
    applicationEndAt: "2026-07-27T00:00:00.000Z",
  },
];

function preference(
  overrides: Partial<NotificationPreference> = {},
): NotificationPreference {
  return {
    userId: "user-1",
    categories: ["festival"],
    audiences: ["family"],
    newEventsEnabled: true,
    closingSoonEnabled: true,
    ...overrides,
  };
}

describe("notification candidate policy", () => {
  it("matches selected interest dimensions without treating empty interests as all", () => {
    const candidates = createNotificationCandidates({
      events,
      preferences: [
        preference(),
        preference({
          userId: "user-2",
          categories: [],
          audiences: ["youth"],
          closingSoonEnabled: false,
        }),
        preference({
          userId: "user-3",
          categories: [],
          audiences: [],
          closingSoonEnabled: false,
        }),
      ],
      savedEvents: [],
      now,
    });

    expect(candidates.map((candidate) => candidate.dedupeKey)).toEqual([
      "new_event:user-1:event-festival",
      "new_event:user-2:event-education",
    ]);
  });

  it("creates closing reminders only for saved, published events inside the window", () => {
    const candidates = createNotificationCandidates({
      events,
      preferences: [preference({ newEventsEnabled: false })],
      savedEvents: [
        { userId: "user-1", eventId: "event-education" },
        { userId: "user-1", eventId: "event-education" },
        { userId: "user-1", eventId: "event-old" },
        { userId: "user-1", eventId: "event-pending" },
      ],
      now,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      userId: "user-1",
      eventId: "event-education",
      kind: "closing_soon",
      dedupeKey: "closing_soon:user-1:event-education:2026-07-27T00:00:00.000Z",
    });
  });

  it("keeps dedupe keys deterministic across repeated scans", () => {
    const input = {
      events,
      preferences: [preference()],
      savedEvents: [{ userId: "user-1", eventId: "event-education" }],
      now,
    };
    expect(createNotificationCandidates(input))
      .toEqual(createNotificationCandidates(input));
  });
});

describe("DRY_RUN gate", () => {
  it.each([undefined, null, "", "true", "TRUE", "0", "yes"])(
    "defaults %s to dry-run",
    (value) => {
      expect(isDryRun(value)).toBe(true);
    },
  );

  it("requires an explicit false value to allow the live branch", () => {
    expect(isDryRun("false")).toBe(false);
    expect(isDryRun(" FALSE ")).toBe(false);
  });
});
