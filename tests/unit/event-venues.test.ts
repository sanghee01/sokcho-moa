import { describe, expect, it } from "vitest";
import { MAP_REGION_BOUNDS } from "@/features/map/model/map-pins";
import {
  findVenueAddress,
  findVenueCoordinates,
  resolveEventAddress,
  resolveEventCoordinates,
  venues,
  type Venue,
} from "@/features/events/model/venue";

// 공고에 장소 이름만 있고 주소가 없는 행사가 많다. 자주 쓰는 시설은 장소 사전(data/venues.json)으로 주소를 채운다(2026-11-15 사용자 결정).
const SAMPLE_VENUES: Venue[] = [
  { name: "속초문화예술회관", aliases: [], address: "강원특별자치도 속초시 문화로 1", sourceUrl: "https://example.org/arts" },
  { name: "속초시립도서관", aliases: [], address: "강원특별자치도 속초시 도서관로 2", sourceUrl: "https://example.org/library" },
  { name: "속초시립도서관 교동분관", aliases: [], address: "강원특별자치도 속초시 교동로 3", sourceUrl: "https://example.org/branch" },
  { name: "아트플랫폼 갯배", aliases: ["아트플랫폼갯배"], address: "강원특별자치도 속초시 갯배로 4", sourceUrl: "https://example.org/art" },
];

describe("장소 사전", () => {
  it("시설 이름 뒤에 방·층 이름이 붙어도 그 시설 주소를 찾는다", () => {
    expect(findVenueAddress("속초문화예술회관 대공연장", SAMPLE_VENUES)).toBe("강원특별자치도 속초시 문화로 1");
    expect(findVenueAddress("속초시립도서관 3층 시청각실", SAMPLE_VENUES)).toBe("강원특별자치도 속초시 도서관로 2");
    expect(findVenueAddress("속초문화예술회관", SAMPLE_VENUES)).toBe("강원특별자치도 속초시 문화로 1");
  });

  it("띄어쓰기가 달라도 같은 시설로 보고, 더 구체적인 시설 이름을 먼저 고른다", () => {
    expect(findVenueAddress("아트플랫폼갯배", SAMPLE_VENUES)).toBe("강원특별자치도 속초시 갯배로 4");
    expect(findVenueAddress("속초시립도서관교동분관 2층", SAMPLE_VENUES)).toBe("강원특별자치도 속초시 교동로 3");
  });

  it("여러 장소이거나 넓은 구역이면 한 시설 주소로 대신하지 않는다", () => {
    expect(findVenueAddress("속초시립도서관 및 풀이음작은도서관", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress("속초문화예술회관 / 엑스포 광장", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress("속초문화예술회관·청초호", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress("속초문화예술회관, 엑스포 광장", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress("아트플랫폼 갯배 일원", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress("속초문화예술회관 등 협력기관", SAMPLE_VENUES)).toBeNull();
  });

  it("사전에 없는 장소나 빈 장소는 null이다", () => {
    expect(findVenueAddress("설악동 C지구 소공원", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress("  ", SAMPLE_VENUES)).toBeNull();
    expect(findVenueAddress(null, SAMPLE_VENUES)).toBeNull();
  });

  it("저장된 주소가 있으면 사전보다 그 주소를 쓴다", () => {
    expect(resolveEventAddress({ address: "강원특별자치도 속초시 실제로 9", locationName: "속초문화예술회관" }, SAMPLE_VENUES))
      .toBe("강원특별자치도 속초시 실제로 9");
    expect(resolveEventAddress({ address: "  ", locationName: "속초문화예술회관 소강당" }, SAMPLE_VENUES))
      .toBe("강원특별자치도 속초시 문화로 1");
  });

  // 지도 탭에 핀을 찍으려고 시설 좌표도 사전에 둔다. 좌표를 확인하지 못한 시설은 좌표 없이 둔다(2026-11-16).
  it("시설 좌표가 있으면 방·층 이름이 붙어도 그 좌표를 찾고, 없거나 여러 장소면 null이다", () => {
    const venuesWithCoordinates: Venue[] = [
      { ...SAMPLE_VENUES[0], coordinates: { latitude: 38.2127, longitude: 128.5888, sourceUrl: "https://example.org/osm" } },
      SAMPLE_VENUES[1],
    ];

    expect(findVenueCoordinates("속초문화예술회관 대공연장", venuesWithCoordinates)).toEqual({ latitude: 38.2127, longitude: 128.5888 });
    expect(findVenueCoordinates("속초시립도서관 3층", venuesWithCoordinates)).toBeNull();
    expect(findVenueCoordinates("속초문화예술회관 및 엑스포 광장", venuesWithCoordinates)).toBeNull();
  });

  it("행사에 저장된 좌표가 있으면 사전보다 그 좌표를 쓴다", () => {
    const venuesWithCoordinates: Venue[] = [
      { ...SAMPLE_VENUES[0], coordinates: { latitude: 38.2127, longitude: 128.5888, sourceUrl: "https://example.org/osm" } },
    ];

    expect(resolveEventCoordinates({ latitude: 38.1, longitude: 128.5, locationName: "속초문화예술회관" }, venuesWithCoordinates))
      .toEqual({ latitude: 38.1, longitude: 128.5 });
    expect(resolveEventCoordinates({ latitude: null, longitude: null, locationName: "속초문화예술회관 소강당" }, venuesWithCoordinates))
      .toEqual({ latitude: 38.2127, longitude: 128.5888 });
    expect(resolveEventCoordinates({ latitude: null, longitude: null, locationName: "설악동 소공원" }, venuesWithCoordinates)).toBeNull();
  });

  it("사전의 시설 좌표는 모두 지도 범위(속초·고성·양양) 안에 있다", () => {
    const { south, north, west, east } = MAP_REGION_BOUNDS;
    for (const venue of venues) {
      if (venue.coordinates === undefined) continue;
      expect(venue.coordinates.latitude, venue.name).toBeGreaterThanOrEqual(south);
      expect(venue.coordinates.latitude, venue.name).toBeLessThanOrEqual(north);
      expect(venue.coordinates.longitude, venue.name).toBeGreaterThanOrEqual(west);
      expect(venue.coordinates.longitude, venue.name).toBeLessThanOrEqual(east);
    }
  });

  it("사전의 시설 이름과 별칭은 겹치지 않는다", () => {
    const keys = venues.flatMap((venue) => [venue.name, ...venue.aliases].map((key) => key.replace(/\s+/g, "")));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
