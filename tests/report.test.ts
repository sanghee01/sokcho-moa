import { describe, expect, it } from "vitest";
import { eventReportSchema } from "@/lib/domain/report";

describe("eventReportSchema", () => {
  it("제목과 본문만으로 제보할 수 있다", () => {
    const result = eventReportSchema.safeParse({
      title: "속초 여름 축제",
      body: "속초해수욕장에서 열리는 여름 축제입니다.",
      sourceUrl: "",
      website: "",
    });

    expect(result.success).toBe(true);
  });

  it("잘못된 링크와 봇용 숨김 필드 입력을 거부한다", () => {
    expect(eventReportSchema.safeParse({ title: "제보", body: "본문을 충분히 입력했습니다.", sourceUrl: "not-a-url", website: "" }).success).toBe(false);
    expect(eventReportSchema.safeParse({ title: "제보", body: "본문을 충분히 입력했습니다.", sourceUrl: "", website: "spam" }).success).toBe(false);
  });
});
