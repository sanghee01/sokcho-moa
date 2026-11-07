"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackAnalyticsEvent, type AnalyticsEvent, type AnalyticsEventParams } from "@/lib/analytics/events";

// 화면 아래쪽 4분의 1은 빼고 본다. 화면 끝에 한 줄 걸친 것만으로는 "봤다"고 보기 어렵다(2026-11-07).
const VIEW_ROOT_MARGIN = "0px 0px -25% 0px";

/**
 * 감싼 영역이 화면에 들어왔을 때 GA 이벤트를 한 번 보낸다. 주변 명소처럼 아래쪽에 있어
 * 본 사람과 안 본 사람이 갈리는 구역의 노출을 셀 때 쓴다(클릭률의 분모).
 * 감싸는 div는 여백·배치 class가 없어 화면 모양을 바꾸지 않는다.
 */
export function AnalyticsViewTracking<T extends AnalyticsEvent>({
  name,
  properties,
  children,
}: {
  name: T;
  properties: AnalyticsEventParams[T];
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSent = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    // IntersectionObserver가 없는 오래된 브라우저에서는 세지 않는다. 화면은 그대로 보인다.
    if (container === null || hasSent.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (hasSent.current || !entries.some((entry) => entry.isIntersecting)) return;
      hasSent.current = true;
      observer.disconnect();
      trackAnalyticsEvent(name, properties);
    }, { rootMargin: VIEW_ROOT_MARGIN });
    observer.observe(container);
    return () => observer.disconnect();
  }, [name, properties]);

  return <div ref={containerRef}>{children}</div>;
}
