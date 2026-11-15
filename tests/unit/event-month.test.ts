import { describe, expect, it } from "vitest";
import {
  buildEventMonthDescription,
  eventMonthPath,
  getListedEventMonths,
  isEventMonthPublic,
  parseEventMonth,
  partitionMonthEvents,
  selectMonthEvents,
} from "@/features/events/model/event-month";
import { makeEvent } from "@/tests/unit/support/event-builder";

// 2026-11-15 12:00 KST
const NOV_15 = new Date("2026-11-15T03:00:00.000Z");
const NOVEMBER = { year: 2026, month: 11 };

describe("월 주소 해석", () => {
  it("0을 채운 YYYY-MM만 받는다", () => {
    expect(parseEventMonth("2026-11")).toEqual(NOVEMBER);
    expect(parseEventMonth("2027-01")).toEqual({ year: 2027, month: 1 });
    for (const value of ["2026-1", "2026-13", "2026-00", "2026-11-01", "26-11", "abcd-ef", ""]) {
      expect(parseEventMonth(value)).toBeNull();
    }
  });

  it("월을 주소로 바꾸고, 분야를 고르면 그 아래 주소다", () => {
    expect(eventMonthPath({ year: 2027, month: 1 })).toBe("/months/2027-01");
    expect(eventMonthPath(NOVEMBER, "education")).toBe("/months/2026-11/education");
  });
});

describe("월별 행사 고르기", () => {
  it("그 달(KST)에 하루라도 열리는 공개 행사만 시작일순으로 고른다", () => {
    const events = [
      makeEvent({ slug: "late", eventStartAt: "2026-11-20T01:00:00.000Z", eventEndAt: null }),
      // 10월에 시작해 11월까지 이어지는 전시
      makeEvent({ slug: "long", eventStartAt: "2026-10-03T00:00:00.000Z", eventEndAt: "2026-11-21T09:00:00.000Z" }),
      // 10월 31일 23:59 KST에 끝남 → 11월 아님
      makeEvent({ slug: "october", eventStartAt: "2026-10-31T01:00:00.000Z", eventEndAt: "2026-10-31T14:59:00.000Z" }),
      // UTC로는 10월 31일이지만 KST로는 11월 1일 0시
      makeEvent({ slug: "kst-first", eventStartAt: "2026-10-31T15:00:00.000Z", eventEndAt: null }),
      // 11월 30일 23:30 KST 시작
      makeEvent({ slug: "kst-last", eventStartAt: "2026-11-30T14:30:00.000Z", eventEndAt: null }),
      // KST로 12월 1일 0시 → 11월 아님
      makeEvent({ slug: "december", eventStartAt: "2026-11-30T15:00:00.000Z", eventEndAt: null }),
      makeEvent({ slug: "hidden", reviewStatus: "rejected", eventStartAt: "2026-11-10T01:00:00.000Z", eventEndAt: null }),
    ];

    expect(selectMonthEvents(events, NOVEMBER).map((event) => event.slug)).toEqual(["long", "kst-first", "late", "kst-last"]);
  });

  it("분야를 고르면 그 분야 행사만 고른다", () => {
    const concert = makeEvent({ category: "performance", eventStartAt: "2026-11-10T01:00:00.000Z", eventEndAt: null });
    const lecture = makeEvent({ category: "education", eventStartAt: "2026-11-11T01:00:00.000Z", eventEndAt: null });

    expect(selectMonthEvents([concert, lecture], NOVEMBER, "education")).toEqual([lecture]);
  });

  it("회차형 행사는 기간이 걸쳐도 그 달에 회차가 있을 때만 고른다", () => {
    const events = [
      makeEvent({
        slug: "skips-november",
        scheduleMode: "occurrences",
        eventStartAt: "2026-10-10T01:00:00.000Z",
        eventEndAt: "2026-12-05T03:00:00.000Z",
        occurrences: [
          { id: "a", startsAt: "2026-10-10T01:00:00.000Z", endsAt: "2026-10-10T03:00:00.000Z" },
          { id: "b", startsAt: "2026-12-05T01:00:00.000Z", endsAt: "2026-12-05T03:00:00.000Z" },
        ],
      }),
      makeEvent({
        slug: "has-november",
        scheduleMode: "occurrences",
        eventStartAt: "2026-10-10T01:00:00.000Z",
        eventEndAt: "2026-11-07T03:00:00.000Z",
        occurrences: [{ id: "c", startsAt: "2026-11-07T01:00:00.000Z", endsAt: "2026-11-07T03:00:00.000Z" }],
      }),
    ];

    expect(selectMonthEvents(events, NOVEMBER).map((event) => event.slug)).toEqual(["has-november"]);
  });

  it("끝난 행사와 진행 중·예정 행사를 나눈다", () => {
    const ended = makeEvent({ eventStartAt: "2026-11-06T00:00:00.000Z", eventEndAt: "2026-11-14T14:00:00.000Z" });
    const ongoing = makeEvent({ eventStartAt: "2026-11-06T00:00:00.000Z", eventEndAt: "2026-11-15T14:00:00.000Z" });
    const upcoming = makeEvent({ eventStartAt: "2026-11-19T04:30:00.000Z", eventEndAt: null });

    expect(partitionMonthEvents([ended, ongoing, upcoming], NOV_15)).toEqual({ current: [ongoing, upcoming], ended: [ended] });
  });
});

