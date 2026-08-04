"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/transition-link";
import {
  categoryLabels,
  eventCategories,
} from "@/lib/domain/event-taxonomy";

const navigationLinkClass = "inline-flex min-h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-2 text-center text-sm font-semibold sm:min-h-11 sm:rounded-xl sm:border sm:px-5 sm:py-1.5 sm:text-[0.95rem]";
const primaryNavigation = [
  { href: "/", label: "전체" },
  ...eventCategories.map((category) => ({
    href: `/topics/${category}`,
    label: categoryLabels[category],
  })),
];

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="grid w-full grid-cols-4 gap-1 rounded-xl border border-teal-800/20 bg-teal-50/50 p-1 text-sm sm:col-start-2 sm:flex sm:w-max sm:items-center sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0">
      {primaryNavigation.map((item) => {
        const active = pathname === item.href;

        return (
          <TransitionLink
            key={item.href}
            href={item.href}
            pendingLabel={`${item.label} 불러오는 중`}
            showPendingIndicator={false}
            aria-current={active ? "page" : undefined}
            className={`${navigationLinkClass} ${active ? "bg-teal-800 text-white shadow-sm sm:border-teal-800" : "text-teal-900 hover:bg-teal-100 active:bg-teal-200 sm:border-transparent sm:hover:border-teal-800/25 sm:hover:bg-teal-50"}`}
          >
            {item.label}
          </TransitionLink>
        );
      })}
    </nav>
  );
}
