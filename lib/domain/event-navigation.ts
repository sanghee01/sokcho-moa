export type EventSearchParams = Record<string, string | string[] | undefined>;

type EventBrowseUpdates = Record<string, string | undefined>;

const legacyParams = new Set(["free"]);

export function isCalendarEventView(params: EventSearchParams) {
  const view = Array.isArray(params.view) ? params.view[0] : params.view;
  return view === "calendar";
}

export function buildEventBrowseHref(
  params: EventSearchParams,
  updates: EventBrowseUpdates = {},
) {
  const search = new URLSearchParams();

  for (const [name, raw] of Object.entries(params)) {
    if (legacyParams.has(name)) continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) search.set(name, value);
  }

  for (const [name, value] of Object.entries(updates)) {
    if (value) search.set(name, value);
    else search.delete(name);
  }

  const query = search.toString();
  return query ? `/?${query}` : "/";
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
