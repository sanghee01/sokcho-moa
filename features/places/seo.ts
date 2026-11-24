import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  activityPlacePath,
  type ActivityCategory,
} from "@/features/places/model/activity";
import type { ActivityPlace } from "@/features/places/model/place";
import { selectPlacePhoto } from "@/features/places/model/place-photo";
import { choiceOfRegion, DEFAULT_LIST_REGION, filterPlacesByRegion, getPlaceRegion, placeRegionHref, placeRegionLabels } from "@/features/places/model/region";
import { SITE_NAME } from "@/lib/seo/site-identity";

export const ACTIVITY_LIST_TITLE = "속초 가볼만한 곳";

function absoluteUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

/**
 * 목록 페이지의 검색 결과 설명. 화면에는 쓰지 않는 문장이라 여기에만 둔다(.ai/DESIGN.md Do's and Don'ts).
 * 예시 장소는 목록이 처음 보이는 지역(속초)에서 고른다. 제목 "속초 가볼만한 곳"과 화면에 맞춘다(2026-11-22).
 */
export function buildActivityListDescription(places: readonly ActivityPlace[], category?: ActivityCategory) {
  const defaultRegionPlaces = filterPlacesByRegion(places, DEFAULT_LIST_REGION);
  const names = (defaultRegionPlaces.length > 0 ? defaultRegionPlaces : places).slice(0, 4).map((place) => place.name).join(", ");
  const subject = category === undefined ? "속초 가볼만한 곳: 해변·호수 같은 명소와 워터파크, 전시, 전망대, 바다 레저" : `속초 ${activityCategoryLabels[category]}`;
  const examples = names ? ` ${names} 등의` : "";
  return `${subject} 정보를 모았습니다.${examples} 운영시간, 요금, 위치와 공식 홈페이지를 확인하세요.`;
}

/**
 * 분류 페이지(/places/category/*)의 검색 결과 제목. 그 분류의 속초 장소(목록이 처음 보이는 지역) 절반 이상에 있는 항목만 약속한다.
 * 예전에는 모든 분류가 "운영시간·요금 안내"였는데, 자연·명소는 대부분 운영시간이 없었다(2026-11-22 리뷰, 상세 제목과 같은 규칙).
 */
export function buildActivityCategorySeoTitle(places: readonly ActivityPlace[], category: ActivityCategory) {
  const inCategory = places.filter((place) => place.activityCategory === category);
  const defaultRegionPlaces = filterPlacesByRegion(inCategory, DEFAULT_LIST_REGION);
  const basis = defaultRegionPlaces.length > 0 ? defaultRegionPlaces : inCategory;
  const facts = [
    isCommonFact(basis, (place) => place.hoursSummary !== null) ? "운영시간" : null,
    isCommonFact(basis, (place) => place.priceSummary !== null) ? "요금" : null,
    "위치",
  ].filter((fact) => fact !== null).join("·");
  return `속초 ${activityCategoryLabels[category]} ${facts} 안내`;
}

/** 장소 절반 이상에 있는 항목인지 */
function isCommonFact(places: readonly ActivityPlace[], hasFact: (place: ActivityPlace) => boolean) {
  return places.length > 0 && places.filter(hasFact).length * 2 >= places.length;
}

/**
 * 장소 상세의 검색 결과 제목. "이름 운영시간·요금·위치 안내"에서 이 페이지에 없는 항목은 뺀다.
 * 예전에는 모든 장소가 "운영시간·요금"을 약속해, 운영시간이 없는 자연 명소 16곳은 검색 결과가 없는 정보를 내세웠다(2026-11-22 리뷰).
 */
export function buildPlaceSeoTitle(place: ActivityPlace) {
  const facts = [place.hoursSummary !== null ? "운영시간" : null, place.priceSummary !== null ? "요금" : null, "위치"]
    .filter((fact) => fact !== null)
    .join("·");
  return `${place.name} ${facts} 안내`;
}

/**
 * 장소 상세의 검색 결과 설명(meta description). "지역 + 이름: 소개. 운영시간·요금·주차·위치를 확인하세요."
 * 예전에는 운영시간·요금 원문을 이어 붙여 160자에서 숫자 중간이 잘렸고(설악워터피아 "…소인 49,00"),
 * 시즌마다 바뀌는 날짜가 검색 결과에 낡은 채 남았다. 그래서 바뀌는 값 대신 이 페이지에서 확인할 수 있는 항목 이름만 쓴다(2026-11-21).
 * 위치는 모든 장소에 좌표가 있어 늘 넣는다.
 */
