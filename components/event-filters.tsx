import Link from "next/link";
import { audienceLabels, categoryLabels } from "@/lib/domain/format";
import type { EventAudience, EventCategory, EventFilters } from "@/lib/domain/event";

type FilterParams = Record<string, string | string[] | undefined>;

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

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-analytics-event="filter_used"
      data-analytics-label={typeof children === "string" ? children : undefined}
      className={`rounded-full px-3.5 py-2 text-sm font-bold transition ${active ? "bg-teal-800 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-teal-50"}`}
    >
      {children}
    </Link>
  );
}

export function EventFilters({ params, filters }: { params: FilterParams; filters: EventFilters }) {
  const times = [
    ["today", "오늘"],
    ["week", "이번 주"],
    ["month", "이번 달"],
  ] as const;
  const categories: EventCategory[] = ["performance", "festival", "experience", "education"];
  const audiences: EventAudience[] = ["child", "youth", "family"];

  return (
    <section aria-labelledby="filter-title" className="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="filter-title" className="text-lg font-black text-slate-950">어떤 하루를 찾으세요?</h2>
        <Link href="/" className="text-sm font-bold text-teal-700 underline underline-offset-4">필터 초기화</Link>
      </div>
      <form action="/" method="get" role="search" className="flex gap-2">
        {Object.entries(params).map(([key, raw]) => {
          const value = Array.isArray(raw) ? raw[0] : raw;
          return key !== "q" && value ? <input key={key} type="hidden" name={key} value={value} /> : null;
        })}
        <label htmlFor="event-search" className="sr-only">행사 검색어</label>
        <input id="event-search" name="q" defaultValue={filters.query} placeholder="행사명, 장소, 기관 검색" className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base" />
        <button type="submit" className="rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white hover:bg-teal-900">검색</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {times.map(([value, label]) => <Chip key={value} href={buildHref(params, "when", value)} active={filters.when === value}>{label}</Chip>)}
        <Chip href={buildHref(params, "application", "open")} active={filters.applicationOpen === true}>신청 가능</Chip>
        <Chip href={buildHref(params, "free", "true")} active={filters.free === true}>무료</Chip>
        {audiences.map((value) => <Chip key={value} href={buildHref(params, "audience", value)} active={filters.audience === value}>{audienceLabels[value]}</Chip>)}
        {categories.map((value) => <Chip key={value} href={buildHref(params, "category", value)} active={filters.category === value}>{categoryLabels[value]}</Chip>)}
      </div>
    </section>
  );
}
