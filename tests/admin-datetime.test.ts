import { describe, expect, it } from "vitest";
import { combineDateAndOptionalTime, isoToSeoulDatetimeLocal, seoulDateOrDatetimeToIso, seoulDatetimeLocalToIso } from "@/lib/admin/datetime";
import { eventFormSchema } from "@/lib/admin/schemas";

describe("admin Asia/Seoul datetime round trip", () => {
  it("combines a separately entered date with an optional time", () => {
    expect(combineDateAndOptionalTime("2026-07-19", "")).toBe("2026-07-19");
    expect(combineDateAndOptionalTime("2026-07-19", "14:30")).toBe("2026-07-19T14:30");
    expect(combineDateAndOptionalTime("", "14:30")).toBe("T14:30");
  });

  it("interprets datetime-local as Korean wall time regardless of the server timezone", () => {
    expect(seoulDatetimeLocalToIso("2026-07-19T14:30")).toBe("2026-07-19T05:30:00.000Z");
    expect(isoToSeoulDatetimeLocal("2026-07-19T05:30:00.000Z")).toBe("2026-07-19T14:30");
    expect(seoulDatetimeLocalToIso("2026-01-01T00:15")).toBe("2025-12-31T15:15:00.000Z");
  });

  it("rejects normalized but impossible calendar dates", () => {
    expect(() => seoulDatetimeLocalToIso("2026-02-30T09:00")).toThrow("올바른 날짜");
    expect(() => seoulDateOrDatetimeToIso("2026-02-30")).toThrow("올바른 날짜");
  });

  it("accepts a date without a time and applies the requested day boundary", () => {
    expect(seoulDateOrDatetimeToIso("2026-07-19")).toBe("2026-07-18T15:00:00.000Z");
    expect(seoulDateOrDatetimeToIso("2026-07-19", "end")).toBe("2026-07-19T14:59:59.999Z");
  });

  it("uses the same conversion in the administrator event schema", () => {
    const parsed = eventFormSchema.parse({
      slug: "test-event",
      title: "테스트 행사",
      summary: "",
      description: "",
      category: "other",
      audiences: ["all"],
      eventStartAt: "2026-07-19T14:30",
      eventEndAt: "",
      operatingHours: "",
      applicationStartAt: "",
      applicationEndAt: "",
      locationName: "",
      address: "",
      latitude: null,
      longitude: null,
      locationSourceUrl: "",
      locationVerifiedAt: "",
      priceText: "",
      isFree: "unknown",
      organizer: "",
      contact: "",
      officialUrl: "",
      applicationUrl: "",
      imageUrl: "",
      sourceName: "공식 출처",
      sourceUrl: "https://example.com/event",
      isFeatured: false,
      lastVerifiedAt: "2026-07-19T09:00",
    });

    expect(parsed.eventStartAt).toBe("2026-07-19T05:30:00.000Z");
  });

  it("treats date-only starts as the beginning of the day and ends as the end of the day", () => {
    const parsed = eventFormSchema.parse({
      slug: "date-only-event",
      title: "날짜만 있는 행사",
      summary: "",
      description: "",
      category: "other",
      audiences: ["all"],
      eventStartAt: "2026-07-19",
      eventEndAt: "2026-07-20",
      operatingHours: "",
      applicationStartAt: "2026-07-01",
      applicationEndAt: "2026-07-18",
      locationName: "",
      address: "",
      latitude: null,
      longitude: null,
      locationSourceUrl: "",
      locationVerifiedAt: "",
      priceText: "",
      isFree: "unknown",
      organizer: "",
      contact: "",
      officialUrl: "",
      applicationUrl: "",
      imageUrl: "",
      sourceName: "공식 출처",
      sourceUrl: "https://example.com/events/date-only-event",
      isFeatured: false,
      lastVerifiedAt: "2026-07-19",
    });

    expect(parsed.eventStartAt).toBe("2026-07-18T15:00:00.000Z");
    expect(parsed.eventEndAt).toBe("2026-07-20T14:59:59.999Z");
    expect(parsed.applicationEndAt).toBe("2026-07-18T14:59:59.999Z");
  });
});
