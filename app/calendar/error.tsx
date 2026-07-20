"use client";

import { PageErrorState } from "@/components/page-error-state";

export default function CalendarError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageErrorState
      error={error}
      reset={reset}
      eyebrow="캘린더를 불러오지 못했습니다"
      title="잠시 뒤 다시 확인해 주세요."
      description="행사 목록은 그대로 이용할 수 있어요. 다시 시도하거나 목록으로 돌아가 주세요."
    />
  );
}
