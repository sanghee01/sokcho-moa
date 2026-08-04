const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export default function PublicEventsLoading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="행사 목록 불러오는 중"
      className="min-h-[70vh]"
    >
      <div
        aria-hidden="true"
        className="h-[10.8rem] animate-pulse bg-cyan-100 motion-reduce:animate-none sm:h-[min(33.77vw,24rem)] lg:mx-auto lg:aspect-[5/1] lg:h-auto lg:max-w-[120rem]"
      />

      <div className="mx-auto max-w-6xl space-y-9 px-4 py-8 sm:px-6 sm:py-12">
        <section aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,23rem)_auto] xl:items-center xl:gap-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-44 rounded-xl bg-slate-200" />
              <div className="h-10 w-32 rounded-xl bg-slate-100" />
            </div>
            <div className="h-11 rounded-xl bg-white ring-1 ring-slate-200" />
            <div className="h-11 w-full rounded-xl bg-white ring-1 ring-slate-200 xl:w-72" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {skeletonCards.map((card) => (
              <article key={card} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="aspect-video bg-gradient-to-br from-cyan-100 via-slate-100 to-amber-100" />
                <div className="space-y-4 p-5">
                  <div className="flex gap-2">
                    <div className="h-7 w-14 rounded-full bg-teal-100" />
                    <div className="h-7 w-14 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-7 w-4/5 rounded-lg bg-slate-200" />
                  <div className="h-5 w-full rounded bg-slate-100" />
                  <div className="h-5 w-2/3 rounded bg-slate-100" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <span className="sr-only" role="status">행사 목록을 불러오고 있습니다.</span>
    </main>
  );
}
