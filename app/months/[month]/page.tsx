import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { EventMonthView } from "@/features/events/components/month/event-month-view";
import {
  buildEventMonthSummary,
  formatEventMonthKey,
  getListedEventMonths,
  isEventMonthPublic,
  parseEventMonth,
  selectMonthEvents,
  shiftEventMonth,
} from "@/features/events/model/event-month";
import { buildMonthStructuredData, eventMonthTitle } from "@/features/events/month-seo";
import { getAllPublicEvents } from "@/features/events/queries";
import { getPublicEnv } from "@/lib/env";
import { INDEXABLE_ROBOTS, SITE_NAME, SITE_OPEN_GRAPH_IMAGE_PATH } from "@/lib/seo/site-identity";

// 요약 문장의 "오늘 기준" 수와 이번 달이 바뀌는 것을 반영하려고 다시 만든다(행사 상세와 같은 값).
// 실제 주기는 안에서 쓰는 행사 데이터 캐시(5분, features/events/queries.ts)를 따른다(빌드 결과로 확인, 2026-11-15).
export const revalidate = 3600;

export function generateStaticParams() {
  return getListedEventMonths().map((month) => ({ month: formatEventMonthKey(month) }));
}

const DESCRIPTION_MAX_CHARS = 160;

/** 주소의 월을 검증하고 그 달 행사를 고른다. 형식이 틀리거나 열지 않는 달이면 404다. */
async function loadEventMonth(value: string) {
  const month = parseEventMonth(value);
  if (!month) notFound();
  const allEvents = await getAllPublicEvents();
  const now = new Date();
  if (!isEventMonthPublic(month, allEvents, now)) notFound();
  const events = selectMonthEvents(allEvents, month);
  const otherMonths = [shiftEventMonth(month, -1), shiftEventMonth(month, 1)]
    .filter((other) => isEventMonthPublic(other, allEvents, now));
  return { month, events, otherMonths, now, summary: buildEventMonthSummary(month, events, now) };
}

export async function generateMetadata({ params }: PageProps<"/months/[month]">): Promise<Metadata> {
  const { month: value } = await params;
  const { month, summary } = await loadEventMonth(value);
  const title = eventMonthTitle(month);
  const description = summary.length <= DESCRIPTION_MAX_CHARS ? summary : `${summary.slice(0, DESCRIPTION_MAX_CHARS - 1).trimEnd()}…`;
  const path = `/months/${formatEventMonthKey(month)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OPEN_GRAPH_IMAGE_PATH],
    },
  };
}

export default async function EventMonthPage({ params }: PageProps<"/months/[month]">) {
  const { month: value } = await params;
  const { month, events, otherMonths, now, summary } = await loadEventMonth(value);

  return (
    <main id="main-content">
      <JsonLd data={buildMonthStructuredData(month, events, summary, getPublicEnv().NEXT_PUBLIC_SITE_URL)} />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:pt-10">
        <EventMonthView title={eventMonthTitle(month)} summary={summary} events={events} otherMonths={otherMonths} now={now} />
      </div>
    </main>
  );
}
