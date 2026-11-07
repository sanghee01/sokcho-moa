"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/ui/transition-link";
import { categoryLabels, eventCategories } from "@/features/events/model/taxonomy";

const categoryLinks = [
  { href: "/", label: "전체" },
  ...eventCategories.map((category) => ({
    href: `/topics/${category}`,
    label: categoryLabels[category],
  })),
];

/** 분야 탭을 보여 주는 목록 주소: 홈(전체)과 분야별 목록. 상세·제보·관리자에는 두지 않는다. */
function isEventListPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/topics/");
}

/**
 * 행사 분야 탭(.ai/DESIGN.md Components > Tabs). 전역 헤더 안에 있고 목록 주소에서만 보인다.
 * 헤더와 함께 화면 위에 고정되어, 목록을 내려 보다가도 바로 분야를 바꿀 수 있다(2026-11-07 사용자 결정).
 * lg는 로고 오른쪽 한 줄, 그보다 좁으면 로고 아래 줄이다. 7개가 한 줄에 다 들어가게 모바일은 같은 폭으로 나누고,
 * 좌우 스크롤은 쓰지 않는다(2026-11-06).
 * 검은 배경 칩은 무거워 보여 밑줄 탭으로 바꿨다가, 밑줄로는 현재 탭이 잘 안 보여 바다색 알약으로 바꿨다(2026-11-06).
 * E2E가 이 이름("주요 메뉴")과 링크 순서를 확인한다.
 */
export function CategoryNavigation() {
  const pathname = usePathname();
  if (!isEventListPath(pathname)) return null;

  return (
    // data-category-navigation: 탭이 헤더 높이를 늘리므로 globals.css가 # 이동 여백(--site-header-height)을 맞춘다.
    // 로고 아래 줄일 때(lg 미만)는 로고 줄과 구분선으로 나눈다(예전 모양, 2026-11-07 사용자 결정). lg는 한 줄이라 선이 없다.
    <nav aria-label="주요 메뉴" data-category-navigation className="border-t border-line lg:ml-auto lg:border-t-0">
      <div className="grid grid-cols-7 px-1 py-1 sm:flex sm:justify-center sm:gap-1 sm:px-4 lg:px-0 lg:py-0">
        {categoryLinks.map((item) => {
          const active = pathname === item.href;
          return (
            <TransitionLink
              key={item.href}
              href={item.href}
              pendingLabel={`${item.label} 불러오는 중`}
              showPendingIndicator={false}
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
