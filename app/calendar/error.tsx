"use client";

import Link from "next/link";

export default function CalendarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-sm font-bold text-rose-700">캘린더를 불러오지 못했습니다</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">잠시 뒤 다시 확인해 주세요.</h1>
      <p className="mt-4 leading-7 text-slate-600">행사 목록은 그대로 이용할 수 있어요. 다시 시도하거나 목록으로 돌아가 주세요.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">다시 시도</button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700">행사 목록으로</Link>
      </div>
    </main>
  );
}
