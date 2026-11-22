import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  activityPlacePath,
  type ActivityCategory,
} from "@/features/places/model/activity";
import type { ActivityPlace } from "@/features/places/model/place";
import { selectPlacePhoto } from "@/features/places/model/place-photo";
import { SITE_NAME } from "@/lib/seo/site-identity";

export const ACTIVITY_LIST_TITLE = "속초 가볼만한 곳";

function absoluteUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

/** 목록 페이지의 검색 결과 설명. 화면에는 쓰지 않는 문장이라 여기에만 둔다(.ai/DESIGN.md Do's and Don'ts). */
export function buildActivityListDescription(places: readonly ActivityPlace[], category?: ActivityCategory) {
  const names = places.slice(0, 4).map((place) => place.name).join(", ");
  const subject = category === undefined ? "속초 가볼만한 곳: 해변·호수 같은 명소와 워터파크, 전시, 전망대, 바다 레저" : `속초 ${activityCategoryLabels[category]}`;
  const examples = names ? ` ${names} 등의` : "";
  return `${subject} 정보를 모았습니다.${examples} 운영시간, 요금, 위치와 공식 홈페이지를 확인하세요.`;
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
 * 장소 상세의 검색 결과 설명(meta description). "속초 + 이름: 소개. 운영시간·요금·주차·위치를 확인하세요."
 * 예전에는 운영시간·요금 원문을 이어 붙여 160자에서 숫자 중간이 잘렸고(설악워터피아 "…소인 49,00"),
 * 시즌마다 바뀌는 날짜가 검색 결과에 낡은 채 남았다. 그래서 바뀌는 값 대신 이 페이지에서 확인할 수 있는 항목 이름만 쓴다(2026-11-21).
 * 위치는 모든 장소에 좌표가 있어 늘 넣는다.
 */
export function buildPlaceSeoDescription(place: ActivityPlace) {
  const summary = place.summary?.trim() ?? "";
  const lead = summary === "" ? `속초 ${place.name}` : `속초 ${place.name}: ${/[.!?]$/.test(summary) ? summary : `${summary}.`}`;
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

export function buildPlaceBreadcrumbStructuredData(place: ActivityPlace, siteUrl: string) {
  const pageUrl = absoluteUrl(activityPlacePath(place.slug), siteUrl);
  const items = [
    { name: SITE_NAME, path: "/" },
    { name: ACTIVITY_LIST_TITLE, path: ACTIVITY_LIST_PATH },
    { name: `속초 ${activityCategoryLabels[place.activityCategory]}`, path: activityCategoryPath(place.activityCategory) },
  ];
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
