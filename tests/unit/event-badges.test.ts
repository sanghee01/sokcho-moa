import { describe, expect, it } from "vitest";
import { selectEventBadges } from "@/features/events/model/badges";
import { makeEvent, NOW } from "@/tests/unit/support/event-builder";

// 기준 시각 NOW = 2026-07-20 12:00 KST. 배지 규칙의 원본은 .ai/DESIGN.md의 "행사 상태의 색"이다.
function labels(event: Parameters<typeof selectEventBadges>[0]) {
  return selectEventBadges(event, NOW).map((badge) => badge.label);
}

describe("selectEventBadges", () => {
  it("종료된 행사는 종료 안내 하나만 보여 준다", () => {
    const ended = makeEvent({ eventStartAt: "2026-07-01T00:00:00.000Z", eventEndAt: "2026-07-10T00:00:00.000Z", isFree: true });
    expect(labels(ended)).toEqual(["종료된 행사예요"]);
  });

  it("신청이 끝난 행사는 신청 마감 안내 하나만 보여 준다", () => {
    const closed = makeEvent({ applicationEndAt: "2026-07-19T14:59:59.000Z", isFree: true });
    expect(labels(closed)).toEqual(["신청이 마감된 행사예요"]);
  });

  it("오늘 마감은 가장 앞에 강조 색으로 보여 준다", () => {
    const closingToday = makeEvent({ applicationEndAt: "2026-07-20T14:59:59.000Z", isFree: true });
    const badges = selectEventBadges(closingToday, NOW);
    expect(badges.map((badge) => badge.label)).toEqual(["오늘 마감", "무료"]);
    expect(badges[0].tone).toBe("danger");
  });

  // 2026-11-06 사용자 결정: "신청 가능"은 '해도 된다'로 읽혀 헷갈리므로 "사전 신청"으로 바꾸고, 마감 3일 이내는 D-day로 보여 준다.
  it("신청을 받는 무료 행사는 마감까지 여유가 있으면 사전 신청과 무료를 보여 준다", () => {
    const open = makeEvent({ applicationEndAt: "2026-07-30T14:59:59.000Z", isFree: true });
    expect(labels(open)).toEqual(["사전 신청", "무료"]);
  });

  it("마감 날짜 없이 신청 링크만 있어도 사전 신청을 보여 준다", () => {
    expect(labels(makeEvent({ applicationUrl: "https://example.com/apply" }))).toEqual(["사전 신청"]);
  });

  it("마감이 1~3일 남으면 신청 D-day를 강조 색으로 보여 준다(KST 날짜 기준)", () => {
    function dayAfter(date: string) {
      return makeEvent({ applicationEndAt: `${date}T23:59:59+09:00` });
    }
    expect(labels(dayAfter("2026-07-21"))).toEqual(["신청 D-1"]);
    expect(labels(dayAfter("2026-07-23"))).toEqual(["신청 D-3"]);
    expect(labels(dayAfter("2026-07-24"))).toEqual(["사전 신청"]);
    expect(selectEventBadges(dayAfter("2026-07-22"), NOW)[0].tone).toBe("danger");
  });

  it("밤 11시 30분에 다음 날 새벽 마감이면 D-1이다", () => {
    const lateNight = new Date("2026-07-20T23:30:00+09:00");
    const earlyMorning = makeEvent({ applicationEndAt: "2026-07-21T00:30:00+09:00" });
    expect(selectEventBadges(earlyMorning, lateNight).map((badge) => badge.label)).toEqual(["신청 D-1"]);
  });

  it("진행 중·예정과 별도 신청 없음은 배지로 보여 주지 않는다", () => {
    expect(labels(makeEvent({ isFree: false }))).toEqual([]);
    expect(labels(makeEvent({ isFree: true }))).toEqual(["무료"]);
    expect(labels(makeEvent({ eventStartAt: "2026-08-01T00:00:00.000Z", eventEndAt: "2026-08-02T00:00:00.000Z" }))).toEqual([]);
  });

  it("어떤 경우에도 배지는 두 개를 넘지 않는다", () => {
    const busy = makeEvent({ applicationStartAt: "2026-07-01T00:00:00.000Z", applicationEndAt: "2026-07-20T14:59:59.000Z", applicationUrl: "https://example.com", isFree: true });
    expect(selectEventBadges(busy, NOW).length).toBeLessThanOrEqual(2);
  });
});
