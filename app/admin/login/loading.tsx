export default function AdminLoginLoading() {
  return (
    <main id="main-content" aria-busy="true" aria-label="로그인 화면을 불러오는 중" className="mx-auto max-w-md animate-pulse px-4 py-20 motion-reduce:animate-none">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="mt-3 h-9 w-56 rounded-xl bg-slate-200" />
      <div className="mt-8 space-y-5 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        {Array.from({ length: 2 }, (_, index) => <div key={index}><div className="h-4 w-20 rounded bg-slate-200" /><div className="mt-2 h-11 w-full rounded-xl bg-slate-200" /></div>)}
        <div className="h-12 w-full rounded-2xl bg-slate-300" />
      </div>
      <span className="sr-only" role="status">로그인 화면을 불러오고 있습니다.</span>
    </main>
  );
}
