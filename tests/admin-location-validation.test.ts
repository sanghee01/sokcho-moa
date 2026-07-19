import { describe, expect, it } from "vitest";
import { eventFormSchema } from "@/lib/admin/schemas";

const validForm = {
  slug: "test-event",
  title: "테스트 행사",
  summary: "",
  description: "",
  category: "other" as const,
  audiences: ["all" as const],
  eventStartAt: "",
  eventEndAt: "",
  operatingHours: "",
  applicationStartAt: "",
  applicationEndAt: "",
  locationName: "행사장",
  address: "강원특별자치도 속초시",
  latitude: 38.2,
  longitude: 128.59,
  locationSourceUrl: "https://example.com/location",
  locationVerifiedAt: "2026-07-19T14:30",
  priceText: "",
  isFree: "unknown" as const,
  organizer: "",
  contact: "",
  officialUrl: "",
  applicationUrl: "",
  imageUrl: "",
  sourceName: "공식 출처",
  sourceUrl: "https://example.com/event",
  isFeatured: false,
  lastVerifiedAt: "",
};

describe("administrator event location validation", () => {
  it("완전한 좌표와 위치 근거 쌍을 저장 형식으로 변환한다", () => {
    const result = eventFormSchema.parse(validForm);
    expect(result.locationSourceUrl).toBe("https://example.com/location");
    expect(result.locationVerifiedAt).toBe("2026-07-19T05:30:00.000Z");
  });

  it("위도 또는 경도만 입력한 값을 거부한다", () => {
    expect(eventFormSchema.safeParse({ ...validForm, longitude: null }).success).toBe(false);
    expect(eventFormSchema.safeParse({ ...validForm, latitude: null }).success).toBe(false);
  });

  it("위치 근거 URL과 확인 시각 중 하나만 입력한 값을 거부한다", () => {
    expect(eventFormSchema.safeParse({ ...validForm, locationVerifiedAt: "" }).success).toBe(false);
    expect(eventFormSchema.safeParse({ ...validForm, locationSourceUrl: "" }).success).toBe(false);
  });

  it("위치 근거가 있는데 좌표가 없으면 거부한다", () => {
    expect(eventFormSchema.safeParse({ ...validForm, latitude: null, longitude: null }).success).toBe(false);
  });

  it("좌표와 위치 근거를 모두 비운 값은 허용한다", () => {
    expect(eventFormSchema.safeParse({
      ...validForm,
      latitude: null,
      longitude: null,
      locationSourceUrl: "",
      locationVerifiedAt: "",
    }).success).toBe(true);
  });
});
