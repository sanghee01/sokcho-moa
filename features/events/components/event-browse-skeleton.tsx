import { eventCardGridClassName } from "@/features/events/components/event-card";

const skeletonCards = Array.from({ length: 8 }, (_, index) => index);

// 분야 탭과 배너는 공통 틀(layout)에 있어 로딩 중에도 그대로 남는다. 여기서는 검색창과 목록 자리만 그린다.
// 실제 포스터 카드(EventCard)와 같은 자리를 차지해, 데이터가 들어와도 화면이 밀리지 않게 한다.
function EventCardSkeleton() {
  return (
    <div data-event-card-skeleton className="min-w-0">
      <div className="aspect-4/5 rounded-card bg-surface-muted" />
      <div className="mt-2.5 h-5 w-5/6 rounded-badge bg-skeleton" />
      <div className="mt-1.5 h-3.5 w-1/2 rounded-badge bg-surface-muted" />
    </div>
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
      <div aria-hidden="true" className="mx-auto max-w-6xl animate-pulse px-4 pb-8 pt-4 motion-reduce:animate-none sm:px-6 lg:pt-8">
        <div className="min-h-12 w-full rounded-full border border-line-input bg-surface lg:mx-auto lg:max-w-xl" />

        <div className="mt-6 lg:mt-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="h-7 w-44 rounded-badge bg-skeleton" />
            <div className="h-5 w-28 rounded-badge bg-surface-muted" />
          </div>
          <div className={eventCardGridClassName}>
            {skeletonCards.map((card) => <EventCardSkeleton key={card} />)}
          </div>
        </div>
      </div>

      <span className="sr-only" role="status">행사 목록을 불러오고 있습니다.</span>
    </main>
  );
}
