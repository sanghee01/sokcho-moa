import { describe, expect, it } from "vitest";
import { mapPublicEventRow, type PublicEventRow } from "@/features/events/mappers";

function eventRow(overrides: Partial<PublicEventRow> = {}): PublicEventRow {
  return {
    id: "event-id",
    slug: "event-slug",
    title: "행사",
    summary: null,
    description: null,
    category: "other",
    audiences: [],
    event_start_at: "2026-07-19T00:00:00Z",
    event_end_at: null,
    operating_hours: null,
    schedule_mode: "continuous",
    application_start_at: null,
    application_end_at: null,
    location_name: null,
    address: null,
    latitude: null,
    longitude: null,
    location_source_url: null,
    location_verified_at: null,
    price_text: null,
    is_free: null,
    performer_people: [],
    performer_groups: [],
    organizer: null,
    organizer_url: null,
    contact: null,
    official_url: null,
    application_url: null,
    image_url: null,
    source_name: "기관",
    source_url: "https://example.com/event",
    review_status: "published",
    is_featured: false,
    is_demo: false,
    view_count: 0,
    last_verified_at: null,
    published_at: "2026-07-18T00:00:00Z",
    created_at: "2026-07-18T00:00:00Z",
    updated_at: "2026-07-18T00:00:00Z",
    event_occurrences: [],
    ...overrides,
  };
}

describe("mapPublicEventRow", () => {
  it("DB 위치 근거 필드를 도메인 모델로 옮긴다", () => {
    const event = mapPublicEventRow(eventRow({
      latitude: 38.1907,
      longitude: 128.6015,
      location_source_url: "https://example.com/venue",
      location_verified_at: "2026-07-18T00:00:00Z",
    }));

    expect(event).toMatchObject({
      latitude: 38.1907,
      longitude: 128.6015,
      locationSourceUrl: "https://example.com/venue",
      locationVerifiedAt: "2026-07-18T00:00:00Z",
    });
  });

  it("출연자 이름의 공백을 정리하고 사람과 팀을 구분한다", () => {
    const event = mapPublicEventRow(eventRow({ performer_people: [" 홍길동 ", ""], performer_groups: ["설악 앙상블"] }));
    expect(event?.performers).toEqual([
      { name: "홍길동", type: "Person" },
      { name: "설악 앙상블", type: "PerformingGroup" },
    ]);
  });

  it("회차를 시작 시각 순으로 정렬한다", () => {
    const event = mapPublicEventRow(eventRow({
      schedule_mode: "occurrences",
      event_occurrences: [
        { id: "b", starts_at: "2026-07-21T01:00:00Z", ends_at: null },
        { id: "a", starts_at: "2026-07-20T01:00:00Z", ends_at: null },
      ],
    }));
    expect(event?.occurrences?.map((occurrence) => occurrence.id)).toEqual(["a", "b"]);
  });

  it("시작일이 없는 행은 목록에서 뺀다", () => {
    expect(mapPublicEventRow(eventRow({ event_start_at: null }))).toBeNull();
  });
});
