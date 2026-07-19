import { describe, expect, it } from "vitest";
import { mapEventRow } from "@/lib/data/mappers";

describe("mapEventRow location evidence", () => {
  it("DB 위치 근거 필드를 도메인 모델로 옮긴다", () => {
    const event = mapEventRow({
      id: "event-id",
      slug: "event-slug",
      title: "행사",
      category: "other",
      audiences: [],
      event_start_at: "2026-07-19T00:00:00Z",
      source_name: "기관",
      source_url: "https://example.com/event",
      review_status: "published",
      latitude: "38.190700",
      longitude: "128.601500",
      location_source_url: "https://example.com/venue",
      location_verified_at: "2026-07-18T00:00:00Z",
    });

    expect(event).toMatchObject({
      latitude: 38.1907,
      longitude: 128.6015,
      locationSourceUrl: "https://example.com/venue",
      locationVerifiedAt: "2026-07-18T00:00:00Z",
    });
  });
});
