import { describe, expect, it } from "vitest";
import {
  buildCalendarMonth,
  resolveCalendarMonth,
  shiftCalendarMonth,
  toKoreanDateKey,
} from "@/lib/domain/calendar";
import type { Event } from "@/lib/domain/event";

const now = new Date("2026-07-20T03:00:00.000Z");

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "test-event",
    title: "테스트 행사",
    summary: null,
    description: null,
    category: "experience",
    audiences: ["all"],
    eventStartAt: "2026-07-20T09:00:00+09:00",
    eventEndAt: "2026-07-20T18:00:00+09:00",
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
    isFree: null,
    organizer: null,
    contact: null,
    officialUrl: null,
    applicationUrl: null,
    imageUrl: null,
    sourceName: "테스트 출처",
    sourceUrl: "https://example.com/event",
    reviewStatus: "published",
    isFeatured: false,
    isDemo: true,
    lastVerifiedAt: null,
    publishedAt: "2026-07-01T00:00:00+09:00",
    ...overrides,
  };
}

describe("calendar month selection", () => {
  it("유효한 월은 보존하고 잘못된 값은 현재 서울 월로 되돌린다", () => {
    expect(resolveCalendarMonth("2026-08", now)).toBe("2026-08");
    expect(resolveCalendarMonth("2026-13", now)).toBe("2026-07");
    expect(resolveCalendarMonth(["invalid", "2026-08"], now)).toBe("2026-07");
    expect(shiftCalendarMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftCalendarMonth("2026-12", 1)).toBe("2027-01");
  });

  it("UTC 날짜 경계에서도 Asia/Seoul 날짜 key를 사용한다", () => {
    expect(toKoreanDateKey("2026-07-19T15:00:00.000Z")).toBe("2026-07-20");
    expect(toKoreanDateKey("2026-07-19T14:59:59.000Z")).toBe("2026-07-19");
  });
});

describe("buildCalendarMonth", () => {
  it("여러 날 행사를 양 끝 날짜를 포함해 주 경계 segment로 이어 붙인다", () => {
    const event = makeEvent({
      eventStartAt: "2026-07-03T09:00:00+09:00",
      eventEndAt: "2026-07-14T18:00:00+09:00",
    });
    const calendar = buildCalendarMonth([event], "2026-07", now);
    const segments = calendar.weeks.flatMap((week) => week.segments).filter((segment) => segment.eventId === event.id);

    expect(segments).toHaveLength(3);
    expect(segments.reduce((total, segment) => total + segment.columnSpan, 0)).toBe(12);
    expect(segments.filter((segment) => segment.startsEvent)).toHaveLength(1);
    expect(segments.filter((segment) => segment.endsEvent)).toHaveLength(1);
    expect(calendar.days.find((day) => day.dateKey === "2026-07-03")?.eventIds).toContain(event.id);
    expect(calendar.days.find((day) => day.dateKey === "2026-07-14")?.eventIds).toContain(event.id);
  });

  it("월 경계를 넘는 행사를 인접 날짜까지 표시하고 현재 월 행사 수는 한 번만 센다", () => {
    const event = makeEvent({
      eventStartAt: "2026-07-31T10:00:00+09:00",
      eventEndAt: "2026-08-02T18:00:00+09:00",
    });
    const calendar = buildCalendarMonth([event], "2026-07", now);

    expect(calendar.eventCount).toBe(1);
    expect(calendar.days.find((day) => day.dateKey === "2026-07-31")?.eventIds).toContain(event.id);
    expect(calendar.days.find((day) => day.dateKey === "2026-08-01")?.eventIds).toContain(event.id);
    expect(calendar.days.find((day) => day.dateKey === "2026-08-02")?.eventIds).toContain(event.id);
  });

  it("기존 신청 상태 파생 규칙을 캘린더 표시 모델의 source of truth로 사용한다", () => {
    const open = makeEvent({
      id: "00000000-0000-4000-8000-000000000010",
      slug: "open-event",
      title: "신청 가능 행사",
      applicationStartAt: "2026-07-01T00:00:00+09:00",
      applicationEndAt: "2026-07-25T23:59:59+09:00",
    });
    const closed = makeEvent({
      id: "00000000-0000-4000-8000-000000000011",
      slug: "closed-event",
      title: "신청 마감 행사",
      applicationStartAt: "2026-06-01T00:00:00+09:00",
      applicationEndAt: "2026-07-19T23:59:59+09:00",
    });
    const calendar = buildCalendarMonth([open, closed], "2026-07", now);

    expect(calendar.events.find((event) => event.id === open.id)?.applicationState).toBe("open");
    expect(calendar.events.find((event) => event.id === closed.id)?.applicationState).toBe("closed");
  });

  it("같은 주에 겹치는 일정은 서로 다른 lane에 배치한다", () => {
    const first = makeEvent({
      id: "00000000-0000-4000-8000-000000000020",
      slug: "first-event",
      eventStartAt: "2026-07-10T09:00:00+09:00",
      eventEndAt: "2026-07-12T18:00:00+09:00",
    });
    const second = makeEvent({
      id: "00000000-0000-4000-8000-000000000021",
      slug: "second-event",
      eventStartAt: "2026-07-11T09:00:00+09:00",
      eventEndAt: "2026-07-13T18:00:00+09:00",
    });
    const calendar = buildCalendarMonth([first, second], "2026-07", now);
    const overlappingWeek = calendar.weeks.find((week) => (
      week.segments.some((segment) => segment.eventId === first.id)
      && week.segments.some((segment) => segment.eventId === second.id)
    ));

    expect(overlappingWeek).toBeDefined();
    expect(new Set(overlappingWeek?.segments.map((segment) => segment.lane)).size).toBe(2);
  });
});
