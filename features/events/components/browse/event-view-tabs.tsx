import { CalendarDays } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { analyticsData } from "@/lib/analytics/events";

export type EventViewTab = "active" | "closed" | "month";

// 진행중/마감/월별은 밑줄 탭, 정렬은 묶음 버튼으로 모양을 구분한다(.ai/DESIGN.md 페이지 구조 > 홈·주제 목록).
// 360px에서 정렬 묶음과 한 줄에 들어가게 모바일은 좌우 여백을 10px로 줄인다.
function viewTabClassName(isSelected: boolean) {
  return `-mb-px inline-flex min-h-11 items-center gap-1 border-b-2 px-2.5 text-label sm:px-3 lg:min-h-12 lg:px-4 lg:text-body ${isSelected
    ? "border-primary font-semibold text-primary-text"
    : "border-transparent text-content-subtle hover:text-content"}`;
}

/**
 * 행사 목록과 월별 페이지 위쪽의 "진행중 · 마감 · 월별" 탭. 예전에는 분야 탭 위에 "목록 | 월별 일정" 두 칸 버튼이 한 줄을 따로 차지했다.
 * 월별 일정도 같은 행사를 다르게 보는 방법이라 상태 탭 끝에 붙여 줄 하나를 없앴다(2026-11-21 사용자 결정: 시안 A).
 * 월별로 가거나 월별에서 나오면 분야는 "전체"로 돌아간다. 월별 페이지 안의 분야 탭은 그 달 안에서 거른다(category-navigation.tsx).
 * 이미 선택된 탭을 다시 누른 것은 GA에 세지 않는다. 정렬(sort_changed)과 같은 방식이다(2026-11-07).
 */
export function EventViewTabs({ current, activeHref, closedHref }: { current: EventViewTab; activeHref: string; closedHref: string }) {
  return (
    <nav aria-label="행사 상태" className="flex items-center">
      <TransitionLink
        href={activeHref}
        pendingLabel="진행중 행사 불러오는 중"
        showPendingIndicator={false}
        scroll={false}
        rel="nofollow"
        {...(current !== "active" ? analyticsData("status_tab_changed", { status_tab: "active" }) : {})}
        aria-current={current === "active" ? "page" : undefined}
        className={viewTabClassName(current === "active")}
      >
        진행중
      </TransitionLink>
      <TransitionLink
        href={closedHref}
        pendingLabel="마감 행사 불러오는 중"
        showPendingIndicator={false}
        scroll={false}
        rel="nofollow"
        {...(current !== "closed" ? analyticsData("status_tab_changed", { status_tab: "closed" }) : {})}
        aria-current={current === "closed" ? "page" : undefined}
        className={viewTabClassName(current === "closed")}
      >
        마감
      </TransitionLink>
      <TransitionLink
        href="/months"
        pendingLabel="이번 달 행사 불러오는 중"
        showPendingIndicator={false}
        aria-current={current === "month" ? "page" : undefined}
        className={viewTabClassName(current === "month")}
      >
        <CalendarDays {...iconProps} size={16} />
        월별
      </TransitionLink>
    </nav>
  );
}
