import { getButtonClassName } from "@/components/ui/button-styles";
import { createNaverMapUrl, type NearbyPlace } from "@/features/events/model/location";
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
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <a href={mapUrl} target="_blank" rel="noreferrer" {...analyticsData("map_link_clicked", { content_type: "nearby_place", place_name: place.name, link_position: "nearby_place_card" })} className={getButtonClassName({ variant: "secondary" })}>지도에서 보기 <span className="sr-only">(새 창)</span></a>
        {place.officialUrl && <a href={place.officialUrl} target="_blank" rel="noreferrer" {...analyticsData("nearby_place_clicked", { place_name: place.name, place_category: place.category, link_position: "nearby_place_card" })} className={getButtonClassName({ variant: "ghost" })}>자세히 보기 <span className="sr-only">(새 창)</span></a>}
      </div>
    </article>
  );
}
