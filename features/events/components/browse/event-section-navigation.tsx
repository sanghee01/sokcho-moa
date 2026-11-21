"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/ui/transition-link";
import { CategoryNavigation } from "@/features/events/components/browse/category-navigation";

/**
 * 행사 탭 위쪽(.ai/DESIGN.md 행사 탭): "목록 | 월별 일정" 보기 전환과 그 아래 분야 탭.
 * 월별 일정은 헤더 버튼에서 행사 탭 안의 보기로 옮겼다. 서울문화포털이 분야 탭 옆에 문화달력을 두는 방식이다(2026-11-21 사용자 결정).
 * 분야를 고른 채 보기를 바꾸면 분야는 "전체"로 돌아간다. 월별 페이지 안에서는 분야 탭이 그 달 안에서 거른다(category-navigation.tsx).
 */
export function EventSectionNavigation() {
  const pathname = usePathname();
  const isMonthView = pathname.startsWith("/months");
  const views = [
    { href: "/", label: "목록", isCurrent: !isMonthView, pendingLabel: "행사 목록 불러오는 중" },
    { href: "/months", label: "월별 일정", isCurrent: isMonthView, pendingLabel: "이번 달 행사 불러오는 중" },
  ];
  return (
    <div className="space-y-3">
      <nav aria-label="행사 보기" className="grid grid-cols-2 rounded-control bg-surface-muted p-1 sm:inline-grid sm:w-80">
        {views.map((view) => (
          <TransitionLink
            key={view.href}
            href={view.href}
            pendingLabel={view.pendingLabel}
            showPendingIndicator={false}
            aria-current={view.isCurrent ? "page" : undefined}
            className={`inline-flex min-h-10 items-center justify-center rounded-control text-label ${view.isCurrent ? "bg-surface font-semibold text-content-strong shadow-floating" : "text-content-muted hover:text-content-strong"}`}
          >
            {view.label}
          </TransitionLink>
        ))}
      </nav>
      <CategoryNavigation />
    </div>
  );
}
