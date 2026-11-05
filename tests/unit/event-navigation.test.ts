import { describe, expect, it } from "vitest";
import {
  buildEventBrowseHref,
  clearEventFiltersHref,
  withEventBrowsePath,
} from "@/features/events/model/browse-url";

describe("event browse navigation", () => {
  it("다른 필터를 보존하면서 바꾼 값만 반영한다", () => {
    expect(buildEventBrowseHref(
      { category: "festival", audience: "family" },
      { sort: "views" },
    )).toBe("/?category=festival&audience=family&sort=views");
  });

  it("값을 비우면 해당 파라미터를 제거한다", () => {
    expect(buildEventBrowseHref(
      { category: "festival", audience: "family" },
      { audience: undefined },
    )).toBe("/?category=festival");
  });

  it("필터 초기화와 정렬 변경은 선택한 마감 탭을 유지한다", () => {
    expect(clearEventFiltersHref({
      status: "closed",
      category: "festival",
      q: "바다",
      sort: "views",
    })).toBe("/?status=closed&sort=views");

    expect(buildEventBrowseHref(
      { status: "closed", category: "festival" },
      { sort: "deadline" },
    )).toBe("/?status=closed&category=festival&sort=deadline");
  });

  it("대표 주제 경로에서 세부 필터와 정렬을 유지한다", () => {
    const params = withEventBrowsePath(
      { when: "month", audience: "family" },
      "/topics/festival",
    );

    expect(buildEventBrowseHref(params, { sort: "latest" }))
      .toBe("/topics/festival?when=month&audience=family&sort=latest");
    expect(buildEventBrowseHref(params, { status: "closed" }))
      .toBe("/topics/festival?when=month&audience=family&status=closed");
  });

  it("주제 경로의 필터 초기화는 대표 경로와 정렬을 보존한다", () => {
    const params = withEventBrowsePath(
      { q: "바다", when: "week", audience: "all", sort: "views" },
      "/topics/exhibition",
    );

    expect(clearEventFiltersHref(params)).toBe("/topics/exhibition?sort=views");
  });

  it("내부 경로 정보는 쿼리스트링에 노출하지 않는다", () => {
    expect(buildEventBrowseHref(
      withEventBrowsePath({}, "/topics/education"),
    )).toBe("/topics/education");
  });
});
