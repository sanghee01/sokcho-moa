import { describe, expect, it } from "vitest";
import { seoulDateOrDatetimeToIso } from "@/features/events/admin/datetime";
import { deriveApplicationState, deriveEventState } from "@/features/events/model/event-state";
import { filterEvents, parseEventFilters, type EventFilters } from "@/features/events/model/event-list";
import type { Event } from "@/features/events/model/event";

// 날짜 판단은 모두 한국 시간(KST, UTC+9) 기준이다. UTC 날짜와 KST 날짜가 갈리는 경계에서
// 방문자가 보는 결과(오늘·이번 주·이번 달 목록, 오늘 마감, 진행 중/종료)가 맞는지 확인한다.

/** KST 2026-07-31 23:59:59. UTC로는 아직 7월 31일 */
const LAST_SECOND_OF_JULY_31 = new Date("2026-07-31T14:59:59Z");
/** KST 2026-08-01 00:00:00. UTC로는 아직 7월 31일 */
const MIDNIGHT_AUGUST_1 = new Date("2026-07-31T15:00:00Z");

/** 관리자 폼에 KST 날짜(와 시각)를 입력했을 때 DB에 저장되는 값 */
function kstStart(value: string) {
  return seoulDateOrDatetimeToIso(value, "start");
}
function kstEnd(value: string) {
  return seoulDateOrDatetimeToIso(value, "end");
}

