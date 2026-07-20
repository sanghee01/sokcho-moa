import { describe, expect, it } from "vitest";
import { getDemoEvents } from "@/lib/data/demo-data";
import { filterEvents, parseEventFilters, sortEvents } from "@/lib/domain/event";

describe("parseEventFilters", () => {
  it("알 수 없는 URL 값은 버리고 유효한 필터만 보존한다", () => {
    expect(parseEventFilters({ when: "today", audience: "family", category: "invalid", free: "true" })).toEqual({
      when: "today",
      audience: "family",
      category: undefined,
      applicationOpen: undefined,
      query: undefined,
      sort: undefined,
    });
  });

  it("지원하는 정렬 파라미터만 허용한다", () => {
    expect(parseEventFilters({ sort: "latest" }).sort).toBe("latest");
    expect(parseEventFilters({ sort: "views" }).sort).toBe("views");
    expect(parseEventFilters({ sort: "published" }).sort).toBe("published");
    expect(parseEventFilters({ sort: "invalid" }).sort).toBeUndefined();
  });
});

describe("sortEvents", () => {
  it("조회순은 조회수가 많은 행사를 먼저 보여주고 동률이면 최신 공개 행사부터 보여준다", () => {
    const [first, second, third] = getDemoEvents();
    const events = [
      { ...first, viewCount: 12, publishedAt: "2026-07-18T00:00:00.000Z" },
      { ...second, viewCount: 45, publishedAt: "2026-07-10T00:00:00.000Z" },
      { ...third, viewCount: 12, publishedAt: "2026-07-19T00:00:00.000Z" },
    ];

    expect(sortEvents(events, "views").map((event) => event.slug)).toEqual([
      second.slug,
      third.slug,
      first.slug,
    ]);
  });

  it("최신순은 진행 중·가까운 예정·먼 예정·종료 행사 순서로 보여준다", () => {
    const [first, second, third, fourth] = getDemoEvents();
    const now = new Date("2026-07-20T00:00:00.000Z");
    const events = [
      { ...first, eventStartAt: "2026-09-01T00:00:00.000Z", eventEndAt: "2026-09-02T00:00:00.000Z" },
      { ...second, eventStartAt: "2026-07-22T00:00:00.000Z", eventEndAt: "2026-07-23T00:00:00.000Z" },
      { ...third, eventStartAt: "2026-07-18T00:00:00.000Z", eventEndAt: "2026-07-21T00:00:00.000Z" },
      { ...fourth, eventStartAt: "2026-07-10T00:00:00.000Z", eventEndAt: "2026-07-19T00:00:00.000Z" },
    ];

    expect(sortEvents(events, "latest", now).map((event) => event.slug)).toEqual([
      third.slug,
      second.slug,
      first.slug,
      fourth.slug,
    ]);
  });

  it("게시순은 공개일이 최신인 행사부터 보여준다", () => {
    const [first, second] = getDemoEvents();
    const events = [
      { ...first, publishedAt: "2026-07-01T00:00:00.000Z" },
      { ...second, publishedAt: "2026-07-20T00:00:00.000Z" },
    ];

    expect(sortEvents(events, "published").map((event) => event.slug)).toEqual([second.slug, first.slug]);
    expect(sortEvents(events).map((event) => event.slug)).toEqual([second.slug, first.slug]);
  });
});

describe("filterEvents", () => {
  it("카테고리, 대상, 검색어를 함께 적용한다", () => {
    const result = filterEvents(getDemoEvents(), {
      category: "festival",
      audience: "family",
      query: "바다빛",
    });
    expect(result.map((event) => event.slug)).toEqual(["demo-sea-family-festival"]);
  });

  it("신청 가능한 행사에 오늘 마감과 별도 신청 없음을 포함한다", () => {
    const now = new Date();
    const result = filterEvents(getDemoEvents(), { applicationOpen: true }, now);
    const slugs = result.map((event) => event.slug);
    expect(result.length).toBeGreaterThan(0);
    expect(slugs).toContain("demo-youth-media-class");
    expect(slugs).toContain("demo-sea-family-festival");
    expect(slugs).toContain("demo-mountain-exhibition");
    expect(slugs).not.toContain("demo-ended-winter-program");
  });

  it("선택 운영 행사는 행사기간 중간의 비운영일 날짜 필터에서 제외한다", () => {
    const events = getDemoEvents();
    const gapDay = new Date(Date.now() + 8 * 24 * 60 * 60 * 1_000);
    const slugs = filterEvents(events, { when: "today" }, gapDay).map((event) => event.slug);

    expect(slugs).not.toContain("demo-youth-media-class");
  });
});
