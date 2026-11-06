"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";

type PageErrorStateProps = {
  error: Error & { digest?: string };
  /** Next.js error boundary의 retry: 데이터를 다시 가져와 다시 그린다(reset은 다시 가져오지 않음). */
  retry: () => void;
  eyebrow: string;
  title: string;
  description: string;
  fallbackHref?: string;
  fallbackLabel?: string;
};

export function PageErrorState({
  error,
  retry,
  eyebrow,
  title,
  description,
  fallbackHref = "/",
  fallbackLabel = "행사 목록으로",
}: PageErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto min-h-[60vh] max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-bold text-rose-700">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black text-content-strong">{title}</h1>
      <p className="mt-4 leading-7 text-content-muted">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className={getButtonClassName({ variant: "primary", width: "content" })}
        >
          다시 시도
        </button>
        <Link
          href={fallbackHref}
          className={getButtonClassName({ variant: "secondary", width: "content" })}
        >
          {fallbackLabel}
        </Link>
      </div>
    </main>
  );
}
