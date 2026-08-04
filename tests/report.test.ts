import { describe, expect, it } from "vitest";
import { eventReportDeleteSchema, eventReportReviewSchema, eventReportSchema } from "@/lib/domain/report";

describe("eventReportSchema", () => {
  it("제목, 본문, 링크로 제보할 수 있다", () => {
    const result = eventReportSchema.safeParse({
      title: "속초 여름 축제",
      body: "속초해수욕장에서 열리는 여름 축제입니다.",
      sourceUrl: "https://example.com/event",
      website: "",
    });

    expect(result.success).toBe(true);
  });

  it("비어 있거나 잘못된 링크와 봇용 숨김 필드 입력을 거부한다", () => {
    expect(eventReportSchema.safeParse({ title: "제보", body: "본문을 충분히 입력했습니다.", sourceUrl: "", website: "" }).success).toBe(false);
    expect(eventReportSchema.safeParse({ title: "제보", body: "본문을 충분히 입력했습니다.", sourceUrl: "not-a-url", website: "" }).success).toBe(false);
    expect(eventReportSchema.safeParse({ title: "제보", body: "본문을 충분히 입력했습니다.", sourceUrl: "https://example.com", website: "spam" }).success).toBe(false);
  });

  it.each(["javascript:alert(1)", "data:text/plain,hello", "file:///tmp/report", "ftp://example.com/report"])(
    "웹에서 안전하게 열 수 없는 %s 링크를 거부한다",
    (sourceUrl) => {
      expect(eventReportSchema.safeParse({
        title: "행사 제보",
        body: "본문을 충분히 입력했습니다.",
        sourceUrl,
        website: "",
      }).success).toBe(false);
    },
  );
});

describe("event report admin schemas", () => {
  const id = "00000000-0000-4000-8000-000000000001";

  it("검토 완료와 철회 상태만 허용한다", () => {
    expect(eventReportReviewSchema.safeParse({ id, status: "reviewed" }).success).toBe(true);
    expect(eventReportReviewSchema.safeParse({ id, status: "rejected" }).success).toBe(true);
    expect(eventReportReviewSchema.safeParse({ id, status: "pending" }).success).toBe(false);
  });

  it("삭제할 제보의 UUID를 검증한다", () => {
    expect(eventReportDeleteSchema.safeParse({ id }).success).toBe(true);
    expect(eventReportDeleteSchema.safeParse({ id: "invalid" }).success).toBe(false);
  });
});