function publishedEvent(slug: string, overrides: Partial<Event> = {}): Event {
  return {
    id: slug,
    slug,
    title: slug,
    summary: null,
    description: null,
    category: "festival",
    audiences: ["all"],
    eventStartAt: kstStart("2026-07-01"),
    eventEndAt: null,
    operatingHours: null,
    applicationStartAt: null,
    applicationEndAt: null,
    locationName: null,
    address: null,
    latitude: null,
    longitude: null,
    locationSourceUrl: null,
    locationVerifiedAt: null,
    priceText: null,
    isFree: true,
    organizer: null,
    contact: null,
    officialUrl: null,
    applicationUrl: null,
    imageUrl: null,
    sourceName: "속초시",
    sourceUrl: `https://example.org/events/${slug}`,
    reviewStatus: "published",
    isFeatured: false,
    lastVerifiedAt: null,
    publishedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function at(start: string, end: string | null = null) {
  return {
    eventStartAt: kstStart(start),
    eventEndAt: end ? kstStart(end) : null,
  };
}

const events = [
  // 종료일만 입력한 행사처럼 KST 7/31 23:59:59.999에 끝난다.
  publishedEvent("late-show", { eventStartAt: kstStart("2026-07-31T23:30"), eventEndAt: kstEnd("2026-07-31") }),
  publishedEvent("dawn-market", at("2026-08-01T00:00", "2026-08-01T06:00")),
  publishedEvent("aug-7-night", at("2026-08-07T23:00", "2026-08-07T23:30")),
  publishedEvent("aug-8-midnight", at("2026-08-08T00:00", "2026-08-08T02:00")),
  publishedEvent("aug-31-night", at("2026-08-31T23:00", "2026-08-31T23:30")),
  publishedEvent("sep-1-midnight", at("2026-09-01T00:00", "2026-09-01T02:00")),
];

/** 방문자가 기본 탭(진행 중)에서 날짜 필터를 골랐을 때 보이는 행사 */
function visibleSlugs(when: NonNullable<EventFilters["when"]>, now: Date, list = events) {
  return filterEvents(list, parseEventFilters({ when }), now).map((event) => event.slug);
}

describe("날짜 필터의 KST 경계", () => {
  it("KST 7/31 23:59:59의 '오늘'은 7월 31일 행사만 보여 준다(UTC로 같은 날인 8/1 새벽 행사는 제외)", () => {
    expect(visibleSlugs("today", LAST_SECOND_OF_JULY_31)).toEqual(["late-show"]);
  });

  it("KST 8/1 00:00이 되면 '오늘'은 8월 1일 행사로 바뀐다", () => {
    expect(visibleSlugs("today", MIDNIGHT_AUGUST_1)).toEqual(["dawn-market"]);
  });

  it("'이번 주'는 KST 오늘부터 7일이며 8일째 KST 0시에 시작하는 행사는 넣지 않는다", () => {
    expect(visibleSlugs("week", LAST_SECOND_OF_JULY_31)).toEqual(["late-show", "dawn-market"]);
    expect(visibleSlugs("week", MIDNIGHT_AUGUST_1)).toEqual(["dawn-market", "aug-7-night"]);
  });

  it("월말 KST 23:59:59의 '이번 달'은 7월이고, KST 0시가 지나면 8월 전체(8/31 밤 포함, 9/1 0시 제외)다", () => {
    expect(visibleSlugs("month", LAST_SECOND_OF_JULY_31)).toEqual(["late-show"]);
    expect(visibleSlugs("month", MIDNIGHT_AUGUST_1)).toEqual([
      "dawn-market",
      "aug-7-night",
      "aug-8-midnight",
      "aug-31-night",
    ]);
  });

  it("12월의 '이번 달'은 해를 넘기지 않는다(12/31 KST 밤 포함, 1/1 KST 0시 제외)", () => {
    const december = [
      publishedEvent("dec-31-night", at("2026-12-31T23:00", "2026-12-31T23:30")),
      publishedEvent("new-year-midnight", at("2027-01-01T00:00", "2027-01-01T01:00")),
    ];
    const midDecember = new Date("2026-12-15T03:00:00Z");

    expect(visibleSlugs("month", midDecember, december)).toEqual(["dec-31-night"]);
  });

  it("KST 1/1 0시의 '이번 달'은 새해 1월이다", () => {
    const newYear = [
      publishedEvent("new-year-midnight", at("2027-01-01T00:00", "2027-01-01T01:00")),
      publishedEvent("jan-31-night", at("2027-01-31T23:00", "2027-01-31T23:30")),
      publishedEvent("feb-1-midnight", at("2027-02-01T00:00", "2027-02-01T01:00")),
    ];
    const kstNewYearMidnight = new Date("2026-12-31T15:00:00Z");

    expect(visibleSlugs("month", kstNewYearMidnight, newYear)).toEqual(["new-year-midnight", "jan-31-night"]);
  });
});

describe("행사 진행 상태의 KST 경계", () => {
  // 관리자가 종료일만 7/31로 입력한 행사: KST 7/31 23:59:59.999에 끝난다.
  const endsJuly31 = publishedEvent("ends-july-31", { eventStartAt: kstStart("2026-07-20"), eventEndAt: kstEnd("2026-07-31") });

  it("종료일 마지막 순간까지는 진행 중이고 KST 0시가 되면 종료다", () => {
    expect(deriveEventState(endsJuly31, LAST_SECOND_OF_JULY_31)).toBe("ongoing");
    expect(deriveEventState(endsJuly31, MIDNIGHT_AUGUST_1)).toBe("ended");
  });

  it("KST 0시가 되면 기본 목록에서 마감 탭으로 옮겨진다", () => {
    expect(filterEvents([endsJuly31], { status: "active" }, LAST_SECOND_OF_JULY_31)).toHaveLength(1);
    expect(filterEvents([endsJuly31], { status: "active" }, MIDNIGHT_AUGUST_1)).toHaveLength(0);
    expect(filterEvents([endsJuly31], { status: "closed" }, MIDNIGHT_AUGUST_1)).toHaveLength(1);
  });

  it("시작 시각이 KST 0시인 행사는 그 순간부터 진행 중이다", () => {
    const startsAugust1 = publishedEvent("starts-august-1", at("2026-08-01T00:00", "2026-08-01T06:00"));

    expect(deriveEventState(startsAugust1, LAST_SECOND_OF_JULY_31)).toBe("upcoming");
    expect(deriveEventState(startsAugust1, MIDNIGHT_AUGUST_1)).toBe("ongoing");
  });
});

describe("신청 '오늘 마감'의 KST 경계", () => {
  const ongoingEvent = { eventStartAt: kstStart("2026-07-01"), eventEndAt: kstEnd("2026-08-31") };
  // 관리자가 신청 마감일만 7/31로 입력한 행사
  const deadlineJuly31 = publishedEvent("deadline-july-31", {
    ...ongoingEvent,
    applicationEndAt: kstEnd("2026-07-31"),
    applicationUrl: "https://example.org/apply",
  });

  it("마감일 KST 0시부터 23:59:59까지 '오늘 마감'이고, 그 전날 밤은 아직 '신청 중'이다", () => {
    expect(deriveApplicationState(deadlineJuly31, new Date("2026-07-30T14:59:59Z"))).toBe("open");
    expect(deriveApplicationState(deadlineJuly31, new Date("2026-07-30T15:00:00Z"))).toBe("closing_today");
    expect(deriveApplicationState(deadlineJuly31, LAST_SECOND_OF_JULY_31)).toBe("closing_today");
  });

  it("마감일 다음 날 KST 0시에는 '신청 마감'이 되고 신청 가능·진행 중 목록에서 빠진다", () => {
    expect(deriveApplicationState(deadlineJuly31, MIDNIGHT_AUGUST_1)).toBe("closed");
    expect(filterEvents([deadlineJuly31], parseEventFilters({ application: "open" }), LAST_SECOND_OF_JULY_31)).toHaveLength(1);
    expect(filterEvents([deadlineJuly31], parseEventFilters({ application: "open" }), MIDNIGHT_AUGUST_1)).toHaveLength(0);
    expect(filterEvents([deadlineJuly31], parseEventFilters({}), MIDNIGHT_AUGUST_1)).toHaveLength(0);
  });

  it("UTC로는 같은 날이어도 KST 날짜가 다르면 '오늘 마감'이 아니다", () => {
    // 마감 KST 8/1 00:30(UTC 7/31 15:30), 지금 KST 7/31 23:59:59(UTC 7/31 14:59:59)
    const deadlineAfterMidnight = { ...deadlineJuly31, applicationEndAt: kstStart("2026-08-01T00:30") };

    expect(deriveApplicationState(deadlineAfterMidnight, LAST_SECOND_OF_JULY_31)).toBe("open");
  });

  it("UTC로는 다른 날이어도 KST 날짜가 같으면 '오늘 마감'이다", () => {
    // 마감 KST 7/31 10:00(UTC 7/31 01:00), 지금 KST 7/31 00:30(UTC 7/30 15:30)
    const deadlineMorning = { ...deadlineJuly31, applicationEndAt: kstStart("2026-07-31T10:00") };

    expect(deriveApplicationState(deadlineMorning, new Date("2026-07-30T15:30:00Z"))).toBe("closing_today");
  });
});
