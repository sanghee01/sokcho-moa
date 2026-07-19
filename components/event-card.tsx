import Link from "next/link";
import { EventImage } from "./event-image";
import { StatusBadges } from "./status-badges";
import { audienceLabels, categoryLabels, formatDate, formatDateRange } from "@/lib/domain/format";
import { deriveApplicationState, type Event } from "@/lib/domain/event";

export function EventCard({ event }: { event: Event }) {
  const applicationState = deriveApplicationState(event);
  return (
    <article className="group overflow-hidden rounded-3xl border border-teal-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/events/${event.slug}`} className="block focus-visible:ring-4 focus-visible:ring-teal-300">
        <div className="relative aspect-[16/9] overflow-hidden">
          <EventImage src={event.imageUrl} alt={event.title} />
          <div className="absolute left-3 top-3">
            <StatusBadges event={event} compact />
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
            <span>{categoryLabels[event.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{event.audiences.map((audience) => audienceLabels[audience]).join(" · ")}</span>
          </div>
          <h2 className="text-xl font-black leading-snug text-slate-950 group-hover:text-teal-800">{event.title}</h2>
          <dl className="grid gap-2 text-sm text-slate-600">
            <div className="flex gap-2">
              <dt className="min-w-12 font-bold text-slate-800">기간</dt>
              <dd>{formatDateRange(event.eventStartAt, event.eventEndAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-12 font-bold text-slate-800">장소</dt>
              <dd>{event.locationName ?? "원문 확인"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-12 font-bold text-slate-800">요금</dt>
              <dd>{event.priceText ?? "원문 확인"}</dd>
            </div>
            {applicationState !== "not_applicable" && (
              <div className="flex gap-2">
                <dt className="min-w-12 font-bold text-slate-800">마감</dt>
                <dd>{formatDate(event.applicationEndAt)}</dd>
              </div>
            )}
          </dl>
          <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">출처: {event.sourceName}</p>
        </div>
      </Link>
    </article>
  );
}
