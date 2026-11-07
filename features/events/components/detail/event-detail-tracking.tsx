"use client";

import { useEffect, useRef } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import type { EventAudience, EventCategory } from "@/features/events/model/taxonomy";

/**
 * 행사 상세를 연 것을 두 곳에 기록한다.
 * 1. GA4 분석 이벤트(event_detail_viewed)
 * 2. 서비스 조회수(POST /api/events/[slug]/view). 조회순 정렬과 "지금 많이 보는 행사"에 쓰이는 데이터라 분석과 별개다.
 * 예전 이름(EventDetailAnalytics)은 분석만 하는 것처럼 보여 바꿨다(2026-11-07).
 * 조회수는 같은 탭에서 한 번만 센다(sessionStorage).
 */
export function EventDetailTracking({
  slug,
  category,
  audiences,
  applicationAvailable,
}: {
  slug: string;
  category: EventCategory;
  audiences: EventAudience[];
  applicationAvailable: boolean;
}) {
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
