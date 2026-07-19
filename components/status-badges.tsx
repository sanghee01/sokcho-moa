import { applicationStateLabels, eventStateLabels } from "@/lib/domain/format";
import { deriveApplicationState, deriveEventState, type Event } from "@/lib/domain/event";

const tone = {
  ongoing: "bg-teal-700 text-white",
  upcoming: "bg-sky-100 text-sky-900",
  ended: "bg-slate-200 text-slate-700",
  open: "bg-emerald-100 text-emerald-900",
  closing_today: "bg-rose-100 text-rose-900",
  closed: "bg-slate-200 text-slate-700",
  not_applicable: "bg-white text-slate-600 ring-1 ring-slate-200",
} as const;

export function StatusBadges({ event, compact = false }: { event: Event; compact?: boolean }) {
  const eventState = deriveEventState(event);
  const applicationState = deriveApplicationState(event);
  return (
    <div className="flex flex-wrap gap-2" aria-label="행사 상태">
      <span className={`rounded-full px-2.5 py-1 font-bold ${compact ? "text-xs" : "text-sm"} ${tone[eventState]}`}>
        {eventStateLabels[eventState]}
      </span>
      {applicationState !== "upcoming" && (
        <span className={`rounded-full px-2.5 py-1 font-bold ${compact ? "text-xs" : "text-sm"} ${tone[applicationState]}`}>
          {applicationStateLabels[applicationState]}
        </span>
      )}
      {event.isFree && (
        <span className={`rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-950 ${compact ? "text-xs" : "text-sm"}`}>
          무료
        </span>
      )}
    </div>
  );
}
