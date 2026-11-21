import { ExternalLink, MapPin, Ticket } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import type { ActivityPlace } from "@/features/places/model/place";
import { analyticsData } from "@/lib/analytics/events";
import { createNaverMapUrl } from "@/lib/map";

/**
 * 즐길거리 상세의 버튼. 여기서 사지 않고 밖으로 보낸다: 공식 홈페이지(primary), 예매하기(accent, 예매처가 있을 때만), 길찾기(tonal).
 * 행사 상세의 `행사 안내`·`신청·예매`와 같은 색 규칙이다(.ai/DESIGN.md Button). 공식 홈페이지가 없으면 길찾기가 primary 자리를 잇지 않고 tonal로 남는다.
 */
export function PlaceActions({ place }: { place: ActivityPlace }) {
  const mapUrl = place.mapUrl ?? createNaverMapUrl(place.name, place.latitude, place.longitude);
  // 빈 문자열도 주소가 없는 것으로 본다.
  const officialUrl = place.officialUrl || null;
  const bookingUrl = place.bookingUrl || null;
  const base = { place_slug: place.slug, place_category: place.activityCategory };
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {bookingUrl !== null && (
        <a href={bookingUrl} target="_blank" rel="noreferrer" {...analyticsData("place_link_clicked", { ...base, link_type: "booking" })} className={`${getButtonClassName({ variant: "accent" })} min-w-0 flex-1 whitespace-nowrap`}>
          <Ticket {...iconProps} size={16} />예매하기<span className="sr-only">(새 창)</span>
        </a>
      )}
      {officialUrl !== null && (
        <a href={officialUrl} target="_blank" rel="noreferrer" {...analyticsData("place_link_clicked", { ...base, link_type: "official" })} className={`${getButtonClassName({ variant: "primary" })} min-w-0 flex-1 whitespace-nowrap`}>
          <ExternalLink {...iconProps} size={16} />공식 홈페이지<span className="sr-only">(새 창)</span>
        </a>
      )}
      <a href={mapUrl} target="_blank" rel="noreferrer" {...analyticsData("place_link_clicked", { ...base, link_type: "map" })} className={`${getButtonClassName({ variant: "tonal" })} min-w-0 flex-1 whitespace-nowrap`}>
        <MapPin {...iconProps} size={16} />길찾기<span className="sr-only">(새 창)</span>
      </a>
    </div>
  );
}
