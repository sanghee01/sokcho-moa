export const analyticsEvents = [
  "event_detail_viewed",
  "select_content",
  "search_submitted",
  "source_link_clicked",
  "application_link_clicked",
  "map_link_clicked",
  "nearby_place_clicked",
  "sort_changed",
  "share",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

/** 화면의 data-analytics-event 값이 정해 둔 이벤트 이름인지. 검사와 함께 타입을 좁혀 `as` 캐스팅을 쓰지 않는다. */
export function isAnalyticsEvent(value: string | undefined): value is AnalyticsEvent {
  return analyticsEvents.some((event) => event === value);
}
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
export interface PageViewProperties {
  page_title: string;
  page_location: string;
  page_referrer?: string;
}
export interface AnalyticsDataAttributes {
  "data-analytics-event": AnalyticsEvent;
  "data-analytics-properties"?: string;
}

declare global {
  interface Window {
    gtag?: (command: "event", name: string, properties?: AnalyticsProperties) => void;
  }
}

export function trackAnalyticsEvent(name: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, compactProperties(properties));
}

export function trackPageView(properties: PageViewProperties) {
  if (typeof window === "undefined") return;
  // interface는 index signature가 없어 Record로 바로 넘길 수 없다. 펼쳐서 일반 객체로 넘긴다.
  window.gtag?.("event", "page_view", compactProperties({ ...properties }));
}

export function analyticsData(name: AnalyticsEvent, properties: AnalyticsProperties = {}): AnalyticsDataAttributes {
  const compacted = compactProperties(properties);
  return {
    "data-analytics-event": name,
    ...(Object.keys(compacted).length > 0
      ? { "data-analytics-properties": JSON.stringify(compacted) }
      : {}),
  };
}

export function parseAnalyticsProperties(value: string | undefined): AnalyticsProperties {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return compactProperties(parsed as AnalyticsProperties);
  } catch {
    return {};
  }
}

function compactProperties(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      value !== undefined
      && value !== null
      && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    )),
  );
}
