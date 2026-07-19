"use client";

export default function EventError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-black text-slate-950">행사 상세를 불러오지 못했습니다.</h1>
      <p className="mt-4 text-slate-600">연결 설정을 확인하거나 잠시 뒤 다시 시도해 주세요.</p>
      <button type="button" onClick={reset} className="mt-8 rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">다시 시도</button>
    </main>
  );
}
