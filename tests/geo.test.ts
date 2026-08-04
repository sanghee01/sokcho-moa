import { describe, expect, it } from "vitest";
import { demoPlaces, getDemoEvents } from "@/lib/data/demo-data";
import { createEventMapLinks, createMapSearchName, distanceInKm, findNearbyPlaces, getNearbyPlacesLabel } from "@/lib/domain/geo";

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

  it("행사 좌표가 없으면 같은 지역의 다양한 명소를 거리 표시 없이 반환한다", () => {
    const event = {
      ...getDemoEvents()[0],
      locationName: "한화리조트 설악",
      address: "강원특별자치도 속초시 미시령로2983번길 111",
      latitude: null,
      longitude: null,
    };
    const result = findNearbyPlaces(event, demoPlaces);

    expect(result).toHaveLength(4);
    expect(result.every((place) => place.address?.includes("속초시"))).toBe(true);
    expect(result.every((place) => place.distanceKm === null)).toBe(true);
    expect(new Set(result.map((place) => place.category)).size).toBe(4);
    expect(getNearbyPlacesLabel(event)).toEqual({
      eyebrow: "행사와 함께 둘러보기",
      title: "속초 지역 명소 둘러보기",
      isRegionalFallback: true,
    });
  });

  it("주소가 없어도 장소명에서 지역을 판별한다", () => {
    const event = {
      ...getDemoEvents()[0],
      locationName: "속초시청소년수련관·설악워터피아",
      address: null,
      latitude: null,
      longitude: null,
    };

    expect(findNearbyPlaces(event, demoPlaces)).toHaveLength(4);
    expect(getNearbyPlacesLabel(event).title).toBe("속초 지역 명소 둘러보기");
  });
});

describe("createEventMapLinks", () => {
  it("층과 실 정보는 제외하고, 주소가 있으면 도로명주소로 지도에서 검색한다", () => {
    expect(createMapSearchName("속초시립도서관 3층 시청각실")).toBe("속초시립도서관");
    expect(createMapSearchName("속초시립도서관(지하 1층 다목적실)")).toBe("속초시립도서관");
    expect(createMapSearchName("속초문화예술회관 대공연장")).toBe("속초문화예술회관");
    expect(createMapSearchName("속초시립박물관 강당")).toBe("속초시립박물관");
    expect(createMapSearchName("속초시청 신관 5층 대회의실")).toBe("속초시청");
    expect(createMapSearchName("속초시 엑스포 잔디광장 야외무대")).toBe("속초시 엑스포 잔디광장");
    expect(createMapSearchName("속초해수욕장 일원")).toBe("속초해수욕장");
    expect(createMapSearchName("커피장사 야외테라스")).toBe("커피장사");
    expect(createMapSearchName("번투드웍스(고성군 토성면)")).toBe("번투드웍스");
    expect(createMapSearchName("속초종합경기장(노학동)")).toBe("속초종합경기장");
    expect(createMapSearchName("푸루스플라워(속초 교동)")).toBe("푸루스플라워");

    const links = createEventMapLinks(
      "속초시립도서관 3층 시청각실",
      "강원특별자치도 속초시 조양로 89",
      null,
      null,
    );
    const naverQuery = decodeURIComponent(links!.naver.split("/search/")[1]);
    const linksWithCoordinates = createEventMapLinks(
      "속초시립도서관 3층 시청각실",
      "강원특별자치도 속초시 조양로 89",
      38.2049,
      128.5929,
    );
    const coordinateQuery = decodeURIComponent(linksWithCoordinates!.naver.split("/search/")[1].split("?")[0]);

    expect(naverQuery).toBe("강원특별자치도 속초시 조양로 89");
    expect(coordinateQuery).toBe("강원특별자치도 속초시 조양로 89");
  });

  it("장소명에 내부 전시실이 포함되어도 도로명주소로 길찾기 위치를 연다", () => {
    const links = createEventMapLinks(
      "속초시립박물관 제2기획전시실",
      "강원특별자치도 속초시 신흥2길 16",
      38.2406,
      128.5663,
    );

    const query = decodeURIComponent(links!.naver.split("/search/")[1].split("?")[0]);

    expect(query).toBe("강원특별자치도 속초시 신흥2길 16");
  });

  it("검증된 전체 주소만 있어도 지도 검색 링크를 만든다", () => {
    const links = createEventMapLinks("속초문화예술회관", "강원특별자치도 속초시 번영로 155", null, null);
    expect(links?.hasCoordinates).toBe(false);
    expect(links?.naver).toContain("map.naver.com/p/search/");
  });

  it("검증 좌표가 있으면 네이버 지도 위치 링크를 만든다", () => {
    const links = createEventMapLinks("속초해수욕장", null, 38.1907, 128.6015);
    expect(links?.hasCoordinates).toBe(true);
    expect(links?.naver).toBe("https://map.naver.com/p/search/%EC%86%8D%EC%B4%88%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5?c=128.6015,38.1907,15,0,0,0,dh");
  });

  it("주소와 완전한 좌표가 모두 없으면 링크를 만들지 않는다", () => {
    expect(createEventMapLinks("장소 확인 중", null, null, null)).toBeNull();
  });
});
