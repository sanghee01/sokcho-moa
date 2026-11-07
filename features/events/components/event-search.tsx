"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { Search } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import {
  buildEventBrowseHref,
  carriedEventParams,
  countActiveEventFilters,
  eventBrowsePath,
  type EventSearchParams,
} from "@/features/events/model/browse-url";

function buildSearchHref(form: HTMLFormElement, params: EventSearchParams) {
  const nextParams: EventSearchParams = {};
  for (const [key, raw] of new FormData(form)) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value) nextParams[key] = value;
  }
  return buildEventBrowseHref(nextParams, {}, eventBrowsePath(params));
}

export function EventSearch({
  params,
  query,
}: {
  params: EventSearchParams;
  query?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeFilterCount = countActiveEventFilters(params);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const nextQuery = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    trackAnalyticsEvent("search_submitted", {
      query_length: Array.from(nextQuery).length,
      has_query: nextQuery.length > 0,
      active_filter_count: activeFilterCount,
    });
    const href = buildSearchHref(event.currentTarget, params);
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <form
      action={eventBrowsePath(params)}
      method="get"
      role="search"
      aria-label="행사 검색"
      aria-busy={isPending}
      onSubmit={submitSearch}
      className="w-full min-w-0"
    >
      {/* JavaScript 없이 제출해도 지금 조건이 유지되도록 숨김 입력으로 넘긴다. 검색어(q)는 아래 입력창이 보낸다. */}
      {carriedEventParams(params)
        .filter(([name]) => name !== "q")
        .map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="relative">
        <label htmlFor="event-search" className="sr-only">행사명, 장소, 기관 검색</label>
        {/* 같은 route에서 검색어만 바뀌면(뒤로 가기, 조건 초기화) 컴포넌트가 유지되어 defaultValue가 다시 적용되지 않는다.
            검색어를 key로 두어 URL의 검색어와 입력값을 맞춘다. */}
        <input
          key={query ?? ""}
          id="event-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="행사명, 장소 검색"
          className="min-h-12 w-full rounded-full border border-line-input bg-surface py-2 pl-12 pr-4 text-body text-content-strong outline-none transition placeholder:text-content-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {/* 돋보기 아이콘이 곧 검색 버튼이다. Enter로도 검색된다. */}
        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "검색 중" : "검색"}
          className="absolute left-1 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-content-muted hover:bg-surface-subtle hover:text-primary-text disabled:cursor-wait"
        >
          {isPending ? <LoadingSpinner className="size-4" /> : <Search {...iconProps} />}
        </button>
      </div>
    </form>
  );
}
