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
