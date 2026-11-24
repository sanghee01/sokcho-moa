"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import type { EventAudience, EventCategory } from "@/features/events/model/taxonomy";

/**
 * 행사 상세를 연 것을 두 곳에 기록한다.
 * 1. GA4 분석 이벤트(event_detail_viewed)
 * 2. 서비스 조회수(POST /api/events/[slug]/view). 조회순 정렬과 "지금 많이 보는 행사"에 쓰이는 데이터라 분석과 별개다.
 * 예전 이름(EventDetailAnalytics)은 분석만 하는 것처럼 보여 바꿨다(2026-11-07).
 * 조회수는 같은 탭에서 한 번만 센다(sessionStorage).
 * GA 이벤트는 page_view처럼 상세가 보일 때마다 센다. cacheComponents는 떠난 상세를 숨겨 두었다가 뒤로·앞으로 가기에서 그대로 다시 보여 주는데,
 * 컴포넌트가 새로 만들어지지 않아 보낸 기록(ref)이 남는다. 숨겨질 때 기록을 지워 다시 보일 때 한 번 더 센다(2026-11-24 사용자 결정).
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

  // 화면이 숨겨지거나 사라질 때만 돈다. 같은 화면에서 서버가 다시 그려 props만 바뀐 경우는 다시 세지 않는다.
  useLayoutEffect(() => () => {
    trackedSlug.current = null;
  }, []);

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
