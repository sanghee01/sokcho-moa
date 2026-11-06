import { describe, expect, it } from "vitest";
import { isRecentlyPublished } from "@/features/events/model/event";
import { makeEvent, NOW } from "./support/event-builder";

// "새로 올라옴" 표시: 속초모아에 공개된 지 7일이 지나지 않은 행사. 기준은 행사 날짜가 아니라 published_at(사이트에 올라온 시각)이다.
describe("isRecentlyPublished", () => {
  it("공개된 지 7일이 지나지 않았으면 새로 올라온 행사다", () => {
    expect(isRecentlyPublished(makeEvent({ publishedAt: "2026-07-19T03:00:00.000Z" }), NOW)).toBe(true);
    expect(isRecentlyPublished(makeEvent({ publishedAt: "2026-07-13T03:00:00.001Z" }), NOW)).toBe(true);
  });

  it("공개된 지 7일이 지나면 새로 올라온 행사가 아니다", () => {
    expect(isRecentlyPublished(makeEvent({ publishedAt: "2026-07-13T03:00:00.000Z" }), NOW)).toBe(false);
  });

  it("행사가 오래전에 시작했어도 늦게 공개됐으면 새로 올라온 행사다", () => {
    const lateCollected = makeEvent({ eventStartAt: "2026-06-01T00:00:00.000Z", eventEndAt: "2026-08-31T00:00:00.000Z", publishedAt: "2026-07-20T01:00:00.000Z" });
    expect(isRecentlyPublished(lateCollected, NOW)).toBe(true);
  });

  it("공개 시각이 없으면 새로 올라온 행사로 보지 않는다", () => {
    expect(isRecentlyPublished(makeEvent({ publishedAt: null }), NOW)).toBe(false);
  });
});
