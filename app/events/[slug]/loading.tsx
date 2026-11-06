/** 행사 상세 로딩 자리 표시. 실제 상세와 같은 배치(모바일: 포스터 → 제목 → 핵심 정보, lg: 2열)를 따른다. */
export default function EventLoading() {
  const block = "rounded-control bg-skeleton";

  return (
    <main id="main-content" className="mx-auto min-h-[70vh] max-w-6xl pb-28 lg:px-6 lg:pb-16 lg:pt-6" aria-busy="true" aria-label="행사 상세 불러오는 중">
      <div className="animate-pulse motion-reduce:animate-none lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-12" aria-hidden="true">
        <div className="h-60 bg-skeleton lg:h-128 lg:rounded-card" />
        <div className="px-4 pt-5 lg:px-0 lg:pt-0">
          <div className={`${block} h-4 w-32`} />
          <div className={`${block} mt-3 h-7 w-4/5`} />
          <div className="mt-5 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex gap-3">
                <div className={`${block} size-5 shrink-0`} />
                <div className={`${block} h-5 w-3/4`} />
              </div>
            ))}
          </div>
          <div className={`${block} mt-6 hidden h-11 w-full lg:block`} />
        </div>
      </div>
      <span className="sr-only" role="status">행사 정보를 불러오고 있습니다.</span>
    </main>
  );
}
