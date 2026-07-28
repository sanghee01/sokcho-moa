"use client";

import Link from "next/link";
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
      className="flex min-w-0 items-center gap-2"
    >
      {Object.entries(params).map(([key, raw]) => {
        const value = Array.isArray(raw) ? raw[0] : raw;
        return !key.startsWith("__") && key !== "q" && key !== "free" && value
          ? <input key={key} type="hidden" name={key} value={value} />
          : null;
      })}
      <label htmlFor="event-search" className="sr-only">행사명, 장소, 기관 검색</label>
      <input
        id="event-search"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="행사명, 장소 검색"
        className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
      />
      {query && (
        <Link
          href={buildEventBrowseHref(params, { q: undefined })}
          scroll={false}
          className="inline-flex min-h-11 shrink-0 items-center justify-center px-1 text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-teal-800"
        >
          지우기
        </Link>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-2 text-sm font-bold text-white hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70"
      >
        {isPending && <LoadingSpinner />}
        {isPending ? "검색 중" : "검색"}
      </button>
    </form>
  );
}
