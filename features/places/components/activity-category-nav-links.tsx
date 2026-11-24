"use client";

import { usePathname } from "next/navigation";
import { useOptimistic } from "react";
import { getFilterChipClassName } from "@/components/ui/filter-chip-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  type ActivityCategory,
} from "@/features/places/model/activity";
import { placeRegionHref, type PlaceRegion, type PlaceRegionChoice } from "@/features/places/model/region";

/**
 * 즐길거리 분류 칩(.ai/DESIGN.md ActivityCategoryNav)의 모양. 장소가 있는 분류만 보인다.
 * 행사 분야 탭·지도 분야와 같은 칩 모양이다(filter-chip-styles.ts). 분류 이름이 길어 행사처럼 같은 폭 칸으로 나누지 않는다.
 * 모바일은 칩만 가로로 밀고(감싼 칸이 스크롤), sm 이상은 꺾는다. 지역 select는 감싼 줄(activity-list-layout.tsx) 맨 앞에 고정된다.
 * region은 고른 지역이다. 분류를 바꿔도 지역을 이어 가려고 링크에 붙인다(2026-11-22). 기본 지역(속초)은 주소에 적지 않는다.
 * categoryRegions: 분류마다 장소가 있는 지역. 고른 지역에 장소가 없는 분류 칩은 CSS가 숨긴다(globals.css의 data-region-scope). 고른 칩은 숨기지 않는다.
 *
 * 칩 줄은 전체·분류 목록이 함께 쓰는 틀에 있어 분류를 바꿔도 다시 만들어지지 않는다. 그래서 고른 분류는 서버가 아니라 주소(usePathname)로 정한다(2026-11-24).
 */
export function ActivityCategoryNavLinks({
  categories,
  categoryRegions,
  region,
}: {
  categories: readonly ActivityCategory[];
  categoryRegions: Readonly<Partial<Record<ActivityCategory, readonly PlaceRegion[]>>>;
  region: PlaceRegionChoice;
}) {
  const pathname = usePathname();
  // 목록에는 로딩 화면이 없어 응답이 올 때까지 이전 목록이 남는다. 누른 칩을 먼저 선택 상태로 바꿔 눌렸음을 바로 알린다.
  // 이동이 끝나면 실제 주소로 돌아간다. 행사 분야 탭(features/events/components/browse/category-navigation.tsx)과 같은 방식이다(2026-11-24).
  const [selectedPath, setSelectedPath] = useOptimistic(pathname);
  const links = [
    { key: "all", path: ACTIVITY_LIST_PATH, label: "전체", regions: undefined },
    ...categories.map((category) => ({
      key: category,
      path: activityCategoryPath(category),
      label: activityCategoryLabels[category],
      regions: categoryRegions[category],
    })),
  ];
  return (
    <nav aria-label="가볼만한 곳 분류" className="flex w-max gap-x-2 sm:w-auto sm:flex-wrap">
      {links.map((link) => {
        const isSelected = link.path === selectedPath;
        return (
          // 숨김 표시(data-regions)는 링크 컴포넌트가 받지 않아 감싼 칸에 단다.
          <span key={link.key} data-regions={isSelected ? undefined : link.regions?.join(" ")} className="inline-flex shrink-0">
            <TransitionLink
              href={placeRegionHref(link.path, region)}
              showPendingIndicator={false}
              onNavigate={() => setSelectedPath(link.path)}
              aria-current={isSelected ? "page" : undefined}
              className="group inline-flex min-h-11 shrink-0 items-center"
            >
              <span className={getFilterChipClassName(isSelected)}>{link.label}</span>
            </TransitionLink>
          </span>
        );
      })}
    </nav>
  );
}
