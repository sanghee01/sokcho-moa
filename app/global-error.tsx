"use client";

import { PageErrorState } from "@/components/page-error-state";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <PageErrorState
          error={error}
          reset={reset}
          eyebrow="사이트를 불러오지 못했습니다"
          title="일시적인 문제가 발생했습니다."
          description="잠시 후 다시 시도해 주세요. 문제가 계속되면 브라우저를 새로고침해 주세요."
          fallbackLabel="처음으로"
        />
      </body>
    </html>
  );
}
