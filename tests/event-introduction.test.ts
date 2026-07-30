import { describe, expect, it } from "vitest";
import { getEventIntroduction, type Event } from "@/lib/domain/event";

const event = { summary: null, description: "기존 행사 소개" } as Pick<Event, "summary" | "description">;

describe("event introduction", () => {
  it("기존 소개만 있는 행사는 그 내용을 공개 소개로 사용한다", () => {
    expect(getEventIntroduction(event)).toBe("기존 행사 소개");
  });

  it("통합 후 입력한 소개를 우선 사용한다", () => {
    expect(getEventIntroduction({ ...event, summary: "새 행사 소개" })).toBe("새 행사 소개");
  });
});
