"use client";

import { useSyncExternalStore } from "react";

const REFRESH_INTERVAL_MS = 60_000;

function subscribe(onChange: () => void) {
  const intervalId = window.setInterval(onChange, REFRESH_INTERVAL_MS);
  return () => window.clearInterval(intervalId);
}

/** 1분 단위로 자른 현재 시각. 같은 분 안에서는 같은 값을 돌려줘야 useSyncExternalStore가 다시 그리지 않는다. */
function currentMinute() {
  return Math.floor(Date.now() / REFRESH_INTERVAL_MS) * REFRESH_INTERVAL_MS;
}

/**
 * 시간에 따라 바뀌는 표시(진행 중·신청 마감 등)를 방문자의 현재 시각으로 계산하기 위한 시각.
 * hydration 중에는 서버가 그린 시각(renderedAt)을 써서 서버 HTML과 맞추고, 그 뒤 실제 현재 시각으로
 * 다시 그린 다음 1분마다 갱신한다. 상세 페이지는 ISR로 최대 1시간 캐시되어, 서버 시각만 쓰면
 * 마감 뒤에도 "신청 가능"이 보였다.
 */
export function useCurrentTime(renderedAt: string) {
  const timestamp = useSyncExternalStore(subscribe, currentMinute, () => new Date(renderedAt).getTime());
  return new Date(timestamp);
}
