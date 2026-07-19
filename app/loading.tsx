export default function Loading() {
  return (
    <main id="main-content" aria-busy="true" aria-label="속초 행사 정보 불러오는 중">
      <section className="overflow-hidden bg-cyan-50 pb-6 sm:pb-8" aria-label="배너 불러오는 중">
        <div className="relative h-72 overflow-hidden bg-cyan-100 sm:h-[min(56.28vw,40rem)]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-cyan-200 via-amber-50 to-cyan-300" />
          <div className="absolute inset-0 flex animate-pulse items-center justify-center px-8" aria-hidden="true">
            <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
              <div className="mx-auto h-12 w-4/5 rounded-full bg-white/65 sm:h-20" />
              <div className="mx-auto h-5 w-1/2 rounded-full bg-white/55 sm:h-8" />
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto -mt-4 grid max-w-xl animate-pulse grid-cols-2 gap-3 px-4 sm:-mt-10 sm:px-6" aria-hidden="true">
          {[1, 2].map((item) => (
            <div key={item} className="h-[6.75rem] rounded-3xl bg-white shadow-xl ring-1 ring-teal-900/5 sm:h-[7.25rem]" />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl animate-pulse space-y-9 px-4 py-8 sm:px-6 sm:py-12" aria-hidden="true">
        <div className="h-56 rounded-3xl bg-white shadow-sm ring-1 ring-teal-900/5" />
        <section>
          <div className="mb-5 h-9 w-52 rounded-xl bg-teal-100" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-80 rounded-3xl bg-white shadow-sm" />)}
          </div>
        </section>
      </div>
    </main>
  );
}
