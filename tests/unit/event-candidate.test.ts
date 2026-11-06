import { describe, expect, it } from "vitest";
import { eventCandidateSchema } from "@/features/events/model/event";

const candidate = {
  title: "확인된 행사",
  summary: null,
  description: null,
  category: "education" as const,
  audiences: ["youth"] as const,
  eventStartAt: "2026-08-01T10:00:00+09:00",
  eventEndAt: null,
  operatingHours: null,
  applicationStartAt: null,
  applicationEndAt: null,
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
  sourceName: "공식 출처",
  sourceUrl: "https://example.com/event",
};

describe("eventCandidateSchema", () => {
  it("확인할 수 없는 값을 null로 둔 후보를 허용한다", () => {
    expect(eventCandidateSchema.safeParse(candidate).success).toBe(true);
  });

  it("잘못된 URL과 추측 범위를 벗어난 좌표를 거부한다", () => {
    const result = eventCandidateSchema.safeParse({ ...candidate, sourceUrl: "not-a-url", latitude: 120 });
    expect(result.success).toBe(false);
  });

  // 허용 프로토콜 전체 목록은 url.test.ts가 원본이다. 여기서는 모든 링크 필드가 그 경계를 쓰는지만 확인한다.
  it.each(["sourceUrl", "officialUrl", "applicationUrl", "imageUrl"])("후보의 %s에 javascript: URL을 넣으면 거부한다", (field) => {
    expect(eventCandidateSchema.safeParse({ ...candidate, [field]: "javascript:alert(1)" }).success).toBe(false);
  });

  it("기관 대표 홈을 행사 원문으로 허용하지 않는다", () => {
    const result = eventCandidateSchema.safeParse({ ...candidate, sourceUrl: "https://www.sokcho.go.kr/sc/portal" });
    expect(result.success).toBe(false);
  });
});
