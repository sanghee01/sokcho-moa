import Image from "next/image";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { getAllPublicEvents } from "@/lib/data/events";
import { filterEvents, parseEventFilters } from "@/lib/domain/event";
import bannerImage from "@/public/sokchomoa-banner.webp";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, allEvents] = await Promise.all([searchParams, getAllPublicEvents()]);
  const filters = parseEventFilters(params);
  const events = filterEvents(allEvents, filters).sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.eventStartAt.localeCompare(b.eventStartAt),
  );
  const demoMode = allEvents.some((event) => event.isDemo);

  return (
    <main id="main-content">
      <AnalyticsRuntime />
      <section aria-labelledby="home-hero-title" className="overflow-hidden bg-cyan-50">
        <h1 id="home-hero-title" className="sr-only">요즘 속초에서 뭐 하지?</h1>
        <p className="sr-only">행사·공연·체험·교육 정보를 한눈에 확인하세요.</p>
        <div className="relative h-[10.8rem] overflow-hidden bg-cyan-100 sm:h-[min(33.77vw,24rem)]">
          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-9 px-4 py-8 sm:px-6 sm:py-12">
        {demoMode && (
          <aside className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" aria-label="샘플 데이터 안내">
            <strong>샘플 데이터로 보는 화면입니다.</strong> 제목에 [샘플]이 붙은 행사는 실제 운영 정보가 아닙니다. 실제 Supabase 연결 후 검수·공개된 행사만 노출됩니다.
          </aside>
        )}

        <EventFilters params={params} filters={filters} />

        <section aria-labelledby="event-list-title">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-teal-700">한눈에 비교하기</p>
              <h2 id="event-list-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">찾은 행사 {events.length}개</h2>
            </div>
            {(Object.keys(filters).length > 0) && <p className="text-sm text-slate-500">필터 상태는 주소에 저장됩니다.</p>}
          </div>
          {events.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-teal-300 bg-white px-6 py-16 text-center">
              <p className="text-xl font-black text-slate-900">조건에 맞는 행사가 아직 없어요.</p>
              <p className="mt-2 text-slate-600">기간이나 대상 필터를 하나 줄여 다시 찾아보세요.</p>
              <Link href="/" className="mt-6 inline-block rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">모든 행사 보기</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
