"use client";

import { useEffect } from "react";
import { TransitionLink } from "@/components/transition-link";
import { getButtonClassName } from "@/components/ui/button-styles";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-bold text-rose-700">운영자 화면 오류</p>
      <h1 className="mt-2 text-3xl font-black text-content-strong">요청을 완료하지 못했습니다.</h1>
      <p className="mt-4 leading-7 text-content-muted">잠시 후 다시 시도해 보세요. 같은 문제가 반복되면 대시보드에서 다시 시작해 주세요.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={getButtonClassName({ variant: "primary", size: "medium", width: "content" })}>다시 시도</button>
        <TransitionLink href="/admin" className={getButtonClassName({ variant: "secondary", size: "medium", width: "content" })}>대시보드</TransitionLink>
      </div>
    </main>
  );
}
