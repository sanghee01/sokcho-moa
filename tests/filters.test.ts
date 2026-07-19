import { describe, expect, it } from "vitest";
import { getDemoEvents } from "@/lib/data/demo-data";
import { filterEvents, parseEventFilters } from "@/lib/domain/event";

describe("parseEventFilters", () => {
  it("알 수 없는 URL 값은 버리고 유효한 필터만 보존한다", () => {
    expect(parseEventFilters({ when: "today", audience: "family", category: "invalid", free: "true" })).toEqual({
      when: "today",
      audience: "family",
      category: undefined,
      free: true,
      applicationOpen: undefined,
      query: undefined,
    });
  });
});

describe("filterEvents", () => {
  it("카테고리, 대상, 무료, 검색어를 함께 적용한다", () => {
    const result = filterEvents(getDemoEvents(), {
      category: "festival",
      audience: "family",
      free: true,
      query: "바다빛",
    });
    expect(result.map((event) => event.slug)).toEqual(["demo-sea-family-festival"]);
  });

  it("신청 가능한 행사에 오늘 마감을 포함한다", () => {
    const now = new Date();
    const result = filterEvents(getDemoEvents(), { applicationOpen: true }, now);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((event) => event.applicationEndAt == null || new Date(event.applicationEndAt) >= now)).toBe(true);
  });
});
