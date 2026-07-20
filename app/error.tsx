"use client";

import { PageErrorState } from "@/components/page-error-state";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageErrorState
      error={error}
      reset={reset}
      eyebrow="페이지를 불러오지 못했습니다"
      title="잠시 뒤 다시 확인해 주세요."
      description="일시적인 문제일 수 있어요. 다시 시도하거나 행사 목록으로 돌아가 주세요."
    />
  );
}
