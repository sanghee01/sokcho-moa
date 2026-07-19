"use client";

import { useEffect } from "react";
import { analyticsEvents, trackAnalyticsEvent, type AnalyticsEvent } from "@/lib/analytics/events";

export function AnalyticsRuntime({ viewedEventSlug }: { viewedEventSlug?: string }) {
  useEffect(() => {
    if (viewedEventSlug) trackAnalyticsEvent("event_detail_viewed", { event_slug: viewedEventSlug });

    const handleClick = (nativeEvent: MouseEvent) => {
      const target = nativeEvent.target instanceof Element ? nativeEvent.target.closest<HTMLElement>("[data-analytics-event]") : null;
      if (!target) return;
      const name = target.dataset.analyticsEvent;
      if (!analyticsEvents.includes(name as AnalyticsEvent)) return;
      trackAnalyticsEvent(name as AnalyticsEvent, {
        label: target.dataset.analyticsLabel,
        event_slug: target.dataset.eventSlug,
      });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [viewedEventSlug]);

  return null;
}
