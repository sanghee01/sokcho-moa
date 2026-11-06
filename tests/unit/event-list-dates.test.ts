import { describe, expect, it } from "vitest";
import { formatShortDateRange } from "@/features/events/model/format";

// 목록 화면(.ai/DESIGN.md 3단계)의 짧은 날짜 표기를 확인한다. 모든 기준 시각은 KST로 적는다.
function kst(value: string) {
  return new Date(`${value}+09:00`);
}
const MONDAY_NOON = kst("2026-07-20T12:00:00"); // 2026-07-20은 월요일

describe("formatShortDateRange", () => {
  it("하루 행사는 월.일 (요일)로 보여 준다", () => {
    expect(formatShortDateRange("2026-07-25T10:00:00+09:00", null, MONDAY_NOON)).toBe("7.25 (토)");
    expect(formatShortDateRange("2026-07-25T10:00:00+09:00", "2026-07-25T18:00:00+09:00", MONDAY_NOON)).toBe("7.25 (토)");
  });

  it("여러 날 행사는 시작 – 끝으로 보여 준다", () => {
    expect(formatShortDateRange("2026-10-03T00:00:00+09:00", "2026-11-21T23:59:59+09:00", MONDAY_NOON)).toBe("10.3 – 11.21");
  });

  it("UTC로는 전날이어도 KST 날짜로 보여 준다", () => {
    expect(formatShortDateRange("2026-07-24T15:30:00.000Z", null, MONDAY_NOON)).toBe("7.25 (토)");
  });

  it("올해가 아닌 날짜가 섞이면 연도를 붙인다", () => {
    expect(formatShortDateRange("2026-12-30T00:00:00+09:00", "2027-01-04T00:00:00+09:00", MONDAY_NOON)).toBe("2026.12.30 – 2027.1.4");
  });

  it("시작일이 없으면 확인이 필요하다고 보여 준다", () => {
    expect(formatShortDateRange(null, null, MONDAY_NOON)).toBe("날짜 확인 필요");
  });
});
