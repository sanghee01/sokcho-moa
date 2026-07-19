export default function EventLoading() {
  return (
    <main id="main-content" className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true" aria-label="행사 상세 불러오는 중">
      <div className="animate-pulse" aria-hidden="true">
        <div className="mb-6 h-5 w-56 rounded-full bg-teal-100" />
        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-teal-900/10 lg:grid-cols-2">
          <div className="min-h-72 bg-gradient-to-br from-cyan-100 via-slate-100 to-amber-100 lg:min-h-[32rem]" />
          <div className="flex min-h-80 flex-col justify-center space-y-5 p-6 sm:p-10">
            <div className="h-7 w-40 rounded-full bg-slate-200" />
            <div className="h-5 w-32 rounded-full bg-teal-100" />
            <div className="h-12 w-4/5 rounded-2xl bg-slate-200 sm:h-16" />
            <div className="h-7 w-full rounded-xl bg-slate-100" />
            <div className="flex gap-3"><div className="h-12 w-32 rounded-2xl bg-rose-100" /><div className="h-12 w-32 rounded-2xl bg-teal-100" /></div>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-4 h-8 w-36 rounded-xl bg-slate-200" />
          <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
            {[1, 2, 3, 4, 5].map((item) => <div key={item} className="grid gap-3 border-t border-slate-100 px-5 py-5 first:border-t-0 sm:grid-cols-[10rem_1fr]"><div className="h-5 w-24 rounded bg-slate-200" /><div className="h-5 w-3/4 rounded bg-slate-100" /></div>)}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="h-72 rounded-3xl bg-white ring-1 ring-slate-200" />
          <div className="h-72 rounded-3xl bg-teal-100" />
        </div>
      </div>
    </main>
  );
}
