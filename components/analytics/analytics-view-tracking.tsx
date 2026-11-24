"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { trackAnalyticsEvent, type AnalyticsEvent, type AnalyticsEventParams } from "@/lib/analytics/events";

// 화면 아래쪽 4분의 1은 빼고 본다. 화면 끝에 한 줄 걸친 것만으로는 "봤다"고 보기 어렵다(2026-11-07).
const VIEW_ROOT_MARGIN = "0px 0px -25% 0px";

/**
 * 감싼 영역이 화면에 들어왔을 때 GA 이벤트를 한 번 보낸다. 행사 상세의 관련 행사처럼 아래쪽에 있어
 * 본 사람과 안 본 사람이 갈리는 구역의 노출을 셀 때 쓴다(클릭률의 분모).
 * 감싸는 div는 여백·배치 class가 없어 화면 모양을 바꾸지 않는다.
 * 뒤로·앞으로 가기로 숨겨 둔 화면(cacheComponents)이 다시 보이면 새 화면처럼 다시 센다. 전에는 화면을 새로 만들어 저절로 그렇게 됐다(2026-11-24).
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

  // 화면이 숨겨지거나 사라질 때만 돈다. 같은 화면에서 props만 바뀐 경우는 다시 세지 않는다.
  useLayoutEffect(() => () => {
    hasSent.current = false;
  }, []);

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
