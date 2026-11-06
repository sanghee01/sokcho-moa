import { describe, expect, it } from "vitest";
import { getRelatedEvents } from "@/features/events/model/event";
import { makeEvent, NOW } from "@/tests/unit/support/event-builder";

describe("getRelatedEvents", () => {
  it("이 행사도 살펴보세요에서 신청 마감·종료 행사를 추천하지 않는다", () => {
    const current = makeEvent({ slug: "current", category: "performance" });
    const ongoing = makeEvent({ slug: "ongoing", category: "performance" });
    const ended = makeEvent({
      slug: "ended",
      category: "performance",
      eventStartAt: "2026-07-01T00:00:00.000Z",
      eventEndAt: "2026-07-02T00:00:00.000Z",
    });
    const applicationClosed = makeEvent({
      slug: "application-closed",
      category: "performance",
      applicationEndAt: "2026-07-18T00:00:00.000Z",
      applicationUrl: "https://example.com/apply",
    });

    const related = getRelatedEvents(current, [current, ongoing, ended, applicationClosed], 4, NOW);

    expect(related.map((event) => event.slug)).toEqual(["ongoing"]);
  });
});
