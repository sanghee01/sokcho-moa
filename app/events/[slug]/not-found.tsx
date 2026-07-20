import Link from "next/link";

export default function EventNotFound() {
  return (
    <main id="main-content" className="mx-auto min-h-[60vh] max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-bold text-teal-700">행사 정보 없음</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">공개된 행사를 찾을 수 없어요.</h1>
      <p className="mt-4 leading-7 text-slate-600">행사가 비공개로 전환됐거나 주소가 바뀌었을 수 있습니다.</p>
      <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900">
        행사 목록으로
      </Link>
    </main>
  );
}
