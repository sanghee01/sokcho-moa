"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusControls } from "@/components/admin/status-controls";

type ReviewStatus = "pending" | "published" | "rejected";

const statusLabels: Record<ReviewStatus, string> = {
  pending: "검수 대기",
  published: "공개",
  rejected: "반려",
};

export function EventReviewRow({
  event,
}: {
  event: { id: string; slug: string; title: string; sourceName: string; reviewStatus: ReviewStatus };
}) {
  const [reviewStatus, setReviewStatus] = useState(event.reviewStatus);

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-4"><Link href={`/admin/events/${event.id}`} className="font-bold text-slate-950 hover:text-teal-700">{event.title}</Link><p className="mt-1 text-xs text-slate-500">/{event.slug}</p></td>
      <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{statusLabels[reviewStatus]}</span></td>
      <td className="px-4 py-4 text-slate-600">{event.sourceName}</td>
      <td className="px-4 py-4"><StatusControls id={event.id} slug={event.slug} current={reviewStatus} onStatusChange={setReviewStatus} /></td>
    </tr>
  );
}
