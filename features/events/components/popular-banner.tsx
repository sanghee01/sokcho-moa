import Link from "next/link";
import { BannerCarousel } from "@/components/ui/banner-carousel";
import { EventImage } from "@/features/events/components/event-image";
import { EventImagePlaceholder } from "@/features/events/components/event-image-placeholder";
import { PosterBackdrop } from "@/features/events/components/poster-backdrop";
import { formatShortDateRange } from "@/features/events/model/format";
import type { Event } from "@/features/events/model/event";
import { analyticsData } from "@/lib/analytics/events";

// 배너 높이. 모바일 192px, sm 240px, lg 304px. 모든 장이 같은 높이를 쓴다.
const bannerHeightClassName = "h-48 sm:h-60 lg:h-76";

/**
 * 많이 보는 행사 한 장(A안, 2026-11-06 결정). 같은 포스터를 크게 흐려 배경으로 깔고, 위에 포스터 전체를 잘리지 않게 둔다.
 * 포스터 비율이 제각각이어도 잘려 보이지 않는다. 공연 예매 앱 상단 배너와 같은 방식이다. 장 전체가 상세로 가는 링크다.
 */
function PopularSlide({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      {...analyticsData("select_content", {
        content_type: "event",
        content_id: event.slug,
        content_source: "popular_events",
        event_category: event.category,
      })}
      className={`relative block overflow-hidden bg-content-strong ${bannerHeightClassName}`}
    >
      <PosterBackdrop imageUrl={event.imageUrl} />
      {/* md 이상에서는 좌우 넘김 버튼(왼쪽·오른쪽 12px + 40px)이 내용을 가리지 않게 안쪽 여백을 64px로 둔다(2026-11-06). */}
      <div className="relative mx-auto flex h-full max-w-6xl items-center gap-4 px-4 pb-7 pt-5 sm:px-6 md:px-16 lg:gap-10">
        <div className="min-w-0 flex-1 text-on-image">
          {/* 순위 숫자(1, 2, 3)는 붙이지 않는다(2026-11-06 사용자 결정). */}
          <p className="text-caption font-semibold opacity-90">지금 많이 보는 행사</p>
          <p className="mt-1 line-clamp-2 text-title-2 lg:text-title-1-lg">{event.title}</p>
          <p className="mt-1.5 truncate text-caption opacity-90 tabular-nums lg:text-body">
            {formatShortDateRange(event.eventStartAt, event.eventEndAt)} · {event.locationName ?? "장소 원문 확인"}
          </p>
        </div>
        <div className="relative aspect-3/4 h-full shrink-0 overflow-hidden rounded-control">
          <EventImage
            src={event.imageUrl}
            alt={event.title}
            fit="contain"
            sizes="(min-width: 1024px) 220px, 140px"
            fallback={<EventImagePlaceholder />}
          />
        </div>
      </div>
    </Link>
  );
}

/**
 * 목록 위쪽 배너(.ai/DESIGN.md 페이지 구조 > 홈·주제 목록). 모든 분야 탭에서 같은 "지금 많이 보는 행사"를 보여 준다.
 * 예전 일러스트 배너는 AI가 그린 것처럼 보여 뺐다(2026-11-06). 나중에 광고·공지를 넣을 때는 여기에 장을 더한다.
 */
export function PopularBanner({ events }: { events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <BannerCarousel
      label="지금 많이 보는 행사"
      slides={events.map((event) => <PopularSlide key={event.id} event={event} />)}
    />
  );
}
