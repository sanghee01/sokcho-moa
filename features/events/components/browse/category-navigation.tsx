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
 * 행사 분야 탭(.ai/DESIGN.md Components > Tabs). 행사 목록·월별 페이지 위쪽에 있고(EventSectionNavigation), 화면에 고정하지 않는다.
 * 예전에는 헤더 안에 고정했지만 모바일 하단 탭이 생기며 위아래 고정 영역이 너무 커져 목록 안으로 옮겼다(2026-11-21 사용자 결정).
 * 7개가 한 줄에 다 들어가게 모바일은 같은 폭으로 나누고, 좌우 스크롤은 쓰지 않는다(2026-11-06).
 * 밑줄로는 현재 탭이 잘 안 보여 바다색 알약으로 채운다(2026-11-06). E2E가 이 이름("행사 분야")과 링크 순서를 확인한다.
 */
export function CategoryNavigation() {
  const pathname = usePathname();
  // 목록에는 로딩 화면이 없어 응답이 올 때까지 이전 목록이 남는다. 누른 탭을 먼저 선택 상태로 바꿔 눌렸음을 바로 알린다.
  // 이동이 끝나면 실제 주소로 돌아가고, 불러오는 동안에는 TransitionLink가 흐리게(aria-busy) 표시한다(2026-11-15).
  const [selectedHref, setSelectedHref] = useOptimistic(pathname);
  const categoryLinks = getCategoryLinks(pathname);
  if (categoryLinks === null) return null;

  return (
    <nav aria-label="행사 분야">
      <div className="-mx-3 grid grid-cols-7 sm:mx-0 sm:flex sm:gap-1">
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
              className="group inline-flex min-h-11 items-center justify-center whitespace-nowrap"
            >
              {/* 밑줄만으로는 현재 탭이 잘 보이지 않아, 정렬 버튼처럼 선택된 탭을 바다색으로 채운다(2026-11-06). */}
              <span className={`rounded-control px-2.5 py-1.5 text-label sm:px-4 ${active
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
