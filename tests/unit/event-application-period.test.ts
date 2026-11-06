import { describe, expect, it } from "vitest";
import { formatApplicationPeriod } from "@/features/events/model/format";

// 상세 핵심 정보(.ai/DESIGN.md 4단계)의 신청 기간 표기. 목록과 같은 짧은 날짜 표기를 쓴다. 기준 시각은 KST로 적는다.
const MONDAY_NOON = new Date("2026-07-20T12:00:00+09:00");

describe("formatApplicationPeriod", () => {
  it("시작과 마감이 다른 날이면 시작 – 마감으로 보여 준다", () => {
    expect(formatApplicationPeriod("2026-07-01T09:00:00+09:00", "2026-07-24T18:00:00+09:00", MONDAY_NOON)).toBe("7.1 – 7.24");
  });

  it("마감만 있으면 마감일까지로 보여 준다", () => {
    expect(formatApplicationPeriod(null, "2026-07-24T18:00:00+09:00", MONDAY_NOON)).toBe("7.24 (금)까지");
  });

  it("시작만 있으면 시작일부터로 보여 준다", () => {
    expect(formatApplicationPeriod("2026-07-01T09:00:00+09:00", null, MONDAY_NOON)).toBe("7.1 (수)부터");
  });

  it("신청 기간이 없으면 null이다", () => {
    expect(formatApplicationPeriod(null, null, MONDAY_NOON)).toBeNull();
  });
});
