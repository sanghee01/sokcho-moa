export const analyticsEvents = [
  "event_detail_viewed",
  "source_link_clicked",
  "application_link_clicked",
  "map_link_clicked",
  "nearby_place_clicked",
  "filter_used",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", name: string, properties?: AnalyticsProperties) => void;
  }
}

export function trackAnalyticsEvent(name: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, properties);
}
