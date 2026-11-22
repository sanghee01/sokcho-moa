import type { ActivityCategory, ActivityTag, OperationStatus } from "@/features/places/model/activity";

/**
 * 장소 한 곳. 즐길거리(가볼만한 곳) 목록·상세·지도·검색이 쓴다.
 * activityCategory가 null이면 사이트 어디에도 나오지 않는다. 행사 상세의 "주변 명소" 구역을 뺐기 때문이다(2026-11-21).
 */
export interface Place {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  /** 대표 사진. 우리 사이트에 올린 파일이면 "/places/<slug>.webp" 같은 경로다. */
  imageUrl: string | null;
  /** 사진 아래에 보이는 출처 문구. 사진이 있으면 반드시 있다(DB 제약). */
  imageCredit: string | null;
  /** 라이선스가 적힌 원본 페이지 */
  imageSourceUrl: string | null;
  /** 사진에 보이는 장면을 적은 대체 텍스트 */
  imageAlt: string | null;
  officialUrl: string | null;
  mapUrl: string | null;
  isPublished: boolean;
  activityCategory: ActivityCategory | null;
  tags: ActivityTag[];
  description: string | null;
  hoursSummary: string | null;
  closedSummary: string | null;
  priceSummary: string | null;
  phone: string | null;
  parkingSummary: string | null;
  /** 유의사항. DB에는 한 줄에 하나씩 적혀 있고 여기서는 줄마다 나눈 값이다. */
  cautions: string[];
  bookingUrl: string | null;
  operationStatus: OperationStatus;
  statusNote: string | null;
  /** 운영 안내가 맞는 마지막 날(YYYY-MM-DD). 지나면 화면에서 숨긴다(model/place-status.ts). null이면 늘 보인다. */
  statusNoteUntil: string | null;
  /** 정보를 마지막으로 확인한 날(YYYY-MM-DD) */
  verifiedOn: string | null;
}

/** 즐길거리 목록·상세에 나오는 장소. 분류가 정해져 있다. */
export type ActivityPlace = Place & { activityCategory: ActivityCategory };
