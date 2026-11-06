"use client";

import { PageErrorState } from "@/components/layout/page-error-state";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <PageErrorState
      error={error}
      retry={retry}
      eyebrow="운영자 화면 오류"
      title="요청을 완료하지 못했습니다."
      description="잠시 후 다시 시도해 보세요. 같은 문제가 반복되면 대시보드에서 다시 시작해 주세요."
      fallbackHref="/admin"
      fallbackLabel="대시보드"
    />
  );
}
