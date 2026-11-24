import { firstSearchParam } from "@/lib/search-params";

export type EventSearchParams = Record<string, string | string[] | undefined>;

type EventBrowseUpdates = Record<string, string | undefined>;

/**
 * 목록 주소의 조건 이름. 화면에서 고르는 것은 이제 분야(category)뿐이고, when·application·audience는
 * 예전 북마크를 위해 계속 해석한다(.ai/DESIGN.md 홈·주제 목록). 해석한 값은 event-list.ts의 EventFilters다.
 * 조건 지우기, 검색 분석의 조건 수가 이 목록 하나를 쓴다(예전에는 세 곳에 따로 있었다, 2026-11-07).
 */
const EVENT_FILTER_PARAMS = ["when", "application", "audience", "category"] as const;

/**
 * 지운 필터의 예전 값. 새로 만드는 링크와 검색 숨김 입력에 따라붙지 않게 뺀다.
 * 무료 필터를 지운 커밋(9238cb3, 2026-07-20)에서 함께 넣었다.
 */
const DROPPED_PARAMS = new Set(["free"]);

/**
 * `__`로 시작하는 이름은 화면끼리 주고받는 내부 값이다. 링크와 검색 폼으로 이어 가지 않는다.
 * 예전에는 링크는 `__browsePath`만, 검색 폼은 `__` 전체를 뺐다. 한쪽 기준(`__` 전체)으로 맞췄다(2026-11-07).
 */
const INTERNAL_PARAM_PREFIX = "__";

/** 목록 경로를 주소 조건과 함께 넘기는 내부 값 */
const BROWSE_PATH_PARAM = `${INTERNAL_PARAM_PREFIX}browsePath`;

export function withEventBrowsePath(
  params: EventSearchParams,
  pathname: string,
): EventSearchParams {
  return { ...params, [BROWSE_PATH_PARAM]: pathname };
}

/** 사이트 안 경로인지 확인한다. `//host`, `/\\host`는 브라우저가 다른 사이트 주소로 해석하므로 거부한다. */
function isSameSitePath(value: string | undefined): value is string {
  return Boolean(value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\"));
}

export function eventBrowsePath(params: EventSearchParams) {
  const pathname = firstSearchParam(params[BROWSE_PATH_PARAM]);
  return isSameSitePath(pathname) ? pathname : "/";
}

/** 다음 목록 주소로 이어 갈 조건과 값(첫 값). 내부 값과 지운 필터 값, 빈 값은 뺀다. 목록 링크가 쓴다. */
export function carriedEventParams(params: EventSearchParams): [string, string][] {
  return Object.entries(params).flatMap(([name, raw]): [string, string][] => {
    if (name.startsWith(INTERNAL_PARAM_PREFIX) || DROPPED_PARAMS.has(name)) return [];
    const value = firstSearchParam(raw);
    return value ? [[name, value]] : [];
  });
}

export function buildEventBrowseHref(
  params: EventSearchParams,
  updates: EventBrowseUpdates = {},
  pathname = eventBrowsePath(params),
) {
  const search = new URLSearchParams(carriedEventParams(params));

  for (const [name, value] of Object.entries(updates)) {
    if (value) search.set(name, value);
    else search.delete(name);
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function clearEventFiltersHref(params: EventSearchParams) {
  const clearedFilters = Object.fromEntries([...EVENT_FILTER_PARAMS, "q"].map((name) => [name, undefined]));
  return buildEventBrowseHref(params, clearedFilters);
}

/**
 * 예전 검색 주소(?q=)가 옮겨 갈 통합 검색의 행사 결과 주소. 검색어가 없으면 null이다(2026-11-22 사용자 결정).
 * 행사 목록 페이지와 proxy.ts가 함께 쓴다. proxy가 모든 요청을 그리기 전에 308로 보내고, 페이지의 redirect는 proxy matcher가 빠졌을 때의 안전장치다.
 */
export function legacyEventSearchHref(params: EventSearchParams) {
  const query = firstSearchParam(params.q)?.trim();
  return query ? `/search?${new URLSearchParams({ q: query, type: "events" })}` : null;
}

/**
 * 삭제한 캘린더(/calendar) 북마크가 옮겨 갈 목록 주소: 같은 필터의 진행 중 목록. 이동 경로는 사용자 입력(__browsePath)에서 받지 않고 홈으로 고정한다.
 * app/calendar/page.tsx와 proxy.ts가 함께 쓴다.
 */
export function calendarRedirectHref(params: EventSearchParams) {
  return buildEventBrowseHref(params, { view: undefined, month: undefined, status: undefined }, "/");
}
