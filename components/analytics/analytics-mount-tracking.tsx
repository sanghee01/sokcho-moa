"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { trackAnalyticsEvent, type AnalyticsEvent, type AnalyticsEventParams } from "@/lib/analytics/events";

// onceKey로 보낸 기록을 이벤트마다 하나씩 기억한다. 목록은 정렬만 바꿔도 페이지가 새로 그려져
// 컴포넌트 안의 ref가 초기화되므로, 같은 검색을 다시 세지 않으려면 컴포넌트 밖에 둬야 한다(2026-11-07).
const lastSentKeys = new Map<AnalyticsEvent, string>();

/**
 * 화면에 나타날 때 GA 이벤트를 한 번 보낸다. 제보·의견 접수 완료 화면이나 검색 결과처럼
 * 서버가 그린 결과를 기록할 때 쓴다. 화면에는 아무것도 그리지 않는다.
 * onceKey를 주면 같은 이벤트를 같은 키로 이어서 보내지 않는다(예: 같은 검색어에서 정렬만 바꿈).
 * shouldCountEachView: 상세 조회처럼 화면이 보일 때마다 센다. cacheComponents는 떠난 화면을 숨겨 두었다가 뒤로·앞으로 가기에서 그대로 다시 보여 주는데(React <Activity>),
 * 컴포넌트가 새로 만들어지지 않아 보낸 기록(ref)이 남는다. 숨겨질 때 기록을 지워 다시 보이면 한 번 더 보낸다(2026-11-24 사용자 결정).
 * 접수 완료처럼 한 번 일어난 일을 세는 이벤트는 이 값을 주지 않아, 완료 화면이 다시 보여도 다시 세지 않는다.
 */
export function AnalyticsMountTracking<T extends AnalyticsEvent>({
  name,
  properties,
  onceKey,
  shouldCountEachView = false,
}: {
  name: T;
  properties: AnalyticsEventParams[T];
  onceKey?: string;
  shouldCountEachView?: boolean;
}) {
  const hasSent = useRef(false);

  // 화면이 숨겨지거나 사라질 때만 돈다. 같은 화면에서 서버가 다시 그려 props만 바뀐 경우는 다시 세지 않는다.
  useLayoutEffect(() => {
    if (!shouldCountEachView) return;
    return () => {
      hasSent.current = false;
    };
  }, [shouldCountEachView]);

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
