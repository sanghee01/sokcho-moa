"use client";

import Image from "next/image";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSiteFeedbackAction, setSiteFeedbackReviewStatusAction } from "@/lib/actions/feedback";
import { deleteEventReportAction, setEventReportReviewStatusAction } from "@/lib/actions/reports";
import type { SiteFeedbackReviewStatus } from "@/lib/domain/feedback";

export type SubmissionReviewCardData = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  imageUrl?: string | null;
  reviewStatus: SiteFeedbackReviewStatus;
  createdAt: string;
};

type SubmissionKind = "event_report" | "site_feedback";

const statusMeta: Record<SiteFeedbackReviewStatus, { label: string; className: string }> = {
  pending: { label: "검토 대기", className: "bg-amber-50 text-amber-900" },
  reviewed: { label: "검토 완료", className: "bg-emerald-50 text-emerald-900" },
  rejected: { label: "철회", className: "bg-slate-100 text-slate-700" },
};

const kindMeta: Record<SubmissionKind, { noun: string; linkLabel: string }> = {
  event_report: { noun: "제보", linkLabel: "제보 링크" },
  site_feedback: { noun: "의견", linkLabel: "관련 링크" },
};

export function SubmissionReviewCard({
  submission,
  kind,
}: {
  submission: SubmissionReviewCardData;
  kind: SubmissionKind;
}) {
  const router = useRouter();
  const [confirmedStatus, setConfirmedStatus] = useState(submission.reviewStatus);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    confirmedStatus,
    (_, nextStatus: SiteFeedbackReviewStatus) => nextStatus,
  );
  const [isPending, startTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMeta = statusMeta[optimisticStatus];
  const labels = kindMeta[kind];

  function updateStatus(status: "reviewed" | "rejected") {
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(status);
      try {
        const result = kind === "event_report"
          ? await setEventReportReviewStatusAction({ id: submission.id, status })
          : await setSiteFeedbackReviewStatusAction({ id: submission.id, status });
        setConfirmedStatus(result.status);
        router.refresh();
      } catch {
        setError("상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  function deleteSubmission() {
    if (!window.confirm(`이 ${labels.noun}을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        if (kind === "event_report") await deleteEventReportAction({ id: submission.id });
        else await deleteSiteFeedbackAction({ id: submission.id });
        setIsDeleted(true);
        router.refresh();
      } catch {
        setError(`${labels.noun}을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.`);
      }
    });
  }

  if (isDeleted) return null;

  return (
    <article className="rounded-2xl bg-white p-5 ring-1 ring-slate-200" aria-busy={isPending}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-black text-slate-950">{submission.title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${currentMeta.className}`}>{currentMeta.label}</span>
      </div>
      <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{submission.body}</p>
      {submission.imageUrl && (
        <a href={submission.imageUrl} target="_blank" rel="noreferrer" className="mt-4 block w-fit overflow-hidden rounded-2xl ring-1 ring-slate-200 hover:ring-teal-300">
          <Image
            src={submission.imageUrl}
            alt={`${submission.title} 첨부 이미지`}
            width={640}
            height={360}
            unoptimized
            className="h-auto max-h-80 w-auto max-w-full object-contain"
          />
          <span className="block bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-600">첨부 이미지 크게 보기 <span className="sr-only">(새 창)</span></span>
        </a>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {submission.linkUrl && <a href={submission.linkUrl} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline underline-offset-4">{labels.linkLabel} <span className="sr-only">(새 창)</span></a>}
        <time className="text-slate-500" dateTime={submission.createdAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(submission.createdAt))}</time>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label={`${labels.noun} 검토 상태 변경`}>
        <button type="button" disabled={isPending || optimisticStatus === "reviewed"} onClick={() => updateStatus("reviewed")} className="rounded-xl bg-emerald-700 px-3.5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">검토 완료</button>
        <button type="button" disabled={isPending || optimisticStatus === "rejected"} onClick={() => updateStatus("rejected")} className="rounded-xl bg-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40">철회</button>
        <button type="button" disabled={isPending} onClick={deleteSubmission} className="rounded-xl bg-rose-50 px-3.5 py-2 text-sm font-bold text-rose-800 ring-1 ring-rose-200 disabled:cursor-not-allowed disabled:opacity-40">삭제</button>
      </div>
      <p className={error ? "mt-3 text-sm font-bold text-rose-700" : "sr-only"} role="status" aria-live="polite">
        {error ?? (isPending ? "변경 사항을 저장하고 있습니다." : "")}
      </p>
    </article>
  );
}
