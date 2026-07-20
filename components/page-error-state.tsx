"use client";

import Link from "next/link";
import { useEffect } from "react";

type PageErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
  eyebrow: string;
  title: string;
  description: string;
  fallbackHref?: string;
  fallbackLabel?: string;
};

export function PageErrorState({
  error,
  reset,
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
      <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
      <p className="mt-4 leading-7 text-slate-600">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900"
        >
          다시 시도
        </button>
        <Link
          href={fallbackHref}
          className="inline-flex min-h-11 items-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
        >
          {fallbackLabel}
        </Link>
      </div>
    </main>
  );
}
