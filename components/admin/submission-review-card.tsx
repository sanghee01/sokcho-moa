"use client";

import Image from "next/image";
import { useOptimistic, useState, useTransition } from "react";
import { formatSeoulDateTime } from "@/lib/seoul-time";
import { getStatusToggleClassName } from "@/components/admin/status-toggle-styles";
import {
  submissionReviewStatusLabels,
  type SubmissionReviewDecision,
  type SubmissionReviewStatus,
} from "@/components/admin/submission-review-status";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { getButtonClassName } from "@/components/ui/button-styles";
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

/** 검토 상태 배지의 색(.ai/DESIGN.md Badge). 검토가 필요한 대기는 테두리, 완료는 초록, 철회는 흐리게. */
const statusBadgeTones: Record<SubmissionReviewStatus, BadgeTone> = {
  pending: "neutral",
  reviewed: "success",
  rejected: "muted",
};

// 목적어 조사는 받침에 따라 달라서("제보를", "의견을") 계산하지 않고 완성된 말로 둔다.
// 예전에는 noun 뒤에 "을"을 붙여 "제보을"로 보였다(2026-11-07).
const kindMeta: Record<SubmissionKind, { noun: string; objectNoun: string; linkLabel: string }> = {
  event_report: { noun: "제보", objectNoun: "제보를", linkLabel: "제보 링크" },
  site_feedback: { noun: "의견", objectNoun: "의견을", linkLabel: "관련 링크" },
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
  // 빈 문자열도 첨부·링크가 없는 것으로 본다.
  const imageUrl = submission.imageUrl || null;
  const linkUrl = submission.linkUrl || null;

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
        setError(`${labels.objectNoun} 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.`);
      }
    });
  }

  if (isDeleted) return null;

  return (
    <article className="rounded-card bg-surface p-5 ring-1 ring-line" aria-busy={isPending}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-title-3 text-content-strong">{submission.title}</h3>
        <Badge tone={statusBadgeTones[optimisticStatus]}>{submissionReviewStatusLabels[optimisticStatus]}</Badge>
      </div>
      <p className="mt-3 whitespace-pre-line leading-7 text-content">{submission.body}</p>
      {imageUrl !== null && (
        <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-4 block w-fit overflow-hidden rounded-card ring-1 ring-line hover:ring-primary">
          <Image
            src={imageUrl}
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
        {linkUrl !== null && <a href={linkUrl} target="_blank" rel="noreferrer" className="font-bold text-primary-text underline underline-offset-4">{labels.linkLabel} <span className="sr-only">(새 창)</span></a>}
        <time className="text-content-subtle" dateTime={submission.createdAt}>{formatSeoulDateTime(new Date(submission.createdAt))}</time>
      </div>
      <div role="group" className="mt-5 flex flex-wrap gap-2" aria-label={`${labels.noun} 검토 상태 변경`}>
        <button
          type="button"
          disabled={isPending || optimisticStatus === "reviewed"}
          aria-pressed={optimisticStatus === "reviewed"}
          onClick={() => updateStatus("reviewed")}
          className={getStatusToggleClassName("success")}
        >
          검토 완료
        </button>
        <button
          type="button"
          disabled={isPending || optimisticStatus === "rejected"}
          aria-pressed={optimisticStatus === "rejected"}
          onClick={() => updateStatus("rejected")}
          className={getStatusToggleClassName("neutral")}
        >
          철회
        </button>
        {/* 삭제 버튼은 확인 창을 열기만 해서 secondary, 확인 창 안의 확정 버튼이 danger다(.ai/DESIGN.md Button). */}
        <ConfirmDialog
          triggerLabel="삭제"
          triggerDisabled={isPending}
          triggerClassName={getButtonClassName({ variant: "secondary" })}
          title={`${submission.title} 삭제`}
          description={`이 ${labels.objectNoun} 삭제하면 복구할 수 없습니다.`}
        >
          <ConfirmDialogActions>
            <ConfirmDialogButton variant="danger" onConfirm={deleteSubmission}>{labels.noun} 삭제</ConfirmDialogButton>
          </ConfirmDialogActions>
        </ConfirmDialog>
      </div>
      <p className={error ? "mt-3 text-label font-bold text-danger" : "sr-only"} role="status" aria-live="polite">
        {error ?? (isPending ? "변경 사항을 저장하고 있습니다." : "")}
      </p>
    </article>
  );
}
