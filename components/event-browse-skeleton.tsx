import { EventHeroFrame } from "@/components/event-hero-frame";

const skeletonCards = Array.from({ length: 6 }, (_, index) => index);
const detailRows = Array.from({ length: 4 }, (_, index) => index);
const sortOptions = ["게시순", "행사일순", "마감일순", "조회순"];

function EventCardSkeleton() {
  return (
    <article
      data-event-card-skeleton
      className="h-full overflow-hidden rounded-3xl border border-teal-900/10 bg-white shadow-sm"
    >
      <div className="flex h-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-cyan-100 via-slate-100 to-amber-100">
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="h-6 w-14 rounded-full bg-white/90" />
            <span className="h-6 w-16 rounded-full bg-white/75" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="h-7 w-14 rounded-full bg-teal-200" />
            <span className="h-7 w-16 rounded-full bg-cyan-100" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-5/6 rounded-lg bg-slate-200" />
            <div className="h-6 w-2/3 rounded-lg bg-slate-200" />
          </div>
          <dl className="grid gap-2 text-sm">
            {detailRows.map((row) => (
              <div key={row} className="flex items-center gap-2">
                <dt className="h-4 w-12 rounded bg-slate-200" />
                <dd className="h-4 flex-1 rounded bg-slate-100" />
              </div>
            ))}
          </dl>
          <div className="mt-auto border-t border-slate-100 pt-3">
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function EventBrowseSkeleton() {
  return (
    <main
      id="main-content"
      data-event-browse-skeleton
      aria-busy="true"
      aria-label="행사 목록 불러오는 중"
    >
      <section aria-hidden="true" className="overflow-hidden bg-cyan-50">
        <EventHeroFrame priority>
          <div className="-translate-y-[2%] animate-pulse space-y-[clamp(0.6rem,1.15vw,1.4rem)] text-center motion-reduce:animate-none">
            <div className="mx-auto h-[clamp(1.6rem,5.3vw,5.15rem)] w-[min(78vw,50rem)] rounded-2xl bg-white/65 shadow-sm" />
            <div className="mx-auto h-[clamp(0.72rem,2.1vw,1.75rem)] w-[min(62vw,32rem)] rounded-lg bg-white/55" />
          </div>
        </EventHeroFrame>
      </section>

      <div className="mx-auto max-w-6xl space-y-9 px-4 py-8 sm:px-6 sm:py-12">
        <section aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,23rem)_auto] xl:items-center xl:gap-5">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="h-8 w-40 rounded-xl bg-slate-200 sm:h-9 sm:w-48" />
              <div className="inline-flex shrink-0 items-center border-b border-slate-300">
                <div className="inline-flex min-h-11 items-center border-b-2 border-teal-200 px-3 text-base font-black text-transparent">진행중</div>
                <div className="inline-flex min-h-11 items-center border-b-2 border-slate-200 px-3 text-base font-black text-transparent">마감</div>
              </div>
            </div>

            <div className="relative min-h-10 w-full rounded-xl border border-slate-300 bg-white sm:min-h-11">
              <div className="absolute bottom-1 right-1 top-1 w-14 rounded-lg bg-teal-100" />
            </div>

            <div className="grid w-full grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-fit">
              {sortOptions.map((option) => (
                <div
                  key={option}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-100 px-1 text-sm font-bold text-transparent sm:px-3"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {skeletonCards.map((card) => <EventCardSkeleton key={card} />)}
          </div>
        </section>
      </div>

      <span className="sr-only" role="status">행사 목록을 불러오고 있습니다.</span>
    </main>
  );
}
