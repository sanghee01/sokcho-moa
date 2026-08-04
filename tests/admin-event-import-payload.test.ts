import { describe, expect, it } from "vitest";
import { buildCandidateEventPayload } from "@/lib/actions/admin/import-payload";
import type { EventCandidate } from "@/lib/domain/event";

const candidate: EventCandidate = {
  title: "확인된 행사",
  summary: null,
  description: "기존 후보 형식의 긴 행사 소개",
  category: null,
  audiences: [],
  eventStartAt: null,
  eventEndAt: null,
  operatingHours: null,
  applicationStartAt: null,
  applicationEndAt: null,
  locationName: null,
  address: null,
  latitude: null,
  longitude: null,
  priceText: null,
  isFree: null,
  organizer: null,
  contact: null,
  officialUrl: null,
  applicationUrl: null,
  imageUrl: null,
  sourceName: "공식 출처",
  sourceUrl: "https://example.com/events/1?z=2&a=1",
};

describe("administrator event candidate import payload", () => {
  it("writes a legacy candidate description into the summary SSOT only", () => {
    const payload = buildCandidateEventPayload(candidate, "candidate-1");

    expect(payload.summary).toBe("기존 후보 형식의 긴 행사 소개");
    expect(payload).not.toHaveProperty("description");
  });

  it("prefers an explicit summary and canonicalizes the source URL", () => {
    const payload = buildCandidateEventPayload(
      { ...candidate, summary: "공개 소개", description: "이전 상세 소개" },
      "candidate-2",
    );

    expect(payload.summary).toBe("공개 소개");
    expect(payload.source_url).toBe("https://example.com/events/1?a=1&z=2");
  });
});
