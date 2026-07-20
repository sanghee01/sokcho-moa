import Image from "next/image";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { getAllPublicEvents } from "@/lib/data/events";
import { filterEvents, parseEventFilters } from "@/lib/domain/event";
import desktopBannerImage from "@/public/sokchomoa-banner-desktop-bg.webp";
import mobileBannerImage from "@/public/sokchomoa-banner-bg.webp";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function HeroBurst({ side }: { side: "left" | "right" }) {
  const rayColors = side === "left"
    ? ["bg-sky-500", "bg-sky-500", "bg-sky-500", "bg-sky-500"]
    : ["bg-amber-400", "bg-orange-400", "bg-teal-500", "bg-amber-400"];

  return (
    <span className={`relative size-[clamp(1.65rem,3.7vw,4rem)] shrink-0 -translate-y-[28%] ${side === "right" ? "-scale-x-100" : ""}`}>
      <span className={`absolute left-[46%] top-0 h-[36%] w-[13%] -rotate-6 rounded-full ${rayColors[0]}`} />
      <span className={`absolute left-[19%] top-[16%] h-[36%] w-[13%] -rotate-45 rounded-full ${rayColors[1]}`} />
      <span className={`absolute left-[4%] top-[48%] h-[36%] w-[13%] -rotate-[68deg] rounded-full ${rayColors[2]}`} />
      <span className={`absolute left-[60%] top-[19%] h-[32%] w-[12%] rotate-[28deg] rounded-full ${rayColors[3]}`} />
    </span>
  );
}

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
        <h1 id="home-hero-title" className="sr-only">요즘 속초에서 뭐하지?</h1>
        <p className="sr-only">행사·공연·체험·교육 정보를 한눈에 확인하세요.</p>
        <div className="relative h-[10.8rem] overflow-hidden bg-cyan-100 sm:h-[min(33.77vw,24rem)] lg:mx-auto lg:aspect-[5/1] lg:h-auto lg:max-w-[120rem]">
          <picture className="absolute inset-0">
            <source media="(min-width: 1024px)" srcSet={desktopBannerImage.src} type="image/webp" />
            <Image
              src={mobileBannerImage}
              alt=""
              fill
              priority
              placeholder="blur"
              sizes="100vw"
              className="object-cover object-center"
            />
          </picture>
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center px-2 sm:px-4">
            <div className="-translate-y-[2%] text-center">
              <div className="flex items-center justify-center gap-[clamp(0.25rem,1.2vw,1.5rem)]">
                <HeroBurst side="left" />
                <p className="whitespace-nowrap text-[clamp(1.6rem,5.3vw,5.15rem)] font-black leading-none tracking-[-0.045em] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                  <span className="text-[#07377a]">요즘 </span>
                  <span className="text-[#009c91]">속초</span>
                  <span className="text-[#07377a]">에서 뭐하지?</span>
                </p>
                <HeroBurst side="right" />
              </div>
              <p className="mt-[clamp(0.6rem,1.15vw,1.4rem)] text-[clamp(0.72rem,2.1vw,1.75rem)] font-medium tracking-[-0.035em] text-slate-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                행사 · 공연 · 체험 · 교육 정보를 한눈에
                <span className="ml-[clamp(0.35rem,0.8vw,0.8rem)] font-black tracking-[-0.25em] text-sky-500">≋≋</span>
              </p>
            </div>
          </div>
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
          <div className="mb-5">
            <div>
              <p className="text-sm font-bold text-teal-700">한눈에 비교하기</p>
              <h2 id="event-list-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">찾은 행사 {events.length}개</h2>
            </div>
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
