"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { markInAppBrowser, removeCampaignParams } from "@/lib/analytics/acquisition";
import {
  isAnalyticsEvent,
  parseAnalyticsProperties,
  trackAnalyticsAttributes,
  trackPageView,
} from "@/lib/analytics/events";
import { shouldTrackGoogleAnalyticsPage } from "@/lib/analytics/google-analytics";

export function AnalyticsRuntime() {
  const pathname = usePathname();
  const lastObservedLocation = useRef<string | null>(null);

  useEffect(() => {
    const pageLocation = window.location.href;
    if (lastObservedLocation.current === pageLocation) return;

    const isFirstPage = lastObservedLocation.current === null;
    const pageReferrer = lastObservedLocation.current || document.referrer || undefined;
    lastObservedLocation.current = pageLocation;

    // 앱 안 브라우저 표시는 방문 첫 page_view보다 먼저 붙인다(lib/analytics/acquisition.ts).
    if (isFirstPage) markInAppBrowser(navigator.userAgent);

    if (shouldTrackGoogleAnalyticsPage(pathname)) {
      trackPageView({
        page_title: document.title,
        page_location: pageLocation,
        page_referrer: pageReferrer,
      });
    }

    // GA는 page_view의 page_location에서 utm 꼬리표를 읽으므로, 보낸 뒤에는 주소창에서 지운다.
    // 남겨 두면 방문자가 주소를 복사해 다시 퍼뜨릴 때 꼬리표가 따라가 엉뚱한 유입으로 잡힌다(2026-11-17).
    const cleanLocation = removeCampaignParams(pageLocation);
    if (cleanLocation !== null) {
      window.history.replaceState(null, "", cleanLocation);
      lastObservedLocation.current = cleanLocation;
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(nativeEvent: MouseEvent) {
      const target = nativeEvent.target instanceof Element ? nativeEvent.target.closest<HTMLElement>("[data-analytics-event]") : null;
      if (!target) return;
      const name = target.dataset.analyticsEvent;
      if (!isAnalyticsEvent(name)) return;
      trackAnalyticsAttributes(name, parseAnalyticsProperties(target.dataset.analyticsProperties));
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
