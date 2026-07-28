"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { audienceLabels, categoryLabels } from "@/lib/domain/format";
import type { EventAudience, EventCategory, EventFilters } from "@/lib/domain/event";
import {
  buildEventBrowseHref,
  clearEventFiltersHref,
  eventBrowsePath,
  type EventSearchParams,
} from "@/lib/domain/event-navigation";
import { eventTopicPath } from "@/lib/domain/event-topic";
import { analyticsData, trackAnalyticsEvent } from "@/lib/analytics/events";

type Navigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => void;

const times = [
  ["today", "오늘"],
  ["week", "이번 주"],
  ["month", "이번 달"],
] as const;
const categories: EventCategory[] = ["performance", "festival", "experience", "education", "exhibition", "other"];
const audiences: EventAudience[] = ["child", "youth", "family", "adult", "all"];

function buildFilterHref(params: EventSearchParams, key: string, value: string | undefined) {
  const current = Array.isArray(params[key]) ? params[key][0] : params[key];
  return buildEventBrowseHref(params, { [key]: current === value ? undefined : value });
}

function buildSearchHref(form: HTMLFormElement, params: EventSearchParams) {
  const nextParams: EventSearchParams = {};
  for (const [key, raw] of new FormData(form)) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value) nextParams[key] = value;
  }
  return buildEventBrowseHref(nextParams, {}, eventBrowsePath(params));
}

function buildCategoryHref(
  params: EventSearchParams,
  currentCategory: EventCategory | undefined,
  category: EventCategory,
) {
  const pathname = currentCategory === category ? "/" : eventTopicPath(category);
  return buildEventBrowseHref(params, { category: undefined }, pathname);
}

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function Chip({
  href,
  active,
  label,
  filterType,
  filterValue,
  isPending,
  navigate,
}: {
  href: string;
  active: boolean;
  label: string;
  filterType: "date" | "application" | "category" | "audience";
  filterValue: string;
  isPending: boolean;
  navigate: Navigate;
}) {
  return (
    <Link
      href={href}
      rel={filterType === "category" ? undefined : "nofollow"}
      onClick={(event) => navigate(event, href)}
      aria-current={active ? "page" : undefined}
      aria-disabled={isPending}
      {...analyticsData("filter_used", {
        filter_type: filterType,
        filter_value: filterValue,
        filter_action: active ? "remove" : "apply",
      })}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${active ? "bg-teal-800 text-white ring-teal-800" : "bg-white text-slate-700 ring-slate-200 hover:bg-teal-50"} ${isPending ? "opacity-60" : "active:scale-[0.98]"}`}
    >
      {active && <span aria-hidden="true">✓</span>}
      {label}
    </Link>
  );
}

function FilterGroup({ id, title, className = "", children }: { id: string; title: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-4 ${className}`}>
      <h3 id={id} className="mb-3 text-sm font-black text-slate-950">{title}</h3>
      {children}
    </div>
  );
}

export function EventFilters({ params, filters }: { params: EventSearchParams; filters: EventFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeFilterCount = [filters.when, filters.applicationOpen, filters.audience, filters.category, filters.query]
    .filter(Boolean).length;

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (shouldUseNativeNavigation(event)) return;
    event.preventDefault();
    if (isPending) return;
    startTransition(() => router.push(href, { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    trackAnalyticsEvent("search_submitted", {
      query_length: Array.from(query).length,
      has_query: query.length > 0,
      active_filter_count: activeFilterCount - (filters.query ? 1 : 0),
    });
    const href = buildSearchHref(event.currentTarget, params);
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <section aria-labelledby="filter-title" aria-busy={isPending} className="space-y-5 rounded-3xl border border-teal-900/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-teal-700">원하는 행사만 빠르게</p>
          <h2 id="filter-title" className="mt-1 text-xl font-black text-slate-950">어떤 하루를 찾으세요?</h2>
        </div>
        <Link
          href={clearEventFiltersHref(params)}
          onClick={(event) => navigate(event, clearEventFiltersHref(params))}
          aria-disabled={isPending}
          {...(activeFilterCount > 0 ? analyticsData("filter_reset", { active_filter_count: activeFilterCount }) : {})}
          className="shrink-0 text-sm font-bold text-teal-700 underline underline-offset-4"
        >
          필터 초기화
        </Link>
      </div>
      <form action={eventBrowsePath(params)} method="get" role="search" onSubmit={submitSearch}>
        {Object.entries(params).map(([key, raw]) => {
          const value = Array.isArray(raw) ? raw[0] : raw;
          return !key.startsWith("__") && key !== "q" && key !== "free" && value
            ? <input key={key} type="hidden" name={key} value={value} />
            : null;
        })}
        <label htmlFor="event-search" className="mb-2 block text-sm font-bold text-slate-800">키워드 검색</label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input id="event-search" name="q" defaultValue={filters.query} placeholder="행사명, 장소, 기관 검색" className="min-w-0 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base" />
          <button type="submit" disabled={isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70">
            {isPending && <LoadingSpinner />}
            {isPending ? "검색 중" : "검색"}
          </button>
        </div>
      </form>
      <div className="grid gap-3 xl:grid-cols-[0.75fr_1.8fr]">
        <FilterGroup id="date-filter-title" title="날짜">
          <div className="flex flex-wrap gap-2">
            {times.map(([value, label]) => <Chip key={value} href={buildFilterHref(params, "when", value)} active={filters.when === value} label={label} filterType="date" filterValue={value} isPending={isPending} navigate={navigate} />)}
          </div>
        </FilterGroup>

        <FilterGroup id="topic-filter-title" title="주제·대상">
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">주제</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((value) => <Chip key={value} href={buildCategoryHref(params, filters.category, value)} active={filters.category === value} label={categoryLabels[value]} filterType="category" filterValue={value} isPending={isPending} navigate={navigate} />)}
            </div>
          </div>
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-bold text-slate-500">대상</p>
            <div className="flex flex-wrap gap-2">
              {audiences.map((value) => <Chip key={value} href={buildFilterHref(params, "audience", value)} active={filters.audience === value} label={audienceLabels[value]} filterType="audience" filterValue={value} isPending={isPending} navigate={navigate} />)}
            </div>
          </div>
        </FilterGroup>
      </div>
    </section>
  );
}
