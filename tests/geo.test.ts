import { describe, expect, it } from "vitest";
import { demoPlaces, getDemoEvents } from "@/lib/data/demo-data";
import { createEventMapLinks, distanceInKm, findNearbyPlaces } from "@/lib/domain/geo";

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

  it("행사 좌표가 없으면 임의 명소를 주변으로 반환하지 않는다", () => {
    const event = { ...getDemoEvents()[0], latitude: null, longitude: null };
    expect(findNearbyPlaces(event, demoPlaces)).toEqual([]);
  });
});

describe("createEventMapLinks", () => {
  it("검증된 전체 주소만 있어도 지도 검색 링크를 만든다", () => {
    const links = createEventMapLinks("속초문화예술회관", "강원특별자치도 속초시 번영로 155", null, null);
    expect(links?.hasVerifiedCoordinates).toBe(false);
    expect(links?.naver).toContain("map.naver.com/p/search/");
    expect(links?.kakao).toContain("map.kakao.com/link/search/");
  });

  it("검증 좌표가 있으면 카카오맵 길찾기 링크를 만든다", () => {
    const links = createEventMapLinks("속초해수욕장", null, 38.1907, 128.6015);
    expect(links?.hasVerifiedCoordinates).toBe(true);
    expect(links?.kakao).toBe("https://map.kakao.com/link/to/%EC%86%8D%EC%B4%88%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5,38.1907,128.6015");
  });

  it("주소와 완전한 좌표가 모두 없으면 링크를 만들지 않는다", () => {
    expect(createEventMapLinks("장소 확인 중", null, null, null)).toBeNull();
  });
});
