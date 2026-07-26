import { describe, expect, it } from "vitest";
import { getDemoEvents } from "@/lib/data/demo-data";
import { getRelatedEvents, isEventClosedForDiscovery } from "@/lib/domain/event";

describe("getRelatedEvents", () => {
  it("이 행사도 살펴보세요에서 신청 마감·종료 행사를 추천하지 않는다", () => {
    const events = getDemoEvents();
    const current = events.find((event) => event.slug === "demo-sunset-concert");
    expect(current).toBeDefined();

    const now = new Date();
    const related = getRelatedEvents(current!, events, 4, now);

    expect(related.map((event) => event.slug)).not.toContain("demo-ended-winter-program");
    expect(related.every((event) => !isEventClosedForDiscovery(event, now))).toBe(true);
  });
});
