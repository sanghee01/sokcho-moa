import Link from "next/link";
import { analyticsData } from "@/lib/analytics/events";
import { DEFAULT_EVENT_SORT, type EventFilters } from "@/features/events/model/event";
import { buildEventBrowseHref, type EventSearchParams } from "@/features/events/model/browse-url";

type EventSort = NonNullable<EventFilters["sort"]>;

// 정렬 칩은 두 개만 둔다(2026-11-06). 새로 올라온 행사는 목록의 "N" 표시로, 마감 순서는 "신청 마감 임박" 바로가기로 본다.
// URL의 sort=published·deadline은 예전 북마크와 바로가기를 위해 계속 동작한다(features/events/model/event.ts).
const sortOptions: { value: EventSort; label: string; title?: string }[] = [
  { value: "latest", label: "행사일순", title: "가까운 예정 행사부터 날짜별로, 이후 진행 중 행사" },
  { value: "views", label: "조회순" },
];

function sortHref(params: EventSearchParams, sort: EventSort) {
  // 기본 정렬은 주소에 남기지 않는다.
  return buildEventBrowseHref(params, { sort: sort === DEFAULT_EVENT_SORT ? undefined : sort });
}

export function EventSort({ params, activeSort }: { params: EventSearchParams; activeSort: EventFilters["sort"] }) {
  const resolvedSort = activeSort ?? DEFAULT_EVENT_SORT;

  return (
    // 기존 운영 화면처럼 정렬은 묶음 버튼(segmented control)으로, 진행중/마감은 밑줄 탭으로 두어 둘을 구분한다(2026-11-06).
    // 선택된 정렬은 흰 바탕만으로는 눈에 띄지 않아 바다색으로 채운다.
    <nav aria-label="행사 정렬" className="inline-flex rounded-control bg-surface-muted p-0.5">
      {sortOptions.map((option) => (
        <Link
          key={option.value}
          href={sortHref(params, option.value)}
          rel="nofollow"
          scroll={false}
          title={option.title}
          {...(resolvedSort !== option.value ? analyticsData("sort_changed", { sort_method: option.value }) : {})}
          aria-current={resolvedSort === option.value ? "page" : undefined}
          className={`relative inline-flex min-h-9 items-center rounded-badge px-3 text-label lg:min-h-10 lg:px-4 lg:text-body after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] ${resolvedSort === option.value
            ? "bg-primary font-semibold text-on-primary"
            : "text-content-subtle hover:text-content"}`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
