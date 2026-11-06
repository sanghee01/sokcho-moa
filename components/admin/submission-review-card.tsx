"use client";

import Image from "next/image";
import { useOptimistic, useState, useTransition } from "react";
import { formatSeoulDateTime } from "@/lib/seoul-time";
import {
  submissionReviewStatusLabels,
  type SubmissionReviewDecision,
  type SubmissionReviewStatus,
} from "@/components/admin/submission-review-status";
import { ConfirmDialog, ConfirmDialogActions, ConfirmDialogButton } from "@/components/ui/confirm-dialog";
import type { ButtonActionResult } from "@/lib/action-state";

export interface SubmissionReviewCardData {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  imageUrl?: string | null;
  reviewStatus: SubmissionReviewStatus;
  createdAt: string;
}

type SubmissionKind = "event_report" | "site_feedback";

const statusClassNames: Record<SubmissionReviewStatus, string> = {
  pending: "bg-primary-subtle text-primary-text",
  reviewed: "bg-success-subtle text-success",
  rejected: "bg-surface-muted text-content",
};

const kindMeta: Record<SubmissionKind, { noun: string; linkLabel: string }> = {
  event_report: { noun: "제보", linkLabel: "제보 링크" },
  site_feedback: { noun: "의견", linkLabel: "관련 링크" },
};

/**
 * 방문자 제보·의견 검토 카드. 어떤 action으로 상태를 바꾸고 지울지는 화면을 조립하는 쪽(app/admin)이 넘긴다.
 * 공용 컴포넌트가 feature의 action을 직접 import하지 않게 하려는 것이다.
 */
export function SubmissionReviewCard({
  submission,
  kind,
  setReviewStatus,
  deleteSubmission: deleteAction,
}: {
  submission: SubmissionReviewCardData;
  kind: SubmissionKind;
  setReviewStatus: (input: { id: string; status: SubmissionReviewDecision }) => Promise<ButtonActionResult<{ status: SubmissionReviewStatus }>>;
  deleteSubmission: (input: { id: string }) => Promise<ButtonActionResult>;
}) {
  const [confirmedStatus, setConfirmedStatus] = useState(submission.reviewStatus);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    confirmedStatus,
    (_, nextStatus: SubmissionReviewStatus) => nextStatus,
  );
  const [isPending, startTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = kindMeta[kind];

  function updateStatus(status: SubmissionReviewDecision) {
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(status);
      try {
        const result = await setReviewStatus({ id: submission.id, status });
        if (result.error !== null) {
          setError(result.error);
          return;
        }
        setConfirmedStatus(result.status);
      } catch {
        setError("상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  function deleteSubmission() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAction({ id: submission.id });
        if (result.error !== null) {
          setError(result.error);
          return;
        }
        setIsDeleted(true);
      } catch {
        setError(`${labels.noun}을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.`);
      }
    });
  }

  if (isDeleted) return null;

  return (
    <article className="rounded-card bg-surface p-5 ring-1 ring-line" aria-busy={isPending}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-title-3 font-bold text-content-strong">{submission.title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-caption font-bold ${statusClassNames[optimisticStatus]}`}>{submissionReviewStatusLabels[optimisticStatus]}</span>
      </div>
      <p className="mt-3 whitespace-pre-line leading-7 text-content">{submission.body}</p>
      {submission.imageUrl && (
        <a href={submission.imageUrl} target="_blank" rel="noreferrer" className="mt-4 block w-fit overflow-hidden rounded-card ring-1 ring-line hover:ring-primary">
          <Image
            src={submission.imageUrl}
            alt={`${submission.title} 첨부 이미지`}
            width={640}
            height={360}
            unoptimized
            className="h-auto max-h-80 w-auto max-w-full object-contain"
          />
          <span className="block bg-surface-subtle px-3 py-2 text-center text-caption font-bold text-content-muted">첨부 이미지 크게 보기 <span className="sr-only">(새 창)</span></span>
        </a>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-label">
        {submission.linkUrl && <a href={submission.linkUrl} target="_blank" rel="noreferrer" className="font-bold text-primary-text underline underline-offset-4">{labels.linkLabel} <span className="sr-only">(새 창)</span></a>}
        <time className="text-content-subtle" dateTime={submission.createdAt}>{formatSeoulDateTime(new Date(submission.createdAt))}</time>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label={`${labels.noun} 검토 상태 변경`}>
        <button type="button" disabled={isPending || optimisticStatus === "reviewed"} onClick={() => updateStatus("reviewed")} className="rounded-control bg-success px-3.5 py-2 text-label font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-40">검토 완료</button>
        <button type="button" disabled={isPending || optimisticStatus === "rejected"} onClick={() => updateStatus("rejected")} className="rounded-control bg-surface-muted px-3.5 py-2 text-label font-bold text-content disabled:cursor-not-allowed disabled:opacity-40">철회</button>
        <ConfirmDialog
          triggerLabel="삭제"
          triggerDisabled={isPending}
          triggerClassName="rounded-control bg-danger-subtle px-3.5 py-2 text-label font-bold text-danger ring-1 ring-danger-subtle disabled:cursor-not-allowed disabled:opacity-40"
          title={`${submission.title} 삭제`}
          description={`이 ${labels.noun}을 삭제하면 복구할 수 없습니다.`}
        >
          <ConfirmDialogActions>
            <ConfirmDialogButton tone="danger" onConfirm={deleteSubmission}>{labels.noun} 삭제</ConfirmDialogButton>
          </ConfirmDialogActions>
        </ConfirmDialog>
      </div>
      <p className={error ? "mt-3 text-label font-bold text-danger" : "sr-only"} role="status" aria-live="polite">
        {error ?? (isPending ? "변경 사항을 저장하고 있습니다." : "")}
      </p>
    </article>
  );
}
