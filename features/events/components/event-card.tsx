import Link from "next/link";
import { EventImage } from "@/features/events/components/event-image";
import { EventImagePlaceholder } from "@/features/events/components/event-image-placeholder";
import { StatusBadges } from "@/features/events/components/status-badges";
import { categoryLabels, formatShortDateRange } from "@/features/events/model/format";
import { deriveEventUnavailableReason, isRecentlyPublished, type Event } from "@/features/events/model/event";
import { analyticsData } from "@/lib/analytics/events";

/** 포스터 카드 격자: 모바일 2열, md 3열, lg 4열(.ai/DESIGN.md Components > EventCard). */
export const eventCardGridClassName = "grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4 lg:gap-x-5";

/** 포스터 위에 얹는 작은 글자 띠. 어떤 포스터 위에서도 읽히도록 거의 불투명한 흰 바탕을 쓴다. */
const posterTagClassName = "inline-flex max-w-full items-center rounded-badge bg-surface/95 px-1.5 py-0.5 text-caption font-medium text-content-strong";

/**
 * 행사 포스터 카드. 규칙의 원본은 .ai/DESIGN.md의 Components > EventCard다.
 * 포스터(4:5, 위쪽 기준으로 자름) 위에 분야(왼쪽 위), NEW(오른쪽 위), 날짜와 상태 배지(아래)를 얹고,
 * 포스터 아래에는 제목과 장소만 둔다. 카드 전체가 링크 하나다.
 * - 참여 대상(가족·성인·누구나)은 필터에도 없고 판단에 도움이 적어 카드에 쓰지 않는다(상세에만 둠, 2026-11-06).
 * - showCategory=false: 이미 분야를 고른 주제 페이지에서는 분야를 다시 쓰지 않는다.
 */
export function EventCard({
  event,
  contentSource = "event_list",
  headingLevel = 3,
  showCategory = true,
}: {
  event: Event;
  contentSource?: "event_list" | "related_events";
  headingLevel?: 3 | 4;
  showCategory?: boolean;
}) {
  const isUnavailable = deriveEventUnavailableReason(event) !== null;
  const isNew = !isUnavailable && isRecentlyPublished(event);
  const Heading = headingLevel === 4 ? "h4" : "h3";

  return (
    <article className="group min-w-0">
      <Link
        href={`/events/${event.slug}`}
        {...analyticsData("select_content", {
          content_type: "event",
          content_id: event.slug,
          content_source: contentSource,
          event_category: event.category,
        })}
        className="block focus-visible:rounded-card"
      >
        <div className="relative aspect-4/5 overflow-hidden rounded-card bg-surface-muted ring-1 ring-inset ring-line">
          <EventImage
            src={event.imageUrl}
            alt={event.title}
            muted={isUnavailable}
            position="top"
            sizes="(min-width: 1024px) 270px, (min-width: 768px) 33vw, 50vw"
            fallback={<EventImagePlaceholder />}
          />
          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            {showCategory ? (
              <ul aria-label="행사 분야" className={posterTagClassName}>
                <li>{categoryLabels[event.category]}</li>
              </ul>
            ) : <span />}
            {/* 새로 올라온 행사 표시. 상태 배지(최대 2개)와 자리를 다투지 않게 오른쪽 위에 따로 둔다(.ai/DESIGN.md 행사 상태의 색). */}
            {isNew && (
              <span className="shrink-0 rounded-badge bg-primary px-1.5 py-0.5 text-caption font-bold tracking-wide text-on-primary">
                NEW<span className="sr-only"> 새로 올라온 행사</span>
              </span>
            )}
          </div>
          <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center gap-1">
            <span className={`${posterTagClassName} tabular-nums`}>{formatShortDateRange(event.eventStartAt, event.eventEndAt)}</span>
            <StatusBadges event={event} />
          </div>
        </div>
        <Heading className={`mt-2.5 line-clamp-2 text-body font-semibold lg:mt-3 lg:text-title-3 ${isUnavailable ? "text-content-muted" : "text-content-strong group-hover:text-primary-text"}`}>
          {event.title}
        </Heading>
        <p className="mt-0.5 truncate text-caption text-content-subtle lg:mt-1 lg:text-label lg:font-normal">{event.locationName ?? "장소 원문 확인"}</p>
      </Link>
    </article>
  );
}
