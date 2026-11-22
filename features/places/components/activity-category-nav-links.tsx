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
 * 모바일은 칩만 가로로 밀고(감싼 칸이 스크롤), sm 이상은 꺾는다. 지역 select는 감싼 줄(activity-list-page.tsx) 맨 앞에 고정된다.
 * region은 고른 지역이다. 분류를 바꿔도 지역을 이어 가려고 링크에 붙인다(2026-11-22). 기본 지역(속초)은 주소에 적지 않는다.
 * categoryRegions: 분류마다 장소가 있는 지역. 고른 지역에 장소가 없는 분류 칩은 CSS가 숨긴다(globals.css의 data-region-scope). 고른 칩은 숨기지 않는다.
 */
export function ActivityCategoryNavLinks({
  categories,
  categoryRegions,
  selected,
  region,
}: {
  categories: readonly ActivityCategory[];
  categoryRegions: Readonly<Partial<Record<ActivityCategory, readonly PlaceRegion[]>>>;
  selected?: ActivityCategory;
  region: PlaceRegionChoice;
}) {
  const links = [
    { key: "all", href: placeRegionHref(ACTIVITY_LIST_PATH, region), label: "전체", isSelected: selected === undefined, regions: undefined },
    ...categories.map((category) => ({
      key: category,
      href: placeRegionHref(activityCategoryPath(category), region),
      label: activityCategoryLabels[category],
      isSelected: category === selected,
      regions: category === selected ? undefined : categoryRegions[category],
    })),
  ];
  return (
    <nav aria-label="가볼만한 곳 분류" className="flex w-max gap-x-2 sm:w-auto sm:flex-wrap">
      {links.map((link) => (
        // 숨김 표시(data-regions)는 링크 컴포넌트가 받지 않아 감싼 칸에 단다.
        <span key={link.key} data-regions={link.regions?.join(" ")} className="inline-flex shrink-0">
          <TransitionLink
            href={link.href}
            showPendingIndicator={false}
            aria-current={link.isSelected ? "page" : undefined}
            className="group inline-flex min-h-11 shrink-0 items-center"
          >
            <span className={getFilterChipClassName(link.isSelected)}>{link.label}</span>
          </TransitionLink>
        </span>
      ))}
    </nav>
  );
}
