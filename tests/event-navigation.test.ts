import { describe, expect, it } from "vitest";
import {
  buildEventBrowseHref,
  clearEventFiltersHref,
  isCalendarEventView,
} from "@/lib/domain/event-navigation";

describe("event browse navigation", () => {
  it("보기와 필터를 보존하면서 월만 바꾼다", () => {
    expect(buildEventBrowseHref(
      { view: "calendar", category: "festival", audience: "family", month: "2026-07" },
      { month: "2026-08" },
    )).toBe("/?view=calendar&category=festival&audience=family&month=2026-08");
  });

  it("목록으로 전환할 때 보기와 월 파라미터를 제거한다", () => {
    expect(buildEventBrowseHref(
      { view: "calendar", month: "2026-07", category: "festival" },
      { view: undefined, month: undefined },
    )).toBe("/?category=festival");
  });

  it("필터 초기화는 현재 보기와 월을 유지한다", () => {
    expect(clearEventFiltersHref({
      view: "calendar",
      month: "2026-07",
      q: "바다",
      category: "festival",
      sort: "views",
    })).toBe("/?view=calendar&month=2026-07&sort=views");
  });

  it("calendar 값만 캘린더 보기로 해석한다", () => {
    expect(isCalendarEventView({ view: "calendar" })).toBe(true);
    expect(isCalendarEventView({ view: "list" })).toBe(false);
    expect(isCalendarEventView({ view: "unknown" })).toBe(false);
  });
});
