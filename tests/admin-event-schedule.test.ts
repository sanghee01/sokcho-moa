import { describe, expect, it } from "vitest";
import { eventFormSchema } from "@/lib/admin/schemas";

function form(overrides: Record<string, unknown> = {}) {
  return {
    slug: "structured-schedule",
    title: "구조화 일정 테스트",
    introduction: "",
    category: "education",
    audiences: ["all"],
    eventStartAt: "2026-07-22T09:00",
    eventEndAt: "2026-07-29T21:00",
    operatingHours: "7월 22일·29일 19:00~21:00",
    scheduleMode: "occurrences",
    occurrences: [
      { startsAt: "2026-07-22T19:00", endsAt: "2026-07-22T21:00" },
      { startsAt: "2026-07-29T19:00", endsAt: "2026-07-29T21:00" },
    ],
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
    sourceUrl: "https://example.com/events/structured-schedule",
    isFeatured: false,
    lastVerifiedAt: "",
    ...overrides,
  };
}

describe("administrator structured event schedule", () => {
  it("Asia/Seoul 회차 입력을 UTC ISO로 왕복 저장한다", () => {
    const parsed = eventFormSchema.parse(form());

    expect(parsed.scheduleMode).toBe("occurrences");
    expect(parsed.occurrences).toEqual([
      { startsAt: "2026-07-22T10:00:00.000Z", endsAt: "2026-07-22T12:00:00.000Z" },
      { startsAt: "2026-07-29T10:00:00.000Z", endsAt: "2026-07-29T12:00:00.000Z" },
    ]);
  });

  it("회차 모드에는 실제 운영 회차가 한 개 이상 필요하다", () => {
    const result = eventFormSchema.safeParse(form({ occurrences: [] }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "occurrences")).toBe(true);
  });

  it("회차 종료가 시작보다 빠르면 거부한다", () => {
    const result = eventFormSchema.safeParse(form({
      occurrences: [{ startsAt: "2026-07-22T21:00", endsAt: "2026-07-22T19:00" }],
    }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain("종료");
  });

  it("시간이 없는 회차는 해당 날짜 전체 일정으로 저장한다", () => {
    const parsed = eventFormSchema.parse(form({
      occurrences: [{ startsAt: "2026-07-22", endsAt: "2026-07-22" }],
    }));

    expect(parsed.occurrences).toEqual([{
      startsAt: "2026-07-21T15:00:00.000Z",
      endsAt: "2026-07-22T14:59:59.999Z",
    }]);
  });

  it("기존 연속 일정은 구조화 회차 없이도 안전하게 유지한다", () => {
    const parsed = eventFormSchema.parse(form({ scheduleMode: "continuous", occurrences: [] }));

    expect(parsed.scheduleMode).toBe("continuous");
    expect(parsed.occurrences).toEqual([]);
  });
});
