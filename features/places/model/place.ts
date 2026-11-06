/** 행사 상세의 "주변 명소"로 보여 주는 장소. */
export interface Place {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  officialUrl: string | null;
  mapUrl: string | null;
  isPublished: boolean;
}

/** 기준 위치에서 떨어진 거리를 붙인 명소. 좌표가 없는 행사는 지역으로만 고르므로 거리가 null이다. */
export type NearbyPlace = Place & { distanceKm: number | null };
