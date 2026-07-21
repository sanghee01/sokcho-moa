import Link from "next/link";
import { analyticsData } from "@/lib/analytics/events";
import type { EventFilters } from "@/lib/domain/event";
import { buildEventBrowseHref, type EventSearchParams } from "@/lib/domain/event-navigation";

function sortHref(params: EventSearchParams, sort: EventFilters["sort"]) {
  return buildEventBrowseHref(params, { sort: sort === "published" ? undefined : sort });
}

export function EventSort({ params, activeSort }: { params: EventSearchParams; activeSort: EventFilters["sort"] }) {
  const resolvedSort = activeSort ?? "published";

  return (
    <nav aria-label="행사 정렬" className="grid w-full grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-fit">
      <Link
        href={sortHref(params, "published")}
        scroll={false}
        {...(resolvedSort !== "published" ? analyticsData("sort_changed", { sort_method: "published" }) : {})}
        aria-current={resolvedSort === "published" ? "page" : undefined}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg px-1 text-sm font-bold transition sm:px-3 ${resolvedSort === "published" ? "bg-teal-800 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"}`}
      >
        게시순
      </Link>
      <Link
        href={sortHref(params, "latest")}
        scroll={false}
        title="가까운 예정 행사부터, 이후 진행 중·최근 종료 행사 순"
        {...(resolvedSort !== "latest" ? analyticsData("sort_changed", { sort_method: "latest" }) : {})}
        aria-current={resolvedSort === "latest" ? "page" : undefined}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg px-1 text-sm font-bold transition sm:px-3 ${resolvedSort === "latest" ? "bg-teal-800 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"}`}
      >
        행사일순
      </Link>
      <Link
        href={sortHref(params, "deadline")}
        scroll={false}
        title="신청 마감이 가까운 행사부터, 이후 행사일순"
        {...(resolvedSort !== "deadline" ? analyticsData("sort_changed", { sort_method: "deadline" }) : {})}
        aria-current={resolvedSort === "deadline" ? "page" : undefined}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg px-1 text-sm font-bold transition sm:px-3 ${resolvedSort === "deadline" ? "bg-teal-800 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"}`}
      >
        마감일순
      </Link>
      <Link
        href={sortHref(params, "views")}
        scroll={false}
        {...(resolvedSort !== "views" ? analyticsData("sort_changed", { sort_method: "views" }) : {})}
        aria-current={resolvedSort === "views" ? "page" : undefined}
        className={`inline-flex min-h-10 items-center justify-center rounded-lg px-1 text-sm font-bold transition sm:px-3 ${resolvedSort === "views" ? "bg-teal-800 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-900"}`}
      >
        조회순
      </Link>
    </nav>
  );
}