describe("열어 둘 월", () => {
  const novemberEvent = makeEvent({ eventStartAt: "2026-11-10T01:00:00.000Z", eventEndAt: null });

  it("이번 달과 다음 달은 행사가 없어도 연다", () => {
    expect(isEventMonthPublic(NOVEMBER, [], NOV_15)).toBe(true);
    expect(isEventMonthPublic({ year: 2026, month: 12 }, [], NOV_15)).toBe(true);
  });

  it("지난 달은 행사가 있을 때만, 다다음 달부터는 열지 않는다", () => {
    expect(isEventMonthPublic({ year: 2026, month: 10 }, [], NOV_15)).toBe(false);
    expect(isEventMonthPublic(NOVEMBER, [novemberEvent], new Date("2027-01-10T03:00:00.000Z"))).toBe(true);
    expect(isEventMonthPublic({ year: 2027, month: 1 }, [novemberEvent], NOV_15)).toBe(false);
  });

  it("목록 링크와 sitemap에 넣는 달은 이번 달과 다음 달이고, 연말에는 해가 넘어간다", () => {
    expect(getListedEventMonths(NOV_15)).toEqual([NOVEMBER, { year: 2026, month: 12 }]);
    // 2026-12-31 23:30 KST
    expect(getListedEventMonths(new Date("2026-12-31T14:30:00.000Z"))).toEqual([
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
    ]);
    // 2026-11-30 15:00 UTC = 12월 1일 0시 KST
    expect(getListedEventMonths(new Date("2026-11-30T15:00:00.000Z"))[0]).toEqual({ year: 2026, month: 12 });
  });
});

// 검색 결과 설명(meta description)과 구조화 데이터에만 쓴다. 화면에는 쓰지 않는다(2026-11-15 사용자 결정: 방문자에게 필요 없는 문장).
describe("월 검색 설명", () => {
  it("행사 수와 분야별 수만 쓰고, 오늘 기준 남은 수나 끝났다는 말은 쓰지 않는다", () => {
    const events = [
      makeEvent({ category: "festival", eventStartAt: "2026-11-06T00:00:00.000Z", eventEndAt: "2026-11-14T14:00:00.000Z" }),
      makeEvent({ category: "performance", eventStartAt: "2026-11-19T04:30:00.000Z", eventEndAt: null }),
      makeEvent({ category: "performance", eventStartAt: "2026-11-20T04:30:00.000Z", eventEndAt: null }),
    ];

    expect(buildEventMonthDescription(NOVEMBER, events)).toBe("2026년 11월 속초에서 열리는 행사는 모두 3개예요(공연 2개, 축제 1개).");
  });

  it("행사가 없으면 아직 올라오지 않았다고 쓴다", () => {
    expect(buildEventMonthDescription({ year: 2026, month: 12 }, [])).toBe("2026년 12월 속초 행사 일정은 아직 올라오지 않았어요.");
  });

  it("분야를 고르면 그 분야 이름으로 쓴다", () => {
    const lectures = [
      makeEvent({ category: "education", eventStartAt: "2026-11-11T01:00:00.000Z", eventEndAt: null }),
      makeEvent({ category: "education", eventStartAt: "2026-11-12T01:00:00.000Z", eventEndAt: null }),
    ];

    expect(buildEventMonthDescription(NOVEMBER, lectures, "education")).toBe("2026년 11월 속초 교육 행사는 모두 2개예요.");
    expect(buildEventMonthDescription(NOVEMBER, [], "education")).toBe("2026년 11월 속초 교육 일정은 아직 올라오지 않았어요.");
  });
});
