import { describe, expect, it } from "vitest";
import { selectPopularEvents } from "@/features/events/model/event-list";
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

  // 2026-11-06 사용자 결정: 누적 조회수가 아니라 7일 평균(누적 ÷ 올라온 뒤 지난 주 수)으로 고른다.
  // 오래전에 올라온 행사가 누적 조회수로 계속 1등을 하던 문제 때문이다.
  it("오래전에 올라와 누적 조회수가 많은 행사보다 7일 평균이 높은 최근 행사를 앞에 둔다", () => {
    const old = makeEvent({ slug: "old", viewCount: 300, publishedAt: "2026-01-01T00:00:00.000Z" }); // 약 28주 → 주 10회
    const recent = makeEvent({ slug: "recent", viewCount: 30, publishedAt: "2026-07-13T03:00:00.000Z" }); // 7일 → 주 30회
    expect(selectPopularEvents([old, recent], NOW).map((event) => event.slug)).toEqual(["recent", "old"]);
  });

  it("올라온 지 7일이 안 된 행사는 7일이 지난 것으로 친다", () => {
    const brandNew = makeEvent({ slug: "brand-new", viewCount: 5, publishedAt: "2026-07-19T03:00:00.000Z" }); // 1일 → 7일로 쳐서 주 5회
    const twoWeeks = makeEvent({ slug: "two-weeks", viewCount: 12, publishedAt: "2026-07-06T03:00:00.000Z" }); // 14일 → 주 6회
    expect(selectPopularEvents([brandNew, twoWeeks], NOW).map((event) => event.slug)).toEqual(["two-weeks", "brand-new"]);
  });
});
