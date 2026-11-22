import Image from "next/image";
import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { analyticsData } from "@/lib/analytics/events";
import { activityCategoryLabels, activityPlacePath } from "@/features/places/model/activity";
import type { ActivityPlace } from "@/features/places/model/place";
import { selectPlacePhoto } from "@/features/places/model/place-photo";
import { getPlaceRegionLabel } from "@/features/places/model/region";

/** 지도에서 "가볼만한 곳" 핀을 눌렀을 때 열리는 카드 내용(.ai/DESIGN.md 지도). 사진·분류·이름·요금과 상세로 가는 버튼이다. */
export function PlaceMapCard({ place }: { place: ActivityPlace }) {
  const photo = selectPlacePhoto(place);
  return (
    <div>
      {photo !== null && (
        // 바로 아래에 이름이 글로 있어 대체 텍스트를 비운다. 출처는 상세 페이지의 사진 아래에 있다.
        <Image src={photo.url} alt="" width={1080} height={720} unoptimized loading="lazy" className="aspect-3/2 w-full rounded-control bg-surface-muted object-cover" />
      )}
      {/* 분류 옆에 지역을 붙인다. 목록 줄("자연·명소 · 고성")과 같다(2026-11-22 리뷰: 전체 지역에서 어디인지 보이지 않았음). */}
      <p className="mt-3 text-caption font-medium text-primary-text">{[activityCategoryLabels[place.activityCategory], getPlaceRegionLabel(place)].filter(Boolean).join(" · ")}</p>
      <h3 className="mt-0.5 text-title-3 text-content-strong">{place.name}</h3>
      {place.summary !== null && <p className="mt-1 text-label font-normal text-content-muted">{place.summary}</p>}
      {place.priceSummary !== null && <p className="mt-1 truncate text-caption text-content-subtle">{place.priceSummary}</p>}
      <TransitionLink href={activityPlacePath(place.slug)} showPendingIndicator={false} {...analyticsData("select_content", { content_type: "place", content_id: place.slug, content_source: "event_map", place_category: place.activityCategory })} className={`${getButtonClassName({ variant: "primary" })} mt-4 w-full`}>
        자세히 보기
      </TransitionLink>
    </div>
  );
}
