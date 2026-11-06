"use client";

import { statusControlStyles } from "@/features/events/admin/components/status-control-styles";
import { useEventReviewStatus } from "@/features/events/admin/components/use-event-review-status";
import { eventReviewStatusActionLabels, type EventReviewStatus } from "@/features/events/model/review-status";

const buttonTones: [EventReviewStatus, string][] = [
  ["published", "bg-emerald-700 text-white"],
  ["pending", "bg-slate-200 text-slate-800"],
  ["rejected", "bg-rose-100 text-rose-900"],
];

/** 상태 버튼 묶음. 상태는 부모가 useEventReviewStatus로 들고 있고, 여기서는 그리기만 한다. */
export function StatusButtons({
  status,
  isPending,
  error,
  onChange,
}: {
  status: EventReviewStatus;
  isPending: boolean;
  error: string | null;
  onChange: (status: EventReviewStatus) => void;
}) {
  return (
    <div className={statusControlStyles.controls} aria-label="공개 상태 변경" aria-busy={isPending}>
      {buttonTones.map(([buttonStatus, tone]) => (
        <button
          key={buttonStatus}
          type="button"
          disabled={isPending || status === buttonStatus}
          aria-pressed={status === buttonStatus}
          onClick={() => onChange(buttonStatus)}
          className={`${statusControlStyles.button} ${tone}`}
        >
          <span
            aria-hidden="true"
            className={`${statusControlStyles.spinner} ${isPending && status === buttonStatus ? "animate-spin" : "invisible"}`}
          />
          <span>{eventReviewStatusActionLabels[buttonStatus]}</span>
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

/** 행사 수정 화면처럼 상태 배지 없이 버튼만 있는 곳에서 쓴다. */
export function StatusControls({ id, current }: { id: string; current: EventReviewStatus }) {
  const { status, isPending, error, changeStatus } = useEventReviewStatus(id, current);
  return <StatusButtons status={status} isPending={isPending} error={error} onChange={changeStatus} />;
}
