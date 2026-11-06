"use client";

import { applicationStateLabels, eventStateLabels } from "@/features/events/model/format";
import { deriveApplicationState, deriveEventState } from "@/features/events/model/event";
import type { EventStatusFields } from "@/features/events/model/status-fields";
import { useCurrentTime } from "@/features/events/components/use-current-time";

const tone = {
  ongoing: "bg-teal-700 text-white",
  upcoming: "bg-sky-100 text-sky-900",
  ended: "bg-slate-200 text-slate-700",
  open: "bg-emerald-100 text-emerald-900",
  closing_today: "bg-rose-100 text-rose-900",
  closed: "bg-slate-200 text-slate-700",
  not_applicable: "bg-white text-slate-600 ring-1 ring-slate-200",
} as const;

export function LiveStatusBadges({
  status,
  renderedAt,
  compact = false,
}: {
  status: EventStatusFields;
  renderedAt: string;
  compact?: boolean;
}) {
  const now = useCurrentTime(renderedAt);
  const eventState = deriveEventState(status, now);
  const applicationState = deriveApplicationState(status, now);
  const size = compact ? "text-xs" : "text-sm";
  return (
    <div className="flex flex-wrap gap-2" aria-label="행사 상태">
      <span className={`rounded-full px-2.5 py-1 font-bold ${size} ${tone[eventState]}`}>
        {eventStateLabels[eventState]}
      </span>
      {applicationState !== "upcoming" && (
        <span className={`rounded-full px-2.5 py-1 font-bold ${size} ${tone[applicationState]}`}>
          {applicationStateLabels[applicationState]}
        </span>
      )}
      {status.isFree && (
        <span className={`rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-950 ${size}`}>
          무료
        </span>
      )}
    </div>
  );
}

export function LiveApplicationStateLabel({ status, renderedAt }: { status: EventStatusFields; renderedAt: string }) {
  const now = useCurrentTime(renderedAt);
  return <>{applicationStateLabels[deriveApplicationState(status, now)]}</>;
}
