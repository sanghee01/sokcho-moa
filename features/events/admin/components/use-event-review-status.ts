"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setEventReviewStatusAction } from "@/features/events/admin/actions";
import type { EventReviewStatus } from "@/features/events/model/review-status";

const UNEXPECTED_ERROR = "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * 행사 하나의 검수 상태. 목록의 배지와 상태 버튼이 같은 값을 보도록 상태를 여기 한 곳에서만 들고 있는다.
 * 저장하는 동안에는 누른 상태를 먼저 보여 주고(useOptimistic), 실패하면 transition이 끝날 때 저장된 상태로 돌아간다.
 */
export function useEventReviewStatus(id: string, initialStatus: EventReviewStatus) {
  const [confirmedStatus, setConfirmedStatus] = useState(initialStatus);
  const [status, setOptimisticStatus] = useOptimistic(confirmedStatus, (_, nextStatus: EventReviewStatus) => nextStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeStatus(nextStatus: EventReviewStatus) {
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      try {
        const result = await setEventReviewStatusAction({ id, status: nextStatus });
        if (result.error !== null) {
          // 예상한 실패(시작 일시 없음, 이미 삭제됨 등)는 action이 알려 준 이유를 그대로 보여 준다.
          setError(result.error);
          return;
        }
        setConfirmedStatus(result.status);
      } catch {
        // 네트워크 오류처럼 예상하지 못한 실패
        setError(UNEXPECTED_ERROR);
      }
    });
  }

  return { status, isPending, error, changeStatus };
}
