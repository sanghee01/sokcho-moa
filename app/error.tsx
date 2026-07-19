"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-sm font-bold text-rose-700">정보를 불러오지 못했습니다</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">잠시 뒤 다시 확인해 주세요.</h1>
      <p className="mt-4 leading-7 text-slate-600">환경 변수가 빠졌다면 `.env.example`의 Supabase 연결 설정을 확인하세요.</p>
      <button type="button" onClick={reset} className="mt-8 rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">다시 시도</button>
    </main>
  );
}
