"use client";

import { usePathname } from "next/navigation";
import { useOptimistic } from "react";
import { TransitionLink } from "@/components/ui/transition-link";
import { categoryLabels, eventCategories } from "@/features/events/model/taxonomy";

const topicLinks = [
  { href: "/", label: "전체" },
  ...eventCategories.map((category) => ({
    href: `/topics/${category}`,
    label: categoryLabels[category],
  })),
];

// 월별 행사 페이지 주소(/months/2026-11, /months/2026-11/education)에서 달 부분.
const MONTH_PATH_PATTERN = /^\/months\/(\d{4}-(?:0[1-9]|1[0-2]))(?:\/[^/]+)?$/;

/**
 * 주소에 맞는 분야 탭 링크. 홈·분야 목록에서는 분야 목록(/topics/*)으로 가고, 월별 페이지에서는 같은 달 안에서 분야만 거른다
 * (2026-11-15 사용자 결정: 월별 페이지도 홈과 같은 헤더를 쓰고 탭을 누르면 그 달의 그 분야를 본다). 상세·제보·관리자에는 탭이 없다.
 */
function getCategoryLinks(pathname: string) {
  const monthKey = MONTH_PATH_PATTERN.exec(pathname)?.[1];
  if (monthKey !== undefined) {
    return [
      { href: `/months/${monthKey}`, label: "전체" },
      ...eventCategories.map((category) => ({ href: `/months/${monthKey}/${category}`, label: categoryLabels[category] })),
    ];
  }
  return pathname === "/" || pathname.startsWith("/topics/") ? topicLinks : null;
}

/**
 * 행사 분야 탭(.ai/DESIGN.md Components > Tabs). 전역 헤더 안에 있고 목록·월별 주소에서만 보인다.
 * 헤더와 함께 화면 위에 고정되어, 목록을 내려 보다가도 바로 분야를 바꿀 수 있다(2026-11-07 사용자 결정).
 * lg는 로고 오른쪽 한 줄, 그보다 좁으면 로고 아래 줄이다. 7개가 한 줄에 다 들어가게 모바일은 같은 폭으로 나누고,
 * 좌우 스크롤은 쓰지 않는다(2026-11-06).
 * 검은 배경 칩은 무거워 보여 밑줄 탭으로 바꿨다가, 밑줄로는 현재 탭이 잘 안 보여 바다색 알약으로 바꿨다(2026-11-06).
 * E2E가 이 이름("주요 메뉴")과 링크 순서를 확인한다.
 */
export function CategoryNavigation() {
  const pathname = usePathname();
  // 목록에는 로딩 화면이 없어 응답이 올 때까지 이전 목록이 남는다. 누른 탭을 먼저 선택 상태로 바꿔 눌렸음을 바로 알린다.
  // 이동이 끝나면 실제 주소로 돌아가고, 불러오는 동안에는 TransitionLink가 흐리게(aria-busy) 표시한다(2026-11-15).
  const [selectedHref, setSelectedHref] = useOptimistic(pathname);
  const categoryLinks = getCategoryLinks(pathname);
  if (categoryLinks === null) return null;

  return (
    // data-category-navigation: 탭이 헤더 높이를 늘리므로 globals.css가 # 이동 여백(--site-header-height)을 맞춘다.
    // 로고 아래 줄일 때(lg 미만)는 로고 줄과 구분선으로 나눈다(예전 모양, 2026-11-07 사용자 결정). lg는 한 줄이라 선이 없다.
    <nav aria-label="주요 메뉴" data-category-navigation className="border-t border-line lg:ml-auto lg:border-t-0">
      <div className="grid grid-cols-7 px-1 py-1 sm:flex sm:justify-center sm:gap-1 sm:px-4 lg:px-0 lg:py-0">
        {categoryLinks.map((item) => {
          const active = selectedHref === item.href;
          return (
            <TransitionLink
              key={item.href}
              href={item.href}
              pendingLabel={`${item.label} 불러오는 중`}
              showPendingIndicator={false}
              onNavigate={() => setSelectedHref(item.href)}
              aria-current={active ? "page" : undefined}
              // 누르는 영역은 칸 전체(높이 44px 이상)이고, 보이는 모양은 안쪽 알약이다. 알약끼리는 떨어져 보인다.
              className="group inline-flex min-h-11 items-center justify-center whitespace-nowrap lg:min-h-13"
            >
              {/* 밑줄만으로는 현재 탭이 잘 보이지 않아, 정렬 버튼처럼 선택된 탭을 바다색으로 채운다(2026-11-06). */}
              <span className={`rounded-control px-2.5 py-1.5 text-label sm:px-4 lg:px-5 lg:py-2 lg:text-title-3 ${active
                ? "bg-primary font-semibold text-on-primary"
                : "text-content-muted group-hover:bg-surface-muted group-hover:text-content"}`}>
                {item.label}
              </span>
            </TransitionLink>
          );
        })}
      </div>
    </nav>
  );
}
