import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm font-bold text-teal-700">404</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">페이지를 찾을 수 없어요.</h1>
      <p className="mt-4 leading-7 text-slate-600">주소가 잘못 입력됐거나 페이지가 이동되었을 수 있습니다.</p>
      <Link href="/" className="mt-8 inline-block rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">행사 목록으로</Link>
    </main>
  );
}
