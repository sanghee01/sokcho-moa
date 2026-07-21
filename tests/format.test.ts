import { describe, expect, it } from "vitest";
import { formatDate, formatDateRange, formatDateTime, formatOperatingSchedule } from "@/lib/domain/format";

describe("공식 행사 날짜 표시", () => {
  it("서울 시간대의 날짜를 YYYY.MM.DD로 표시한다", () => {
    expect(formatDate("2026-07-21T15:00:00Z")).toBe("2026.07.22");
  });

  it("단일일은 한 번, 다일은 물결표 범위로 표시한다", () => {
    expect(formatDateRange("2026-07-22T10:00:00+09:00", "2026-07-22T21:00:00+09:00")).toBe("2026.07.22");
    expect(formatDateRange("2026-07-22T10:00:00+09:00", "2026-07-29T21:00:00+09:00")).toBe("2026.07.22 ~ 2026.07.29");
  });

  it("신청기간 한쪽 날짜만 있어도 확인 필요를 범위에 섞지 않는다", () => {
    expect(formatDateRange(null, "2026-07-29T18:00:00+09:00")).toBe("2026.07.29");
    expect(formatDateRange(null, null)).toBe("확인 필요");
  });

  it("날짜·시간과 운영일정 공백을 일관되게 표시한다", () => {
    expect(formatDateTime("2026-07-22T19:00:00+09:00")).toBe("2026.07.22 19:00");
    expect(formatOperatingSchedule("  매주 수요일   16:00~19:00  · 총 10회 ")).toBe("매주 수요일 16:00~19:00 · 총 10회");
    expect(formatOperatingSchedule("매주 수요일   16:00~19:00\n\n7월 27일은   휴무")).toBe("매주 수요일 16:00~19:00\n7월 27일은 휴무");
    expect(formatOperatingSchedule(null)).toBe("행사 안내 확인");
  });
});
