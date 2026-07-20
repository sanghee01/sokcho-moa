"use client";

import { useEffect } from "react";
import {
  analyticsEvents,
  parseAnalyticsProperties,
  trackAnalyticsEvent,
  type AnalyticsEvent,
} from "@/lib/analytics/events";

export function AnalyticsRuntime() {
  useEffect(() => {
    const handleClick = (nativeEvent: MouseEvent) => {
      const target = nativeEvent.target instanceof Element ? nativeEvent.target.closest<HTMLElement>("[data-analytics-event]") : null;
      if (!target) return;
      const name = target.dataset.analyticsEvent;
      if (!analyticsEvents.includes(name as AnalyticsEvent)) return;
      trackAnalyticsEvent(name as AnalyticsEvent, parseAnalyticsProperties(target.dataset.analyticsProperties));
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
