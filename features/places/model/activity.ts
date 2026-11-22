import type { ActivityPlace, Place } from "@/features/places/model/place";
import { choiceOfRegion, getPlaceRegion, placeRegionHref, placeRegionLabels, placeRegions } from "@/features/places/model/region";

// 즐길거리 분류. 값의 원본은 DB check 제약(migration 20261121050439)이고 순서는 화면의 칩 순서다.
// 이름은 설명 없이 뜻이 통하는 구체적인 말로 지었다("레저", "즐길거리 & 랜드마크"처럼 뭉뚱그린 이름은 쓰지 않음, 2026-11-21).
// 자연·명소를 맨 앞에 둔다. "가볼만한 곳"에 명소를 합친 뒤(2026-11-21) 가장 많이 찾는 곳이 해변·호수·산이다.
export const activityCategories = ["nature", "water", "exhibition", "view", "themepark", "marine", "experience"] as const;

export type ActivityCategory = (typeof activityCategories)[number];

export const activityCategoryLabels: Record<ActivityCategory, string> = {
  water: "물놀이·온천",
  exhibition: "전시·박물관",
  view: "전망·탈것",
  themepark: "테마파크·놀이",
  marine: "바다 레저",
  experience: "체험",
  nature: "자연·명소",
};

export function isActivityCategory(value: string | null | undefined): value is ActivityCategory {
  return activityCategories.some((category) => category === value);
}

// 조건 태그. 날씨·동행에 따라 고르는 기준이라 분류와 따로 둔다.
export const activityTags = ["indoor", "kids", "free", "reservation"] as const;

export type ActivityTag = (typeof activityTags)[number];

export const activityTagLabels: Record<ActivityTag, string> = {
  indoor: "실내",
  kids: "아이와",
  free: "무료",
  reservation: "예약 필수",
};

export function isActivityTag(value: string): value is ActivityTag {
  return activityTags.some((tag) => tag === value);
}

export const operationStatuses = ["open", "seasonal_closed", "temporarily_closed", "closed"] as const;

export type OperationStatus = (typeof operationStatuses)[number];

/** 정상 운영이 아닐 때만 화면에 보이는 말. 정상(open)은 표시하지 않는다. */
export const operationStatusLabels: Record<OperationStatus, string> = {
  open: "운영 중",
  seasonal_closed: "시즌 휴장",
  temporarily_closed: "임시 휴업",
  closed: "운영 종료",
};

export function isOperationStatus(value: string): value is OperationStatus {
  return operationStatuses.some((status) => status === value);
}

export const ACTIVITY_LIST_PATH = "/places";

export function activityCategoryPath(category: ActivityCategory) {
  return `${ACTIVITY_LIST_PATH}/category/${category}`;
}

/** 상세에 바로 들어왔을 때 "목록으로 돌아가기"가 갈 목록. 그 장소 지역의 목록이다(속초는 /places, 2026-11-22). */
export function activityListPathForPlace(place: Pick<Place, "id" | "address">) {
  return placeRegionHref(ACTIVITY_LIST_PATH, choiceOfRegion(getPlaceRegion(place)));
}

export function activityPlacePath(slug: string) {
  return `${ACTIVITY_LIST_PATH}/${slug}`;
}

export function isActivityPlace(place: Place): place is ActivityPlace {
  return place.activityCategory !== null;
}

/**
 * 즐길거리 목록에 나올 장소. 분류가 있는 곳만 고르고, 분류 순서 → 지역(속초·고성·양양) → 정상 운영 먼저 → 이름순으로 놓는다.
 * 지역 순서는 고성·양양 명소를 더하며 넣었다. 이름순만으로는 속초 사이트의 목록 맨 위에 고성 해변이 먼저 나왔다(2026-11-22).
 * 운영을 끝낸 곳(closed)은 목록에서 빼고 상세 주소만 남긴다(검색으로 들어온 사람에게 끝났다고 알려 주려고 지우지 않는다).
 */
