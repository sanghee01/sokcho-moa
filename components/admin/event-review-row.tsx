"use client";

import { useState } from "react";
import { EventDeleteControl } from "@/components/admin/event-delete-control";
import { StatusControls } from "@/components/admin/status-controls";
import { statusControlStyles } from "@/components/admin/status-control-styles";
import { TransitionLink } from "@/components/transition-link";

type ReviewStatus = "pending" | "published" | "rejected";
type StatusChangeAction = (input: {
  id: string;
  slug: string;
  status: ReviewStatus;
}) => Promise<{ status: ReviewStatus }>;

const statusLabels: Record<ReviewStatus, string> = {
  pending: "검수 대기",
  published: "공개",
  rejected: "반려",
};

export function EventReviewRow({
  event,
  performStatusChangeAction,
}: {
  event: { id: string; slug: string; title: string; sourceName: string; viewCount: number; reviewStatus: ReviewStatus };
  performStatusChangeAction?: StatusChangeAction;
}) {
  const [reviewStatus, setReviewStatus] = useState(event.reviewStatus);

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4"><TransitionLink href={`/admin/events/${event.id}`} prefetch={false} className="font-bold text-slate-950 hover:text-teal-700">{event.title}</TransitionLink><p className="mt-1 text-xs text-slate-500">/{event.slug}</p></td>
      <td className="px-4 py-4 text-right font-bold tabular-nums text-slate-700">{Math.max(0, event.viewCount).toLocaleString("ko-KR")}회</td>
      <td className="px-4 py-4"><span className={statusControlStyles.badge}>{statusLabels[reviewStatus]}</span></td>
      <td className="px-4 py-4 text-slate-600">{event.sourceName}</td>
      <td className={statusControlStyles.actionCell}>
        <div className="flex items-start gap-2">
          <StatusControls id={event.id} slug={event.slug} current={reviewStatus} onStatusChange={setReviewStatus} performStatusChangeAction={performStatusChangeAction} />
          <EventDeleteControl event={event} />
        </div>
      </td>
    </tr>
  );
}
