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
  const buttonCount = 1 + Number(officialUrl !== null) + Number(bookingUrl !== null);
  // 모바일은 두 칸 격자다. 버튼이 3개면 한 줄에 104px씩이라 "공식 홈페이지"가 들어가지 않아, 공식 홈페이지를 맨 위 한 줄로 두고
  // 예매하기·길찾기를 그 아래 두 칸에 둔다. 버튼이 하나면 한 줄을 다 쓴다. sm부터는 한 줄에 나란히 둔다(2026-11-21 사용자 피드백).
  // 화면 순서는 HTML 순서(공식 홈페이지 → 예매하기 → 길찾기) 그대로다. 예전에는 예매하기를 먼저 쓰고 모바일에서만 공식 홈페이지를 앞으로 당겨(order-first),
  // 넓은 화면에서는 예매하기가 먼저 놓이고 Tab 순서도 보이는 순서와 달랐다(2026-11-22 사용자 결정).
  const officialLayout = buttonCount === 3 ? "col-span-2" : "";
  const mapLayout = buttonCount === 1 ? "col-span-2" : "";
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
      {officialUrl !== null && (
        <a href={officialUrl} target="_blank" rel="noreferrer" {...analyticsData("place_link_clicked", { ...base, link_type: "official" })} className={`${getButtonClassName({ variant: "primary", hasLeadingIcon: true })} whitespace-nowrap sm:flex-1 ${officialLayout}`}>
          <ExternalLink {...iconProps} size={16} />공식 홈페이지<span className="sr-only">(새 창)</span>
        </a>
      )}
      {bookingUrl !== null && (
        <a href={bookingUrl} target="_blank" rel="noreferrer" {...analyticsData("place_link_clicked", { ...base, link_type: "booking" })} className={`${getButtonClassName({ variant: "accent", hasLeadingIcon: true })} whitespace-nowrap sm:flex-1`}>
          <Ticket {...iconProps} size={16} />예매하기<span className="sr-only">(새 창)</span>
        </a>
      )}
      <a href={mapUrl} target="_blank" rel="noreferrer" {...analyticsData("place_link_clicked", { ...base, link_type: "map" })} className={`${getButtonClassName({ variant: "tonal", hasLeadingIcon: true })} whitespace-nowrap sm:flex-1 ${mapLayout}`}>
        <MapPin {...iconProps} size={16} />길찾기<span className="sr-only">(새 창)</span>
      </a>
    </div>
  );
}
