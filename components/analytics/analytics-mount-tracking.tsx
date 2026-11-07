"use client";

import { useEffect, useRef } from "react";
import { trackAnalyticsEvent, type AnalyticsEvent, type AnalyticsEventParams } from "@/lib/analytics/events";

// onceKey로 보낸 기록을 이벤트마다 하나씩 기억한다. 목록은 정렬만 바꿔도 페이지가 새로 그려져
// 컴포넌트 안의 ref가 초기화되므로, 같은 검색을 다시 세지 않으려면 컴포넌트 밖에 둬야 한다(2026-11-07).
const lastSentKeys = new Map<AnalyticsEvent, string>();

/**
 * 화면에 나타날 때 GA 이벤트를 한 번 보낸다. 제보·의견 접수 완료 화면이나 검색 결과처럼
 * 서버가 그린 결과를 기록할 때 쓴다. 화면에는 아무것도 그리지 않는다.
 * onceKey를 주면 같은 이벤트를 같은 키로 이어서 보내지 않는다(예: 같은 검색어에서 정렬만 바꿈).
 */
export function AnalyticsMountTracking<T extends AnalyticsEvent>({
  name,
  properties,
  onceKey,
}: {
  name: T;
  properties: AnalyticsEventParams[T];
  onceKey?: string;
}) {
  const hasSent = useRef(false);

  useEffect(() => {
    if (onceKey === undefined) {
      if (hasSent.current) return;
      hasSent.current = true;
    } else {
      if (lastSentKeys.get(name) === onceKey) return;
      lastSentKeys.set(name, onceKey);
    }
    trackAnalyticsEvent(name, properties);
  }, [name, onceKey, properties]);

  return null;
}
