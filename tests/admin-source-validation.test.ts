import { describe, expect, it } from "vitest";
import { eventFormSchema } from "@/lib/admin/schemas";

function form(sourceUrl: string) {
  return {
    slug: "operator-source-url",
    title: "운영자 링크 검증 행사",
    introduction: "",
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

  it("형식이 아닌 문자열도 예외 없이 검증 오류로 반환한다", () => {
    expect(() => eventFormSchema.safeParse(form("not-a-url"))).not.toThrow();
    expect(eventFormSchema.safeParse(form("not-a-url")).success).toBe(false);
  });

  it.each(["javascript:alert(1)", "data:text/plain,hello", "file:///tmp/event", "ftp://official.example.com/event"])(
    "운영자 폼의 %s URL을 거부한다",
    (sourceUrl) => {
      expect(eventFormSchema.safeParse(form(sourceUrl)).success).toBe(false);
      expect(eventFormSchema.safeParse({ ...form("https://official.example.com/event"), applicationUrl: sourceUrl }).success).toBe(false);
      expect(eventFormSchema.safeParse({ ...form("https://official.example.com/event"), imageUrl: sourceUrl }).success).toBe(false);
      expect(eventFormSchema.safeParse({ ...form("https://official.example.com/event"), organizerUrl: sourceUrl }).success).toBe(false);
    },
  );
});
