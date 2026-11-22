import type { Place } from "@/features/places/model/place";

// "가볼만한 곳"의 지역(.ai/DESIGN.md 가볼만한 곳 목록). 고성·양양 명소를 올리면서 지역으로 걸러 보게 했다(2026-11-22 사용자 요청).
// 지역 탭을 따로 나누지 않고 분류 칩 줄 맨 앞의 select 하나로 거른다(2026-11-22 사용자 결정). 값의 순서가 select 보기 순서다. 주소(?region=)에는 이 영어 값을 쓴다.
// 지역을 더하면 app/globals.css의 [data-region-scope] 블록(정적 목록의 CSS 거르기)도 함께 더한다.
export const placeRegions = ["sokcho", "goseong", "yangyang"] as const;

export type PlaceRegion = (typeof placeRegions)[number];

/**
 * "전체 지역"을 부르는 값. 주소(?region=all)·select·GA 같은 화면 경계는 이 값을 쓰고, 장소를 거르는 model 함수는 null을 쓴다.
 * 거르기 값을 화면 경계의 값으로 바꿀 때는 choiceOfRegion만 쓴다. 예전에는 "all"과 null을 바꾸는 코드(?? "all")가 여러 파일에 흩어져 있었다(2026-11-22 리뷰).
 */
export const ALL_REGIONS = "all";

/** 지역 select의 값: 한 지역 또는 전체(all). 목록은 주소에 값이 없으면 속초다(2026-11-22 사용자 결정). */
export type PlaceRegionChoice = PlaceRegion | typeof ALL_REGIONS;

/**
 * 목록(/places)이 처음에 보이는 지역. 사이트 이름(속초모아)·목록 제목("속초 가볼만한 곳")과 맞춘다. 지도는 지역으로 거르지 않고 처음 보기만 속초 핀에 맞춘다(map-pins.ts의 selectCameraPins).
 * 통합 검색은 이름으로 찾으면 고성 장소도 바로 나와야 해서 기본이 전체다(2026-11-22 사용자 결정).
 */
export const DEFAULT_LIST_REGION: PlaceRegion = "sokcho";

export const placeRegionLabels: Record<PlaceRegion, string> = {
  sokcho: "속초",
  goseong: "고성",
  yangyang: "양양",
};

/** 주소의 시·군 이름 → 지역 */
const regionByDistrict: Readonly<Record<string, PlaceRegion>> = { 속초: "sokcho", 고성: "goseong", 양양: "yangyang" };

/**
 * 주소로는 정할 수 없는 장소의 지역. 진부령미술관은 고성군이 운영하고 고성군 관광 누리집에 올라 있지만,
 * 진부령 고개 너머 인제군 북면에 있다. 주소는 실제 주소 그대로 두고 지역만 고성으로 묶는다(2026-11-22 사용자 결정).
 * 장소 id로 건다. slug로 걸면 관리자가 slug를 바꿀 때 조용히 인제(지역 없음)로 빠졌다(2026-11-22). id는 data/attractions.json의 고정 값이다.
 */
const REGION_BY_PLACE_ID: Readonly<Record<string, PlaceRegion>> = { "20000000-0000-4000-8000-000000000084": "goseong" };

const REGION_PARAM = "region";

export function isPlaceRegion(value: string | null | undefined): value is PlaceRegion {
  return placeRegions.some((region) => region === value);
}

/** 장소의 지역. 속초·고성·양양 밖이거나 주소가 없으면 null이다. */
export function getPlaceRegion(place: Pick<Place, "id" | "address">): PlaceRegion | null {
  const exception = REGION_BY_PLACE_ID[place.id];
  if (exception !== undefined) return exception;
  return getRegionFromAddress(place.address);
}

/** 장소의 지역 이름("고성"). 목록 줄과 지도 장소 카드가 분류 옆에 붙인다. 지역을 모르면 null. */
export function getPlaceRegionLabel(place: Pick<Place, "id" | "address">) {
  const region = getPlaceRegion(place);
  return region === null ? null : placeRegionLabels[region];
}

/** 주소의 시·군으로만 정한 지역("강원특별자치도 고성군 토성면 …" → goseong). */
export function getRegionFromAddress(address: string | null): PlaceRegion | null {
  const district = /(속초|고성|양양)(?:시|군)/.exec(address ?? "")?.[1];
  return district === undefined ? null : regionByDistrict[district] ?? null;
}

/** 통합 검색 주소의 ?region= 값. 검색은 기본이 전체라 값이 없거나 all·모르는 값이면 전체(null)다. 목록은 parseListRegion을 쓴다. */
export function parseSearchRegion(value: string | string[] | undefined): PlaceRegion | null {
  const first = Array.isArray(value) ? value[0] : value;
  return isPlaceRegion(first) ? first : null;
}

/**
 * 통합 검색의 지역. 결과가 두 지역 이상일 때만 지역으로 거르고, 결과에 없는 지역은 무시한다(전체 = null).
 * 공유·뒤로 가기 주소에 결과에 없는 지역이 남으면 빈 목록과 보기에 없는 select가 보였다(2026-11-22 리뷰).
 */
export function resolveSearchRegion(value: string | string[] | undefined, resultRegions: readonly PlaceRegion[]): PlaceRegion | null {
  const region = parseSearchRegion(value);
  return region !== null && resultRegions.length > 1 && resultRegions.includes(region) ? region : null;
}

/** 목록 주소의 ?region= 값. 목록은 기본이 속초라 값이 없거나 모르는 값이면 속초, all이면 전체다. */
export function parseListRegion(value: string | string[] | undefined | null): PlaceRegionChoice {
  const first = Array.isArray(value) ? value[0] : value;
  if (first === ALL_REGIONS) return ALL_REGIONS;
  return isPlaceRegion(first) ? first : DEFAULT_LIST_REGION;
}

/** 거르기 값(전체는 null)을 화면 경계의 값(all)으로 바꾼다. 주소·select·GA에 쓴다. */
export function choiceOfRegion(region: PlaceRegion | null): PlaceRegionChoice {
  return region ?? ALL_REGIONS;
}

/** 고른 지역의 장소만 남긴다. region이 없으면 그대로 돌려준다. */
export function filterPlacesByRegion<TPlace extends Pick<Place, "id" | "address">>(places: readonly TPlace[], region: PlaceRegion | null): TPlace[] {
  return region === null ? [...places] : places.filter((place) => getPlaceRegion(place) === region);
}

/** 장소가 하나라도 있는 지역만, select 보기 순서대로. */
export function listPlaceRegions(places: readonly Pick<Place, "id" | "address">[]): PlaceRegion[] {
  const used = new Set(places.map(getPlaceRegion));
  return placeRegions.filter((region) => used.has(region));
}

/** 목록 경로에 지역을 붙인 주소. 기본 지역(속초)은 주소에 적지 않아 정식 주소(canonical)와 같다. */
export function placeRegionHref(pathname: string, choice: PlaceRegionChoice) {
  return choice === DEFAULT_LIST_REGION ? pathname : `${pathname}?${new URLSearchParams({ [REGION_PARAM]: choice })}`;
}
