"use client";

import { EventDeleteControl } from "@/features/events/admin/components/event-delete-control";
import { StatusButtons } from "@/features/events/admin/components/status-controls";
import { statusControlStyles } from "@/features/events/admin/components/status-control-styles";
import { useEventReviewStatus } from "@/features/events/admin/components/use-event-review-status";
import type { AdminEventListItem } from "@/features/events/admin/mappers";
import { eventReviewStatusLabels } from "@/features/events/model/review-status";
import { TransitionLink } from "@/components/ui/transition-link";

/** 관리자 행사 목록의 한 행. 상태 배지와 상태 버튼은 같은 useEventReviewStatus 값을 본다. */
export function EventReviewRow({ event }: { event: AdminEventListItem }) {
  const { status, isPending, error, changeStatus } = useEventReviewStatus(event.id, event.reviewStatus);

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4"><TransitionLink href={`/admin/events/${event.id}`} prefetch={false} className="font-bold text-slate-950 hover:text-teal-700">{event.title}</TransitionLink><p className="mt-1 text-xs text-slate-500">/{event.slug}</p></td>
      <td className="px-4 py-4 text-right font-bold tabular-nums text-slate-700">{Math.max(0, event.viewCount).toLocaleString("ko-KR")}회</td>
      <td className="px-4 py-4"><span className={statusControlStyles.badge}>{eventReviewStatusLabels[status]}</span></td>
      <td className="px-4 py-4 text-slate-600">{event.sourceName}</td>
      <td className={statusControlStyles.actionCell}>
        <div className="flex items-start gap-2">
          <StatusButtons status={status} isPending={isPending} error={error} onChange={changeStatus} />
          <EventDeleteControl event={event} />
        </div>
      </td>
    </tr>
  );
}
