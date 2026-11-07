import { describe, expect, it } from "vitest";
import {
  fromSeoulWallClock,
  getSeoulDateParts,
  getSeoulMidnight,
  isSameSeoulDate,
  seoulDaysBetween,
  toSeoulWallClock,
} from "@/lib/seoul-time";

// 서울 날짜 경계: UTC 15:00이 서울 자정이다.
describe("서울 시간 계산", () => {
  it("UTC 15:00을 기준으로 서울 날짜가 바뀐다", () => {
    expect(getSeoulDateParts(new Date("2026-11-06T14:59:59.999Z"))).toEqual({ year: 2026, month: 11, day: 6 });
    expect(getSeoulDateParts(new Date("2026-11-06T15:00:00.000Z"))).toEqual({ year: 2026, month: 11, day: 7 });
  });

  it("서울 자정은 전날 UTC 15:00이고, 넘친 월·일은 다음 달·다음 해로 넘어간다", () => {
    expect(getSeoulMidnight(2026, 11, 7).toISOString()).toBe("2026-11-06T15:00:00.000Z");
    expect(getSeoulMidnight(2026, 13, 1).toISOString()).toBe("2026-12-31T15:00:00.000Z");
    expect(getSeoulMidnight(2026, 2, 29).toISOString()).toBe("2026-02-28T15:00:00.000Z");
  });

  it("같은 서울 날짜인지 자정 앞뒤로 구분한다", () => {
    expect(isSameSeoulDate(new Date("2026-11-06T00:00:00Z"), new Date("2026-11-06T14:59:00Z"))).toBe(true);
    expect(isSameSeoulDate(new Date("2026-11-06T14:59:00Z"), new Date("2026-11-06T15:00:00Z"))).toBe(false);
  });

  it("두 시각의 서울 달력 날짜 차이를 센다(시간 차이가 아님)", () => {
    // 서울 밤 11시 30분과 다음 날 0시 30분은 1시간 차이지만 날짜로는 1일이다.
    expect(seoulDaysBetween(new Date("2026-11-06T14:30:00Z"), new Date("2026-11-06T15:30:00Z"))).toBe(1);
    // 같은 서울 날짜 안이면 0일이다.
    expect(seoulDaysBetween(new Date("2026-11-05T15:00:00Z"), new Date("2026-11-06T14:59:00Z"))).toBe(0);
    // 월말을 넘어도 달력 날짜로 센다(서울 10월 31일 → 11월 3일).
    expect(seoulDaysBetween(new Date("2026-10-31T03:00:00Z"), new Date("2026-11-03T03:00:00Z"))).toBe(3);
  });

  it("서울 벽시계 시각과 실제 시각을 서로 바꾼다", () => {
    const instant = fromSeoulWallClock({ year: 2026, month: 1, day: 1, hour: 0, minute: 30 });
    expect(instant.toISOString()).toBe("2025-12-31T15:30:00.000Z");
    expect(toSeoulWallClock(instant)).toEqual({ year: 2026, month: 1, day: 1, hour: 0, minute: 30 });
  });
});
