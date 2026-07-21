"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  analyticsEvents,
  parseAnalyticsProperties,
  trackAnalyticsEvent,
  trackPageView,
  type AnalyticsEvent,
} from "@/lib/analytics/events";
import { shouldTrackGoogleAnalyticsPage } from "@/lib/analytics/google-analytics";

export function AnalyticsRuntime() {
  const pathname = usePathname();
  const lastObservedLocation = useRef<string | null>(null);

  useEffect(() => {
    const pageLocation = window.location.href;
    if (lastObservedLocation.current === pageLocation) return;

    const pageReferrer = lastObservedLocation.current || document.referrer || undefined;
    lastObservedLocation.current = pageLocation;

    if (!shouldTrackGoogleAnalyticsPage(pathname)) return;

    trackPageView({
      page_title: document.title,
      page_location: pageLocation,
      page_referrer: pageReferrer,
    });
  }, [pathname]);

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
