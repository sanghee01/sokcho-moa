import { describe, expect, it } from "vitest";
import { demoPlaces, getDemoEvents } from "@/lib/data/demo-data";
import { distanceInKm, findNearbyPlaces } from "@/lib/domain/geo";

describe("distanceInKm", () => {
  it("같은 좌표의 거리는 0이다", () => {
    expect(distanceInKm(38.2, 128.59, 38.2, 128.59)).toBe(0);
  });

  it("속초해수욕장과 아바이마을 거리를 합리적인 범위로 계산한다", () => {
    const distance = distanceInKm(38.1907, 128.6015, 38.2028, 128.5918);
    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(3);
  });
});

describe("findNearbyPlaces", () => {
  it("행사 좌표에서 가까운 명소를 최대 4개 반환한다", () => {
    const event = getDemoEvents()[0];
    const result = findNearbyPlaces(event, demoPlaces);
    expect(result).toHaveLength(4);
    expect(result[0].slug).toBe("sokcho-beach");
    expect(result[0].distanceKm).toBe(0);
  });
});
