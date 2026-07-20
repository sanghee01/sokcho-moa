import Link from "next/link";
import { EventImage } from "./event-image";
import { StatusBadges } from "./status-badges";
import { audienceLabels, categoryLabels, formatDate, formatDateRange } from "@/lib/domain/format";
import { deriveApplicationState, type Event } from "@/lib/domain/event";
import { analyticsData } from "@/lib/analytics/events";

export function EventCard({ event, contentSource = "event_list" }: { event: Event; contentSource?: "event_list" | "related_events" }) {
  const applicationState = deriveApplicationState(event);
  const isApplicationClosed = applicationState === "closed";

  return (
    <article className={`group overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${isApplicationClosed ? "border-slate-300 bg-slate-100" : "border-teal-900/10 bg-white"}`}>
      <Link
        href={`/events/${event.slug}`}
        {...analyticsData("select_content", {
          content_type: "event",
          content_id: event.slug,
          content_source: contentSource,
          event_category: event.category,
        })}
        className="block focus-visible:ring-4 focus-visible:ring-teal-300"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <EventImage src={event.imageUrl} alt={event.title} muted={isApplicationClosed} />
          <div className="absolute left-3 top-3">
            <StatusBadges event={event} compact />
          </div>
          {isApplicationClosed && (
            <p className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-4 py-2.5 text-center text-sm font-black text-white">
              신청이 마감된 행사예요
            </p>
          )}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5" aria-label="행사 주제와 참여 대상">
            <span className={`rounded-full px-3 py-1.5 text-sm font-black leading-none shadow-sm ${isApplicationClosed ? "bg-slate-700 text-white" : "bg-teal-700 text-white"}`}>
              {categoryLabels[event.category]}
            </span>
            {event.audiences.map((audience) => (
              <span key={audience} className={`rounded-full px-3 py-1.5 text-sm font-black leading-none ring-1 ring-inset ${isApplicationClosed ? "bg-white text-slate-700 ring-slate-300" : "bg-cyan-50 text-teal-900 ring-teal-200"}`}>
                {audienceLabels[audience]}
              </span>
            ))}
          </div>
          <h2 className={`text-xl font-black leading-snug ${isApplicationClosed ? "text-slate-700 group-hover:text-slate-950" : "text-slate-950 group-hover:text-teal-800"}`}>{event.title}</h2>
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
