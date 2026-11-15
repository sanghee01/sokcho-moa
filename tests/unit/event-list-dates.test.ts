import { describe, expect, it } from "vitest";
import { formatShortDateRange, getShortDateRangeLabels } from "@/features/events/model/format";

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

// 상세 핵심 정보는 짧은 표기 옆에 기계가 읽는 서울 날짜(HTML time 요소)를 함께 둔다(2026-11-15).
describe("getShortDateRangeLabels", () => {
  it("화면 표기와 같은 글자에 서울 날짜를 붙인다", () => {
    expect(getShortDateRangeLabels("2026-10-03T00:00:00+09:00", "2026-11-21T23:59:59+09:00", MONDAY_NOON)).toEqual({
      start: { label: "10.3", dateTime: "2026-10-03" },
      end: { label: "11.21", dateTime: "2026-11-21" },
    });
  });

  it("하루 행사는 끝 날짜 없이 요일까지 한 덩어리로 둔다", () => {
    expect(getShortDateRangeLabels("2026-07-25T10:00:00+09:00", "2026-07-25T18:00:00+09:00", MONDAY_NOON)).toEqual({
      start: { label: "7.25 (토)", dateTime: "2026-07-25" },
      end: null,
    });
  });

  it("UTC로 전날인 시각도 서울 날짜로 붙이고, 해를 넘으면 연도를 보여 준다", () => {
    expect(getShortDateRangeLabels("2026-12-29T15:00:00.000Z", "2027-01-03T14:59:00.000Z", MONDAY_NOON)).toEqual({
      start: { label: "2026.12.30", dateTime: "2026-12-30" },
      end: { label: "2027.1.3", dateTime: "2027-01-03" },
    });
  });

  it("시작일이 없으면 null이다", () => {
    expect(getShortDateRangeLabels(null, null, MONDAY_NOON)).toBeNull();
  });
});
