"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import {
  buildEventBrowseHref,
  eventBrowsePath,
  type EventSearchParams,
} from "@/lib/domain/event-navigation";

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
  const activeFilterCount = ["when", "application", "audience", "category"]
    .filter((key) => Boolean(params[key])).length;

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
      {Object.entries(params).map(([key, raw]) => {
        const value = Array.isArray(raw) ? raw[0] : raw;
        return !key.startsWith("__") && key !== "q" && key !== "free" && value
          ? <input key={key} type="hidden" name={key} value={value} />
          : null;
      })}
      <div className="relative">
        <label htmlFor="event-search" className="sr-only">행사명, 장소, 기관 검색</label>
        <input
          id="event-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="행사명, 장소 검색"
          className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-20 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 sm:min-h-11"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute bottom-1 right-1 top-1 inline-flex items-center justify-center gap-1 rounded-lg bg-teal-800 px-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70"
        >
          {isPending && <LoadingSpinner className="size-3" />}
          {isPending ? "검색 중" : "검색"}
        </button>
      </div>
    </form>
  );
}
