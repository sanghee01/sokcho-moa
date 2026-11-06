import { describe, expect, it } from "vitest";
import { selectPopularEvents } from "@/features/events/model/event";
import { makeEvent, NOW } from "@/tests/unit/support/event-builder";

// 홈 위쪽 "지금 많이 보는 행사": 참여할 수 있는 행사 중 조회수가 많은 순서로 3개.
describe("selectPopularEvents", () => {
  it("참여할 수 있는 행사를 조회수가 많은 순서로 3개까지 고른다", () => {
    const events = [10, 50, 30, 40].map((viewCount, index) => makeEvent({ slug: `event-${viewCount}`, viewCount, eventStartAt: `2026-07-2${index}T00:00:00.000Z`, eventEndAt: "2026-07-29T00:00:00.000Z" }));
    expect(selectPopularEvents(events, NOW).map((event) => event.slug)).toEqual(["event-50", "event-40", "event-30"]);
  });

  it("끝났거나 신청이 마감된 행사와 아직 아무도 보지 않은 행사는 고르지 않는다", () => {
    const ended = makeEvent({ slug: "ended", viewCount: 999, eventStartAt: "2026-07-01T00:00:00.000Z", eventEndAt: "2026-07-05T00:00:00.000Z" });
    const applicationClosed = makeEvent({ slug: "closed", viewCount: 500, applicationEndAt: "2026-07-10T00:00:00.000Z" });
    const unseen = makeEvent({ slug: "unseen", viewCount: 0 });
    const seen = makeEvent({ slug: "seen", viewCount: 3 });
    expect(selectPopularEvents([ended, applicationClosed, unseen, seen], NOW).map((event) => event.slug)).toEqual(["seen"]);
  });

  it("조회수가 같으면 먼저 시작하는 행사를 앞에 둔다", () => {
    const later = makeEvent({ slug: "later", viewCount: 7, eventStartAt: "2026-07-24T00:00:00.000Z", eventEndAt: "2026-07-25T00:00:00.000Z" });
    const sooner = makeEvent({ slug: "sooner", viewCount: 7, eventStartAt: "2026-07-21T00:00:00.000Z", eventEndAt: "2026-07-22T00:00:00.000Z" });
    expect(selectPopularEvents([later, sooner], NOW).map((event) => event.slug)).toEqual(["sooner", "later"]);
  });
});
