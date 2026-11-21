import type { Place } from "@/features/places/model/place";

/** 화면에 실을 수 있는 장소 사진. 출처 문구가 있는 사진만 이 타입이 된다. */
export interface PlacePhoto {
  url: string;
  /** 목록 줄에 쓰는 정사각 썸네일. 우리 사이트에 올린 사진에만 있다. */
  thumbnailUrl: string | null;
  credit: string;
  sourceUrl: string | null;
  alt: string;
}

// 우리 사이트에 올린 장소 사진의 이름 규칙: public/places/<slug>.webp 옆에 <slug>-thumb.webp(240×240)를 둔다.
// 행사 포스터 썸네일(features/events/model/event-image-thumbnail.ts)과 같은 방식이다.
const OWN_PHOTO_PATTERN = /^\/places\/([a-z0-9-]+)\.webp$/;

/** 우리 사이트에 올린 사진의 썸네일 경로. 바깥 주소(관리자가 넣은 URL)는 썸네일이 없어 null. */
export function getPlaceThumbnailUrl(imageUrl: string) {
  const name = OWN_PHOTO_PATTERN.exec(imageUrl)?.[1];
  return name === undefined ? null : `/places/${name}-thumb.webp`;
}

/**
 * 장소의 사진을 화면용으로 고른다. 사진 주소가 없거나 출처 문구가 없으면 null이다.
 * 출처 없는 사진은 싣지 않는다. 재게시 조건이 출처 표시라서, 표시 없이 보이면 라이선스 위반이 된다(2026-11-21).
 */
export function selectPlacePhoto(place: Pick<Place, "name" | "imageUrl" | "imageCredit" | "imageSourceUrl" | "imageAlt">): PlacePhoto | null {
  const url = place.imageUrl?.trim();
  const credit = place.imageCredit?.trim();
  if (!url || !credit) return null;
  return {
    url,
    thumbnailUrl: getPlaceThumbnailUrl(url),
    credit,
    sourceUrl: place.imageSourceUrl?.trim() || null,
    // 장면을 적은 글이 없으면 이름으로 대신한다. "대표 이미지" 같은 뜻 없는 말은 쓰지 않는다.
    alt: place.imageAlt?.trim() || place.name,
  };
}