export function buildPlaceSeoDescription(place: ActivityPlace) {
  const summary = place.summary?.trim() ?? "";
  // 고성·양양 장소는 그 지역 이름을 붙인다(2026-11-22). 이름이 이미 지역으로 시작하면("고성군 진부령미술관") 되풀이하지 않는다.
  const region = getPlaceRegion(place);
  const regionLabel = region === null ? "속초" : placeRegionLabels[region];
  const subject = place.name.startsWith(regionLabel) ? place.name : `${regionLabel} ${place.name}`;
  const lead = summary === "" ? subject : `${subject}: ${/[.!?]$/.test(summary) ? summary : `${summary}.`}`;
  const facts = [
    place.hoursSummary !== null ? "운영시간" : null,
    place.priceSummary !== null ? "요금" : null,
    place.parkingSummary !== null ? "주차" : null,
    "위치",
  ].filter((fact) => fact !== null).join("·");
  return `${lead} ${facts}를 확인하세요.`;
}

/**
 * 장소의 구조화 데이터(schema.org TouristAttraction).
 * 운영시간(openingHoursSpecification)은 넣지 않는다. 시즌마다 바뀌는 값을 기계가 읽는 형태로 틀리게 두느니 빼는 편이 낫다.
 * 별점(aggregateRating)도 넣지 않는다. 직접 받은 후기가 없고, 다른 사이트의 평점을 모아 싣는 것은 구글 정책 위반이다(2026-11-21).
 */
export function buildPlaceStructuredData(place: ActivityPlace, siteUrl: string) {
  const pageUrl = absoluteUrl(activityPlacePath(place.slug), siteUrl);
  const photo = selectPlacePhoto(place);
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": `${pageUrl}#place`,
    name: place.name,
    url: pageUrl,
    ...(place.description ?? place.summary ? { description: place.description ?? place.summary } : {}),
    ...(place.address ? { address: { "@type": "PostalAddress", streetAddress: place.address, addressCountry: "KR" } } : {}),
    geo: { "@type": "GeoCoordinates", latitude: place.latitude, longitude: place.longitude },
    ...(photo !== null ? { image: absoluteUrl(photo.url, siteUrl) } : {}),
    ...(place.phone ? { telephone: place.phone } : {}),
    ...(place.officialUrl ? { sameAs: [place.officialUrl] } : {}),
    ...(place.tags.includes("free") ? { isAccessibleForFree: true } : {}),
  };
}

/**
 * 가볼만한 곳 목록(/places)과 분류 목록(/places/category/*)의 구조화 데이터. 행사 분야 목록(features/events/topic-seo.ts)과 같은 모양으로,
 * 검색 결과에 "속초모아 › 속초 가볼만한 곳 › 속초 자연·명소" 같은 경로가 보이게 한다(2026-11-24). 목록이 처음 보이는 지역(속초)의 주소와 이름을 쓰고,
 * 장소 상세의 속초 경로(buildPlaceBreadcrumbItems)와 같다. places는 그 목록에 보이는 장소(selectActivityPlaces)다.
 */
export function buildActivityListStructuredData(places: readonly ActivityPlace[], siteUrl: string, category?: ActivityCategory) {
  const homeUrl = absoluteUrl("/", siteUrl);
  const listUrl = absoluteUrl(ACTIVITY_LIST_PATH, siteUrl);
  const pageUrl = category === undefined ? listUrl : absoluteUrl(activityCategoryPath(category), siteUrl);
  const name = category === undefined ? ACTIVITY_LIST_TITLE : `속초 ${activityCategoryLabels[category]}`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const crumbs = [
    { name: SITE_NAME, item: homeUrl },
    { name: ACTIVITY_LIST_TITLE, item: listUrl },
    ...(category === undefined ? [] : [{ name, item: pageUrl }]),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        url: pageUrl,
        name,
        description: buildActivityListDescription(places, category),
        inLanguage: "ko-KR",
        isPartOf: { "@id": `${homeUrl}#website` },
        breadcrumb: { "@id": breadcrumbId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.item })),
      },
    ],
  };
}

/**
 * 장소 상세의 경로(목록 → 분류). 장소 지역의 목록을 거친다: 고성 장소는 "고성 가볼만한 곳 / 고성 자연·명소"(2026-11-22 리뷰).
 * 예전에는 모든 장소가 "속초 …"를 거쳐 고성 장소의 경로가 속초를 말했다. 화면 읽기용 경로와 구조화 데이터가 함께 쓴다.
 */
export function buildPlaceBreadcrumbItems(place: ActivityPlace) {
  const region = getPlaceRegion(place);
  const regionLabel = region === null ? "전체" : placeRegionLabels[region];
  const choice = choiceOfRegion(region);
  return [
    { name: `${regionLabel} 가볼만한 곳`, path: placeRegionHref(ACTIVITY_LIST_PATH, choice) },
    { name: `${regionLabel} ${activityCategoryLabels[place.activityCategory]}`, path: placeRegionHref(activityCategoryPath(place.activityCategory), choice) },
  ];
}

export function buildPlaceBreadcrumbStructuredData(place: ActivityPlace, siteUrl: string) {
  const pageUrl = absoluteUrl(activityPlacePath(place.slug), siteUrl);
  const items = [{ name: SITE_NAME, path: "/" }, ...buildPlaceBreadcrumbItems(place)];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      ...items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path, siteUrl) })),
      { "@type": "ListItem", position: items.length + 1, name: place.name, item: pageUrl },
    ],
  };
}
