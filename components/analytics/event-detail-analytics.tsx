"use client";

import { useEffect, useRef } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import type { EventAudience, EventCategory } from "@/lib/domain/event";

type EventDetailAnalyticsProps = {
  slug: string;
  category: EventCategory;
  audiences: EventAudience[];
  applicationAvailable: boolean;
};

export function EventDetailAnalytics({ slug, category, audiences, applicationAvailable }: EventDetailAnalyticsProps) {
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (trackedSlug.current === slug) return;
    trackedSlug.current = slug;

    trackAnalyticsEvent("event_detail_viewed", {
      event_slug: slug,
      event_category: category,
      event_audiences: audiences.join("|"),
      application_available: applicationAvailable,
    });

    const storageKey = `event-view-recorded:${slug}`;
    try {
      if (!window.sessionStorage.getItem(storageKey)) {
        window.sessionStorage.setItem(storageKey, "1");
        void fetch(`/api/events/${slug}/view`, { method: "POST", keepalive: true });
      }
    } catch {
      // 저장소 사용이 제한된 브라우저에서도 상세 페이지는 정상적으로 제공한다.
    }
  }, [applicationAvailable, audiences, category, slug]);

  return null;
}
