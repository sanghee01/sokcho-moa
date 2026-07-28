export type EventSearchParams = Record<string, string | string[] | undefined>;

type EventBrowseUpdates = Record<string, string | undefined>;

const legacyParams = new Set(["free"]);
const browsePathParam = "__browsePath";

export function withEventBrowsePath(
  params: EventSearchParams,
  pathname: string,
): EventSearchParams {
  return { ...params, [browsePathParam]: pathname };
}

export function eventBrowsePath(params: EventSearchParams) {
  const value = params[browsePathParam];
  const pathname = Array.isArray(value) ? value[0] : value;
  return pathname?.startsWith("/") ? pathname : "/";
}

export function isCalendarEventView(params: EventSearchParams) {
  const view = Array.isArray(params.view) ? params.view[0] : params.view;
  return view === "calendar";
}

export function buildEventBrowseHref(
  params: EventSearchParams,
  updates: EventBrowseUpdates = {},
  pathname = eventBrowsePath(params),
) {
  const search = new URLSearchParams();

  for (const [name, raw] of Object.entries(params)) {
    if (legacyParams.has(name) || name === browsePathParam) continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) search.set(name, value);
  }

  for (const [name, value] of Object.entries(updates)) {
    if (value) search.set(name, value);
    else search.delete(name);
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function clearEventFiltersHref(params: EventSearchParams) {
  return buildEventBrowseHref(params, {
    when: undefined,
    application: undefined,
    audience: undefined,
    category: undefined,
    q: undefined,
  });
}
