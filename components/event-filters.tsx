"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { audienceLabels, categoryLabels } from "@/lib/domain/format";
import type { EventAudience, EventCategory, EventFilters } from "@/lib/domain/event";

type FilterParams = Record<string, string | string[] | undefined>;
type ChipTone = "default" | "application";
type Navigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => void;

const times = [
  ["today", "오늘"],
  ["week", "이번 주"],
  ["month", "이번 달"],
] as const;
const categories: EventCategory[] = ["performance", "festival", "experience", "education", "exhibition", "other"];
const audiences: EventAudience[] = ["child", "youth", "family", "adult", "all"];

function buildHref(params: FilterParams, key: string, value: string | undefined) {
  const search = new URLSearchParams();
  for (const [name, raw] of Object.entries(params)) {
    const current = Array.isArray(raw) ? raw[0] : raw;
    if (current) search.set(name, current);
  }
  if (value == null || search.get(key) === value) search.delete(key);
  else search.set(key, value);
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

function buildSearchHref(form: HTMLFormElement) {
  const search = new URLSearchParams();
  for (const [key, raw] of new FormData(form)) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function Chip({ href, active, label, tone = "default", isPending, navigate }: { href: string; active: boolean; label: string; tone?: ChipTone; isPending: boolean; navigate: Navigate }) {
  const activeClass = tone === "application" ? "bg-emerald-700 text-white ring-emerald-700" : "bg-teal-800 text-white ring-teal-800";
  const inactiveClass = tone === "application"
    ? "bg-white text-emerald-800 ring-emerald-200 hover:bg-emerald-100"
    : "bg-white text-slate-700 ring-slate-200 hover:bg-teal-50";

  return (
    <Link
      href={href}
      onClick={(event) => navigate(event, href)}
      aria-current={active ? "page" : undefined}
      aria-disabled={isPending}
      data-analytics-event="filter_used"
      data-analytics-label={label}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${active ? activeClass : inactiveClass} ${isPending ? "opacity-60" : "active:scale-[0.98]"}`}
    >
      {active && <span aria-hidden="true">✓</span>}
      {label}
    </Link>
  );
}

function FilterGroup({ id, title, description, className = "", children }: { id: string; title: string; description: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-4 ${className}`}>
      <div className="mb-3">
        <h3 id={id} className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function EventFilters({ params, filters }: { params: FilterParams; filters: EventFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (shouldUseNativeNavigation(event)) return;
    event.preventDefault();
    if (isPending) return;
    startTransition(() => router.push(href, { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const href = buildSearchHref(event.currentTarget);
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <section aria-labelledby="filter-title" aria-busy={isPending} className="space-y-5 rounded-3xl border border-teal-900/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-teal-700">원하는 행사만 빠르게</p>
          <h2 id="filter-title" className="mt-1 text-xl font-black text-slate-950">어떤 하루를 찾으세요?</h2>
        </div>
        <Link href="/" onClick={(event) => navigate(event, "/")} aria-disabled={isPending} className="shrink-0 text-sm font-bold text-teal-700 underline underline-offset-4">필터 초기화</Link>
      </div>
      <div className="min-h-6" aria-live="polite">
        {isPending && <p role="status" className="flex items-center gap-2 text-sm font-bold text-teal-700"><LoadingSpinner />필터를 적용하고 있어요.</p>}
      </div>
      <form action="/" method="get" role="search" onSubmit={submitSearch}>
        {Object.entries(params).map(([key, raw]) => {
          const value = Array.isArray(raw) ? raw[0] : raw;
          return key !== "q" && value ? <input key={key} type="hidden" name={key} value={value} /> : null;
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[0.75fr_0.9fr_1.8fr]">
        <FilterGroup id="date-filter-title" title="날짜" description="가까운 일정부터 살펴보세요.">
          <div className="flex flex-wrap gap-2">
            {times.map(([value, label]) => <Chip key={value} href={buildHref(params, "when", value)} active={filters.when === value} label={label} isPending={isPending} navigate={navigate} />)}
          </div>
        </FilterGroup>

        <FilterGroup id="application-filter-title" title="신청 가능 여부" description="지금 참여할 수 있는 행사만 모아보세요.">
          <div className="flex flex-wrap gap-2">
            <Chip href={buildHref(params, "application", "open")} active={filters.applicationOpen === true} label="신청 가능한 행사" tone="application" isPending={isPending} navigate={navigate} />
            <Chip href={buildHref(params, "free", "true")} active={filters.free === true} label="무료 행사" isPending={isPending} navigate={navigate} />
          </div>
        </FilterGroup>

        <FilterGroup id="topic-filter-title" title="주제·대상" description="관심 있는 활동과 함께할 대상을 골라보세요." className="sm:col-span-2 xl:col-span-1">
          <div>
            <p className="mb-2 text-xs font-bold text-slate-500">주제</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((value) => <Chip key={value} href={buildHref(params, "category", value)} active={filters.category === value} label={categoryLabels[value]} isPending={isPending} navigate={navigate} />)}
            </div>
          </div>
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-bold text-slate-500">대상</p>
            <div className="flex flex-wrap gap-2">
              {audiences.map((value) => <Chip key={value} href={buildHref(params, "audience", value)} active={filters.audience === value} label={audienceLabels[value]} isPending={isPending} navigate={navigate} />)}
            </div>
          </div>
        </FilterGroup>
      </div>
    </section>
  );
}