export function selectActivityPlaces(places: readonly Place[], category?: ActivityCategory): ActivityPlace[] {
  return places
    .filter(isActivityPlace)
    .filter((place) => place.operationStatus !== "closed")
    .filter((place) => category === undefined || place.activityCategory === category)
    .sort((a, b) =>
      activityCategories.indexOf(a.activityCategory) - activityCategories.indexOf(b.activityCategory)
      || regionOrder(a) - regionOrder(b)
      || Number(a.operationStatus !== "open") - Number(b.operationStatus !== "open")
      || a.name.localeCompare(b.name, "ko"));
}

/** 장소가 하나라도 있는 분류만, 화면 순서대로. 빈 분류의 칩과 페이지를 만들지 않는다. */
export function listActivityCategories(places: readonly Place[]): ActivityCategory[] {
  const used = new Set(selectActivityPlaces(places).map((place) => place.activityCategory));
  return activityCategories.filter((category) => used.has(category));
}

/**
 * 상세 아래의 "같은 분야의 다른 곳". 자기 자신을 빼고 정상 운영인 곳을 먼저 고른다.
 * 같은 지역의 장소를 먼저 둔다. 고성·양양 명소를 더한 뒤(2026-11-22) 이름순으로만 고르면 속초 해변 아래에 고성 해변이 먼저 나왔다.
 */
export function selectSimilarPlaces(current: ActivityPlace, places: readonly Place[], limit = 4): ActivityPlace[] {
  const region = getPlaceRegion(current);
  const candidates = selectActivityPlaces(places, current.activityCategory).filter((place) => place.id !== current.id);
  const sameRegion = candidates.filter((place) => getPlaceRegion(place) === region);
  return [...sameRegion, ...candidates.filter((place) => !sameRegion.includes(place))].slice(0, limit);
}

/** 정보 확인일 표기 "2026년 11월 확인". 날짜 문자열(YYYY-MM-DD)을 그대로 읽어 시간대에 따라 달이 바뀌지 않게 한다. */
export function formatVerifiedOn(verifiedOn: string | null) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(verifiedOn ?? "");
  if (match === null) return null;
  return `${match[1]}년 ${Number(match[2])}월 확인`;
}

/** DB의 유의사항 글(한 줄에 하나)을 줄마다 나눈다. 빈 줄은 버린다. */
export function parseCautions(value: string | null) {
  return (value ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
}

/**
 * 통합 검색(/search)의 "가볼만한 곳" 결과. 이름·소개·분류·주소·조건 태그에 검색어가 들어 있는 곳을 목록과 같은 순서로 돌려준다.
 * 이름에 들어 있는 곳을 앞에 둔다. 띄어쓰기를 무시해 "뮤지엄 엑스"로도 "뮤지엄엑스"를 찾는다.
 */
export function searchActivityPlaces(places: readonly Place[], query: string): ActivityPlace[] {
  const needle = compactSearchText(query);
  if (!needle) return [];
  const candidates = selectActivityPlaces(places);
  const nameMatches = candidates.filter((place) => compactSearchText(place.name).includes(needle));
  const otherMatches = candidates.filter((place) => !nameMatches.includes(place) && compactSearchText([
    place.summary,
    place.description,
    activityCategoryLabels[place.activityCategory],
    place.category,
    place.address,
    // 주소와 지역이 다른 장소(인제군 주소의 진부령미술관 → 고성)도 지역 이름으로 찾히게 지역 이름을 함께 본다(2026-11-22).
    regionLabel(place),
    ...place.tags.map((tag) => activityTagLabels[tag]),
  ].filter(Boolean).join(" ")).includes(needle));
  return [...nameMatches, ...otherMatches];
}

/** 지역 순서(속초·고성·양양). 지역을 모르는 장소는 맨 뒤다. */
function regionOrder(place: Pick<Place, "id" | "address">) {
  const region = getPlaceRegion(place);
  return region === null ? placeRegions.length : placeRegions.indexOf(region);
}

function regionLabel(place: Pick<Place, "id" | "address">) {
  const region = getPlaceRegion(place);
  return region === null ? null : placeRegionLabels[region];
}

function compactSearchText(value: string) {
  return value.replace(/\s+/g, "").toLocaleLowerCase("ko-KR");
}
