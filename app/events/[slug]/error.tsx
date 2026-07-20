"use client";

import { PageErrorState } from "@/components/page-error-state";

export default function EventError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageErrorState
      error={error}
      reset={reset}
      eyebrow="행사 정보를 불러오지 못했습니다"
      title="상세 내용을 확인할 수 없어요."
      description="잠시 후 다시 시도하거나 행사 목록에서 다른 행사를 살펴보세요."
    />
  );
}
