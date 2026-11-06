import { ExternalLink, MapPin } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import type { NearbyPlace } from "@/features/places/model/place";
import { createNaverMapUrl } from "@/lib/map";
import { analyticsData } from "@/lib/analytics/events";

export function PlaceCard({ place }: { place: NearbyPlace }) {
  const mapUrl = place.mapUrl ?? createNaverMapUrl(place.name, place.latitude, place.longitude);
  return (
    <article className="flex flex-col rounded-card bg-surface p-4 ring-1 ring-line">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium text-primary-text">{place.category}</p>
          <h3 className="mt-0.5 text-title-3 text-content-strong">{place.name}</h3>
        </div>
        {place.distanceKm != null && <span className="whitespace-nowrap text-caption text-content-subtle tabular-nums">약 {place.distanceKm.toFixed(1)}km</span>}
      </div>
      <p className="text-label font-normal text-content-muted">{place.summary}</p>
      {place.address && <p className="mt-2 text-caption text-content-subtle">{place.address}</p>}
      {/* 두 버튼은 같은 폭에 바탕색으로 구분한다: 지도는 연한 파랑(tonal), 자세히 보기는 회색(neutral).
          테두리만 있거나 글자만 있던 예전 버튼은 눌러야 하는 곳으로 잘 보이지 않았다(2026-11-07 사용자 결정).
          lg에서는 카드가 4열로 좁아져 글자가 두 줄로 꺾이므로 세로로 쌓는다. */}
      <div className="mt-auto flex gap-2 pt-4 lg:flex-col">
        <a href={mapUrl} target="_blank" rel="noreferrer" {...analyticsData("map_link_clicked", { content_type: "nearby_place", place_name: place.name, link_position: "nearby_place_card" })} className={`${getButtonClassName({ variant: "tonal" })} min-w-0 flex-1 whitespace-nowrap`}>
          <MapPin {...iconProps} size={16} />지도에서 보기<span className="sr-only">(새 창)</span>
        </a>
        {place.officialUrl && (
          <a href={place.officialUrl} target="_blank" rel="noreferrer" {...analyticsData("nearby_place_clicked", { place_name: place.name, place_category: place.category, link_position: "nearby_place_card" })} className={`${getButtonClassName({ variant: "neutral" })} min-w-0 flex-1 whitespace-nowrap`}>
            <ExternalLink {...iconProps} size={16} />자세히 보기<span className="sr-only">(새 창)</span>
          </a>
        )}
      </div>
    </article>
  );
}
