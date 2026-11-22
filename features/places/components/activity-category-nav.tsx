import { getFilterChipClassName } from "@/components/ui/filter-chip-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  type ActivityCategory,
} from "@/features/places/model/activity";

/**
 * 즐길거리 분류 칩(.ai/DESIGN.md ActivityCategoryNav). 장소가 있는 분류만 보이고, 좌우 스크롤 없이 여러 줄로 꺾인다.
 * 행사 분야 탭·지도 분야와 같은 칩 모양이다(filter-chip-styles.ts). 분류 이름이 길어 행사처럼 같은 폭 칸으로 나누지 않는다.
 * 모바일은 지도 분야처럼 한 줄에서 가로로 밀어 본다. 여러 줄로 꺾으면 360px에서 세 줄(약 130px)이 첫 화면을 차지했다(2026-11-21). sm 이상은 꺾는다.
 */
export function ActivityCategoryNav({ categories, selected }: { categories: readonly ActivityCategory[]; selected?: ActivityCategory }) {
  const links = [
    { href: ACTIVITY_LIST_PATH, label: "전체", isSelected: selected === undefined },
    ...categories.map((category) => ({ href: activityCategoryPath(category), label: activityCategoryLabels[category], isSelected: category === selected })),
  ];
  return (
    <nav aria-label="가볼만한 곳 분류" className="-mx-4 flex gap-x-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {links.map((link) => (
        <TransitionLink
          key={link.href}
          href={link.href}
          showPendingIndicator={false}
          aria-current={link.isSelected ? "page" : undefined}
          className="group inline-flex min-h-11 shrink-0 items-center"
        >
          <span className={getFilterChipClassName(link.isSelected)}>{link.label}</span>
        </TransitionLink>
      ))}
    </nav>
  );
}
