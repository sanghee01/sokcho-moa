import { describe, expect, it } from "vitest";
import { buildEventPayload, buildEventSourcePayload } from "@/lib/admin/event-write";
import { eventFormSchema } from "@/lib/admin/schemas";

const legacyLocationForm = {
  slug: "test-event",
  title: "테스트 행사",
  introduction: "",
  category: "other" as const,
  audiences: ["all" as const],
  eventStartAt: "",
  eventEndAt: "",
  operatingHours: "",
  scheduleMode: "continuous" as const,
  occurrences: [],
  applicationStartAt: "",
  applicationEndAt: "",
  locationName: "행사장",
  address: "강원특별자치도 속초시",
  priceText: "",
  isFree: "unknown" as const,
  organizer: "",
  contact: "",
  applicationUrl: "",
  imageUrl: "",
  sourceName: "공식 출처",
  sourceUrl: "https://example.com/events/test-event",
  isFeatured: false,
  latitude: 38.2,
  longitude: 128.59,
  locationSourceUrl: "https://example.com/location",
  locationVerifiedAt: "2026-07-19T14:30",
  lastVerifiedAt: "2026-07-19T09:00",
};

describe("administrator event technical metadata preservation", () => {
  it("작성 폼 schema에서 더 이상 기술 위치 메타데이터를 받지 않는다", () => {
    const result = eventFormSchema.parse(legacyLocationForm);

    expect(result).not.toHaveProperty("latitude");
    expect(result).not.toHaveProperty("longitude");
    expect(result).not.toHaveProperty("locationSourceUrl");
    expect(result).not.toHaveProperty("locationVerifiedAt");
  });

  it("수정 payload가 기존 위치 메타데이터를 덮어쓰지 않는다", () => {
    const event = eventFormSchema.parse(legacyLocationForm);
    const payload = buildEventPayload(event, "2026-07-21T05:30:00.000Z");

    expect(payload).not.toHaveProperty("latitude");
    expect(payload).not.toHaveProperty("longitude");
    expect(payload).not.toHaveProperty("location_source_url");
    expect(payload).not.toHaveProperty("location_verified_at");
  });

  it("수정 payload가 기존 official_url을 덮어쓰지 않는다", () => {
    const event = eventFormSchema.parse(legacyLocationForm);
    const payload = buildEventPayload(event, "2026-07-21T05:30:00.000Z");

    expect(payload).not.toHaveProperty("official_url");
  });

  it("행사 소개만 단일 공개 소개값으로 저장한다", () => {
    const event = eventFormSchema.parse({ ...legacyLocationForm, introduction: "행사 소개" });
    const payload = buildEventPayload(event, "2026-07-21T05:30:00.000Z");

    expect(payload.summary).toBe("행사 소개");
    expect(payload).not.toHaveProperty("description");
  });

  it("새 행사는 좌표 없이 저장 payload를 만들 수 있다", () => {
    const event = eventFormSchema.parse({
      ...legacyLocationForm,
      latitude: undefined,
      longitude: undefined,
      locationSourceUrl: undefined,
      locationVerifiedAt: undefined,
    });

    expect(buildEventPayload(event, "2026-07-21T05:30:00.000Z").address).toBe("강원특별자치도 속초시");
  });

  it("행사와 출처에 같은 서버 확인 시각을 기록한다", () => {
    const event = eventFormSchema.parse(legacyLocationForm);
    const verifiedAt = "2026-07-21T05:30:00.000Z";

    expect(buildEventPayload(event, verifiedAt).last_verified_at).toBe(verifiedAt);
    expect(buildEventSourcePayload("event-id", event, verifiedAt).last_checked_at).toBe(verifiedAt);
  });
});
