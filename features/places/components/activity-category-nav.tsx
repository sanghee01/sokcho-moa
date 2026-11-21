import { TransitionLink } from "@/components/ui/transition-link";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  type ActivityCategory,
} from "@/features/places/model/activity";

/**
 * 즐길거리 분류 칩(.ai/DESIGN.md ActivityCategoryNav). 장소가 있는 분류만 보이고, 좌우 스크롤 없이 여러 줄로 꺾인다.
 * 선택된 칩은 행사 분야 탭과 같이 primary로 채운다.
 */
export function ActivityCategoryNav({ categories, selected }: { categories: readonly ActivityCategory[]; selected?: ActivityCategory }) {
  const links = [
    { href: ACTIVITY_LIST_PATH, label: "전체", isSelected: selected === undefined },
    ...categories.map((category) => ({ href: activityCategoryPath(category), label: activityCategoryLabels[category], isSelected: category === selected })),
  ];
  return (
    <nav aria-label="가볼만한 곳 분류" className="mt-5 flex flex-wrap gap-2">
      {links.map((link) => (
        <TransitionLink
          key={link.href}
          href={link.href}
          showPendingIndicator={false}
          aria-current={link.isSelected ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-4 text-label font-medium ${link.isSelected ? "bg-primary text-on-primary" : "bg-surface text-content ring-1 ring-inset ring-line-strong hover:bg-surface-subtle"}`}
        >
          {link.label}
        </TransitionLink>
      ))}
    </nav>
  );
}
