"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEventReportAction, setEventReportReviewStatusAction } from "@/lib/actions/reports";
import type { EventReportReviewStatus } from "@/lib/domain/report";

type EventReportCardData = {
  id: string;
  title: string;
  body: string;
  sourceUrl: string | null;
  reviewStatus: EventReportReviewStatus;
  createdAt: string;
};

const statusMeta: Record<EventReportReviewStatus, { label: string; className: string }> = {
  pending: { label: "검토 대기", className: "bg-amber-50 text-amber-900" },
  reviewed: { label: "검토 완료", className: "bg-emerald-50 text-emerald-900" },
  rejected: { label: "철회", className: "bg-slate-100 text-slate-700" },
};

export function EventReportCard({ report }: { report: EventReportCardData }) {
  const router = useRouter();
  const [confirmedStatus, setConfirmedStatus] = useState(report.reviewStatus);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    confirmedStatus,
    (_, nextStatus: EventReportReviewStatus) => nextStatus,
  );
  const [isPending, startTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMeta = statusMeta[optimisticStatus];

  function updateStatus(status: "reviewed" | "rejected") {
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(status);
      try {
        const result = await setEventReportReviewStatusAction({ id: report.id, status });
        setConfirmedStatus(result.status);
        router.refresh();
      } catch {
        setError("상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  function deleteReport() {
    if (!window.confirm("이 제보를 삭제할까요? 삭제 후 복구할 수 없습니다.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteEventReportAction({ id: report.id });
        setIsDeleted(true);
        router.refresh();
      } catch {
        setError("제보를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  if (isDeleted) return null;

  return (
    <article className="rounded-2xl bg-white p-5 ring-1 ring-slate-200" aria-busy={isPending}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-black text-slate-950">{report.title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${currentMeta.className}`}>{currentMeta.label}</span>
      </div>
      <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{report.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {report.sourceUrl && <a href={report.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline underline-offset-4">제보 링크 <span className="sr-only">(새 창)</span></a>}
        <time className="text-slate-500" dateTime={report.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(report.createdAt))}</time>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="제보 검토 상태 변경">
        <button type="button" disabled={isPending || optimisticStatus === "reviewed"} onClick={() => updateStatus("reviewed")} className="rounded-xl bg-emerald-700 px-3.5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">검토 완료</button>
        <button type="button" disabled={isPending || optimisticStatus === "rejected"} onClick={() => updateStatus("rejected")} className="rounded-xl bg-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40">철회</button>
        <button type="button" disabled={isPending} onClick={deleteReport} className="rounded-xl bg-rose-50 px-3.5 py-2 text-sm font-bold text-rose-800 ring-1 ring-rose-200 disabled:cursor-not-allowed disabled:opacity-40">삭제</button>
      </div>
      <p className={error ? "mt-3 text-sm font-bold text-rose-700" : "sr-only"} role="status" aria-live="polite">
        {error ?? (isPending ? "변경 사항을 저장하고 있습니다." : "")}
      </p>
    </article>
  );
}
