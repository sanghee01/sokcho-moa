import { createNaverMapUrl, type NearbyPlace } from "@/lib/domain/geo";

export function PlaceCard({ place }: { place: NearbyPlace }) {
  const mapUrl = place.mapUrl ?? createNaverMapUrl(place.name, place.latitude, place.longitude);
  return (
    <article className="rounded-2xl border border-teal-900/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-teal-700">{place.category}</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{place.name}</h3>
        </div>
        {place.distanceKm != null && <span className="whitespace-nowrap rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-teal-800">약 {place.distanceKm.toFixed(1)}km</span>}
      </div>
      <p className="text-sm leading-6 text-slate-600">{place.summary}</p>
      {place.address && <p className="mt-3 text-xs text-slate-500">{place.address}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
        <a href={mapUrl} target="_blank" rel="noreferrer" data-analytics-event="map_link_clicked" data-analytics-label={place.name} className="rounded-xl bg-teal-800 px-3 py-2 text-white">지도에서 보기 <span className="sr-only">(새 창)</span></a>
        {place.officialUrl && <a href={place.officialUrl} target="_blank" rel="noreferrer" data-analytics-event="nearby_place_clicked" data-analytics-label={place.name} className="rounded-xl border border-slate-200 px-3 py-2">자세히 보기 <span className="sr-only">(새 창)</span></a>}
      </div>
    </article>
  );
}
