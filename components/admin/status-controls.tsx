"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setEventReviewStatusAction } from "@/lib/actions/admin";
import { statusControlStyles } from "@/components/admin/status-control-styles";

type ReviewStatus = "pending" | "published" | "rejected";
type StatusChangeAction = (input: {
  id: string;
  slug: string;
  status: ReviewStatus;
}) => Promise<{ status: ReviewStatus }>;

export function StatusControls({
  id,
  slug,
  current,
  onStatusChange,
  performStatusChangeAction = setEventReviewStatusAction,
}: {
  id: string;
  slug: string;
  current: string;
  onStatusChange?: (status: ReviewStatus) => void;
  performStatusChangeAction?: StatusChangeAction;
}) {
  const [confirmedStatus, setConfirmedStatus] = useState<ReviewStatus>(current as ReviewStatus);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    confirmedStatus,
    (_, nextStatus: ReviewStatus) => nextStatus,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = [
    ["published", "공개", "bg-emerald-700 text-white"],
    ["pending", "비공개", "bg-slate-200 text-slate-800"],
    ["rejected", "반려", "bg-rose-100 text-rose-900"],
  ] as const satisfies readonly [ReviewStatus, string, string][];

  function updateStatus(nextStatus: ReviewStatus) {
    const previousStatus = confirmedStatus;
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      onStatusChange?.(nextStatus);
      try {
        const result = await performStatusChangeAction({ id, slug, status: nextStatus });
        setConfirmedStatus(result.status);
      } catch {
        onStatusChange?.(previousStatus);
        setError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <div className={statusControlStyles.controls} aria-label="공개 상태 변경" aria-busy={isPending}>
      {actions.map(([status, label, tone]) => (
        <button
          key={status}
          type="button"
          disabled={isPending || optimisticStatus === status}
          aria-pressed={optimisticStatus === status}
          onClick={() => updateStatus(status)}
          className={`${statusControlStyles.button} ${tone}`}
        >
          <span
            aria-hidden="true"
            className={`${statusControlStyles.spinner} ${isPending && optimisticStatus === status ? "animate-spin" : "invisible"}`}
          />
          <span>{label}</span>
        </button>
      ))}
      <p
        className={error ? statusControlStyles.liveError : statusControlStyles.liveHidden}
        role="status"
        aria-live="polite"
      >
        {error ?? (isPending ? "변경 사항을 저장하고 있습니다." : "")}
      </p>
    </div>
  );
}
