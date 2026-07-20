import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { EventImage } from "@/components/event-image";
import { PlaceCard } from "@/components/place-card";
import { StatusBadges } from "@/components/status-badges";
import { getAllPublicEvents, getPublicEventBySlug, getPublicPlaces, getRelatedEvents } from "@/lib/data/events";
import { audienceLabels, applicationStateLabels, categoryLabels, formatDateRange, formatOperatingSchedule } from "@/lib/domain/format";
import { deriveApplicationState, deriveEventState } from "@/lib/domain/event";
import { createEventMapLinks, findNearbyPlaces } from "@/lib/domain/geo";
import { isKnownUnavailableOfficialUrl, isSameSourceUrl } from "@/lib/domain/source";

export const revalidate = 3600;

type EventPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const events = await getAllPublicEvents();
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) return { title: "행사를 찾을 수 없습니다" };
  const description = event.summary ?? `${event.title}의 기간, 장소, 신청 정보와 주변 명소를 확인하세요.`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { title: event.title, description, type: "article", images: event.imageUrl ? [event.imageUrl] : [] },
    twitter: { card: "summary_large_image", title: event.title, description, images: event.imageUrl ? [event.imageUrl] : [] },
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const [{ slug }, allEvents, places] = await Promise.all([params, getAllPublicEvents(), getPublicPlaces()]);
  const event = allEvents.find((item) => item.slug === slug) ?? null;
  if (!event) notFound();

  const nearbyPlaces = findNearbyPlaces(event, places);
  const relatedEvents = getRelatedEvents(event, allEvents);
  const eventState = deriveEventState(event);
  const applicationState = deriveApplicationState(event);
  const mapLinks = createEventMapLinks(
    event.locationName ?? event.title,
    event.address,
    event.latitude,
    event.longitude,
  );
  const availableOfficialUrl = event.officialUrl && !isKnownUnavailableOfficialUrl(event.officialUrl)
    ? event.officialUrl
    : null;
  const distinctOfficialUrl = availableOfficialUrl && !isSameSourceUrl(availableOfficialUrl, event.sourceUrl)
    ? availableOfficialUrl
    : null;
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.eventStartAt,
    endDate: event.eventEndAt ?? event.eventStartAt,
    eventStatus: eventState === "ended" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: event.locationName ? {
      "@type": "Place",
      name: event.locationName,
      address: event.address,
      geo: event.latitude != null && event.longitude != null ? { "@type": "GeoCoordinates", latitude: event.latitude, longitude: event.longitude } : undefined,
    } : undefined,
    organizer: event.organizer ? { "@type": "Organization", name: event.organizer } : undefined,
    image: event.imageUrl ? [event.imageUrl] : undefined,
    url: availableOfficialUrl ?? undefined,
    isAccessibleForFree: event.isFree ?? undefined,
  };

  const facts = [
    ["행사기간", formatDateRange(event.eventStartAt, event.eventEndAt)],
    ["운영일정", formatOperatingSchedule(event.operatingHours)],
    ["신청기간", event.applicationStartAt || event.applicationEndAt ? formatDateRange(event.applicationStartAt, event.applicationEndAt) : "별도 신청 없음"],
    ["신청상태", applicationStateLabels[applicationState]],
    ["장소", event.locationName ?? "원문 확인"],
    ["상세 주소", event.address ?? "원문 확인"],
    ["이용 요금", event.priceText ?? "원문 확인"],
    ["참여 대상", event.audiences.map((audience) => audienceLabels[audience]).join(" · ")],
    ["주최·주관", event.organizer ?? "원문 확인"],
    ["문의처", event.contact ?? "원문 확인"],
  ];

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AnalyticsRuntime viewedEventSlug={event.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="현재 위치" className="mb-6 text-sm text-slate-500">
        <Link href="/" className="font-bold text-teal-700 hover:underline">행사 목록</Link> <span aria-hidden="true">/</span> {event.title}
      </nav>

      {event.isDemo && (
        <aside className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>이 페이지는 샘플 행사입니다.</strong> 실제 방문·신청 정보가 아닙니다.
        </aside>
      )}

      <article>
        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-teal-900/10 lg:grid-cols-2">
          <div className="relative min-h-72 bg-slate-100 lg:min-h-[32rem]">
            <EventImage src={event.imageUrl} alt={event.title} priority fit="contain" />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <StatusBadges event={event} />
            <p className="mt-6 text-sm font-black text-teal-700">{categoryLabels[event.category]} · {event.audiences.map((audience) => audienceLabels[audience]).join(" · ")}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">{event.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{event.summary ?? "핵심 정보와 원문 출처를 확인하세요."}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {event.applicationUrl && <a href={event.applicationUrl} target="_blank" rel="noreferrer" data-analytics-event="application_link_clicked" data-event-slug={event.slug} className="rounded-2xl bg-rose-600 px-5 py-3 font-bold text-white">신청·예매 <span className="sr-only">(새 창)</span></a>}
              <a href={event.sourceUrl} target="_blank" rel="noreferrer" data-analytics-event="source_link_clicked" data-event-slug={event.slug} className="rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">공식 원문 <span className="sr-only">(새 창)</span></a>
            </div>
          </div>
        </div>

        <section aria-labelledby="facts-title" className="mt-10">
          <div className="mb-4">
            <p className="text-sm font-bold text-teal-700">먼저 확인하세요</p>
            <h2 id="facts-title" className="mt-1 text-2xl font-black text-slate-950">핵심 정보</h2>
          </div>
          <dl className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
            {facts.map(([label, value], index) => (
              <div key={label} className={`grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-5 ${index > 0 ? "border-t border-slate-100" : ""}`}>
                <dt className="font-bold text-slate-700">{label}</dt>
                <dd className="text-slate-950">{value}</dd>
              </div>
            ))}
            <div className="grid gap-2 border-t border-slate-100 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-5">
              <dt className="font-bold text-slate-700">공식 링크</dt>
              <dd className="flex flex-wrap gap-3 font-bold text-teal-700">
                <a href={event.sourceUrl} target="_blank" rel="noreferrer" data-analytics-event="source_link_clicked" data-event-slug={event.slug} className="underline underline-offset-4">공식 원문 <span className="sr-only">(새 창)</span></a>
                {distinctOfficialUrl && <a href={distinctOfficialUrl} target="_blank" rel="noreferrer" data-analytics-event="source_link_clicked" data-event-slug={event.slug} className="underline underline-offset-4">공식 안내 <span className="sr-only">(새 창)</span></a>}
                {event.applicationUrl && <a href={event.applicationUrl} target="_blank" rel="noreferrer" data-analytics-event="application_link_clicked" data-event-slug={event.slug} className="underline underline-offset-4">신청·예매 <span className="sr-only">(새 창)</span></a>}
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <section aria-labelledby="intro-title" className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
            <h2 id="intro-title" className="text-2xl font-black text-slate-950">행사 AI 요약</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{event.description ?? event.summary ?? "행사 AI 요약은 원문에서 확인해 주세요."}</p>
            <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <h3 className="font-black">참여 전 확인할 내용</h3>
              <p className="mt-1">방문하거나 신청하기 전 <a href={event.sourceUrl} target="_blank" rel="noreferrer" data-analytics-event="source_link_clicked" data-event-slug={event.slug} className="font-bold underline">{event.sourceName} 원문<span className="sr-only">(새 창)</span></a>을 확인하세요.</p>
            </div>
          </section>
          <section aria-labelledby="location-title" className="self-start rounded-3xl bg-teal-900 p-6 text-white sm:p-8">
            <p className="text-sm font-bold text-cyan-200">위치 및 길찾기</p>
            <h2 id="location-title" className="mt-1 text-2xl font-black">{event.locationName ?? "장소 확인 필요"}</h2>
            <p className="mt-4 leading-7 text-cyan-50">{event.address ?? "상세 주소는 원문에서 확인해 주세요."}</p>
            {mapLinks ? (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-cyan-100">
                <a href={mapLinks.naver} target="_blank" rel="noreferrer" data-analytics-event="map_link_clicked" data-event-slug={event.slug} className="underline underline-offset-4">{mapLinks.hasVerifiedCoordinates ? "네이버 지도에서 위치 확인" : "네이버 지도에서 검색"} <span className="sr-only">(새 창)</span></a>
              </div>
            ) : (
              <p className="mt-6 text-sm leading-6 text-cyan-100">정확한 주소를 확인한 뒤 지도와 길찾기를 제공합니다.</p>
            )}
          </section>
        </div>
      </article>

      {nearbyPlaces.length > 0 && (
        <section aria-labelledby="nearby-title" className="mt-14">
          <p className="text-sm font-bold text-teal-700">행사 전후로 함께</p>
          <h2 id="nearby-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">주변 명소 둘러보기</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {nearbyPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        </section>
      )}

      {relatedEvents.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14">
          <p className="text-sm font-bold text-teal-700">같은 기간·비슷한 대상</p>
          <h2 id="related-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">이 행사도 살펴보세요</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{relatedEvents.map((item) => <EventCard key={item.id} event={item} />)}</div>
        </section>
      )}
    </main>
  );
}
