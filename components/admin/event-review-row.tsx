"use client";

import { useState } from "react";
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
  event: { id: string; slug: string; title: string; sourceName: string; reviewStatus: ReviewStatus };
  performStatusChangeAction?: StatusChangeAction;
}) {
  const [reviewStatus, setReviewStatus] = useState(event.reviewStatus);

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4"><TransitionLink href={`/admin/events/${event.id}`} className="font-bold text-slate-950 hover:text-teal-700">{event.title}</TransitionLink><p className="mt-1 text-xs text-slate-500">/{event.slug}</p></td>
      <td className="px-4 py-4"><span className={statusControlStyles.badge}>{statusLabels[reviewStatus]}</span></td>
      <td className="px-4 py-4 text-slate-600">{event.sourceName}</td>
      <td className={statusControlStyles.actionCell}><StatusControls id={event.id} slug={event.slug} current={reviewStatus} onStatusChange={setReviewStatus} performStatusChangeAction={performStatusChangeAction} /></td>
    </tr>
  );
}
