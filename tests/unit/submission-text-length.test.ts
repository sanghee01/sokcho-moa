import { describe, expect, it } from "vitest";
import { eventReportSchema } from "@/features/reports/schemas";
import { siteFeedbackSchema } from "@/features/feedback/schemas";

// DB는 char_length(코드 포인트 수)로 길이를 센다. zod 4도 코드 포인트로 센다(checks.js codePointLength).
// 라이브러리를 바꾸거나 길이 검사를 직접 구현할 때 이 기준이 어긋나지 않게 지킨다.
const body = "본문을 열 글자 이상 적습니다.";

describe("제보·의견 글자 수는 DB와 같은 기준으로 센다", () => {
  it("이모지 하나짜리 제목은 1자이므로 거부한다(2자 이상)", () => {
    expect(eventReportSchema.safeParse({ title: "🎉", body, sourceUrl: "https://example.com" }).success).toBe(false);
    expect(siteFeedbackSchema.safeParse({ title: "🎉", body, linkUrl: "" }).success).toBe(false);
  });

  it("이모지 200개 제목은 200자이므로 받는다", () => {
    const title = "🎉".repeat(200);
    expect(eventReportSchema.safeParse({ title, body, sourceUrl: "https://example.com" }).success).toBe(true);
    expect(siteFeedbackSchema.safeParse({ title, body, linkUrl: "" }).success).toBe(true);
  });
});
