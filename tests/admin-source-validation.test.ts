import { describe, expect, it } from "vitest";
import { eventFormSchema } from "@/lib/admin/schemas";

function form(sourceUrl: string) {
  return {
    slug: "operator-source-url",
    title: "운영자 링크 검증 행사",
    summary: "",
    description: "",
    category: "other",
    audiences: ["all"],
    eventStartAt: "",
    eventEndAt: "",
    operatingHours: "",
    scheduleMode: "continuous",
    occurrences: [],
    applicationStartAt: "",
    applicationEndAt: "",
    locationName: "",
    address: "",
    priceText: "",
    isFree: "unknown",
    organizer: "",
    contact: "",
    applicationUrl: "",
    imageUrl: "",
    sourceName: "공식 출처",
    sourceUrl,
    isFeatured: false,
  };
}

describe("administrator event source URL", () => {
  it("운영자가 입력한 HTTPS URL은 경로 허용 목록 없이 저장한다", () => {
    const sourceUrl = "https://official.example.com/new-board/custom-event-view?id=2026";

    expect(eventFormSchema.parse(form(sourceUrl)).sourceUrl).toBe(sourceUrl);
  });

  it("공개 화면에 연결할 비 HTTPS URL은 거부한다", () => {
    const result = eventFormSchema.safeParse(form("http://official.example.com/events/2026"));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain("HTTPS");
  });
});
