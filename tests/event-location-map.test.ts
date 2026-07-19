import { describe, expect, it } from "vitest";
import { hasVerifiedLocation } from "@/lib/domain/geo";

describe("hasVerifiedLocation", () => {
  const verified = {
    latitude: 38.1907,
    longitude: 128.6015,
    locationSourceUrl: "https://example.com/venue",
    locationVerifiedAt: "2026-07-19T00:00:00+09:00",
  };

  it("좌표와 공개 근거 및 확인 시각이 모두 있을 때만 지도를 표시한다", () => {
    expect(hasVerifiedLocation(verified)).toBe(true);
    expect(hasVerifiedLocation({ ...verified, locationSourceUrl: null })).toBe(false);
    expect(hasVerifiedLocation({ ...verified, locationVerifiedAt: null })).toBe(false);
    expect(hasVerifiedLocation({ ...verified, longitude: null })).toBe(false);
  });
});
