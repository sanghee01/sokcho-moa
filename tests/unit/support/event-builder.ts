import type { Event } from "@/features/events/model/event";
import type { Place } from "@/features/places/model/place";
import attractionCatalog from "@/data/attractions.json";

/** 테스트의 기준 시각. 2026-07-20 12:00 KST. 실행 시각과 무관하게 같은 결과가 나오게 고정한다. */
export const NOW = new Date("2026-07-20T03:00:00.000Z");

let sequence = 0;

/**
 * 테스트에 필요한 필드만 덮어쓰는 행사 builder. 기본값은 NOW 기준으로 진행 중이고,
 * 신청 절차가 없으며, 위치 정보가 없는 공개 행사다.
 */
export function makeEvent(overrides: Partial<Event> = {}): Event {
  sequence += 1;
  const slug = overrides.slug ?? `event-${sequence}`;
  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    slug,
    title: slug,
    summary: null,
    description: null,
    category: "festival",
    audiences: ["all"],
    eventStartAt: "2026-07-19T00:00:00.000Z",
    eventEndAt: "2026-07-25T00:00:00.000Z",
    operatingHours: null,
    applicationStartAt: null,
    applicationEndAt: null,
    applicationUrl: null,
    locationName: null,
    address: null,
    latitude: null,
    longitude: null,
    locationSourceUrl: null,
    locationVerifiedAt: null,
    priceText: null,
    isFree: null,
    organizer: null,
    contact: null,
    officialUrl: null,
    imageUrl: null,
    sourceName: "테스트 기관",
    sourceUrl: "https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=1",
    reviewStatus: "published",
    isFeatured: false,
    viewCount: 0,
    lastVerifiedAt: null,
    publishedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

/** 검증된 명소 원본(data/attractions.json)을 공개 조회와 같은 Place 형태로 바꾼 목록. */
export const catalogPlaces: Place[] = attractionCatalog.accepted.map((place) => ({
  id: place.id,
  slug: place.slug,
  name: place.name,
  category: place.category,
  summary: place.summary,
  address: place.address,
  latitude: place.latitude,
  longitude: place.longitude,
  imageUrl: place.imageUrl,
  officialUrl: place.officialUrl,
  mapUrl: place.mapUrl,
  isPublished: place.isPublished,
}));
