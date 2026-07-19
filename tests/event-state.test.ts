import { describe, expect, it } from "vitest";
import { deriveApplicationState, deriveEventState, type Event } from "@/lib/domain/event";

const baseEvent: Event = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "test-event",
  title: "테스트 행사",
  summary: null,
  description: null,
  category: "experience",
  audiences: ["all"],
  eventStartAt: "2026-07-19T01:00:00+09:00",
  eventEndAt: "2026-07-19T18:00:00+09:00",
  operatingHours: null,
  applicationStartAt: "2026-07-01T00:00:00+09:00",
  applicationEndAt: "2026-07-19T23:59:59+09:00",
  locationName: null,
  address: null,
  latitude: null,
  longitude: null,
  priceText: null,
  isFree: null,
  organizer: null,
  contact: null,
  officialUrl: null,
  applicationUrl: null,
  imageUrl: null,
  sourceName: "테스트",
  sourceUrl: "https://example.com",
  reviewStatus: "published",
  isFeatured: false,
  isDemo: true,
  lastVerifiedAt: null,
  publishedAt: "2026-07-01T00:00:00+09:00",
};

describe("deriveEventState", () => {
  it("행사 전·진행 중·종료를 날짜에서 계산한다", () => {
    expect(deriveEventState(baseEvent, new Date("2026-07-18T12:00:00+09:00"))).toBe("upcoming");
    expect(deriveEventState(baseEvent, new Date("2026-07-19T12:00:00+09:00"))).toBe("ongoing");
    expect(deriveEventState(baseEvent, new Date("2026-07-20T00:00:00+09:00"))).toBe("ended");
  });
});

describe("deriveApplicationState", () => {
  it("한국 날짜 기준 오늘 마감을 표시한다", () => {
    expect(deriveApplicationState(baseEvent, new Date("2026-07-19T11:00:00+09:00"))).toBe("closing_today");
  });

  it("별도 신청 정보가 없으면 not_applicable이다", () => {
    expect(deriveApplicationState({ applicationStartAt: null, applicationEndAt: null, applicationUrl: null })).toBe("not_applicable");
  });
});
