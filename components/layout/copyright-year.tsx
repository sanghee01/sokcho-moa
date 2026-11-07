"use client";

import { useSyncExternalStore } from "react";
import { getSeoulDateParts } from "@/lib/seoul-time";

// 연도는 페이지를 연 동안 바뀌어도 바로 다시 그릴 만큼 중요하지 않아 구독하지 않는다.
function subscribe() {
  return () => {};
}

function currentSeoulYear() {
  return getSeoulDateParts(new Date()).year;
}

/**
 * 푸터의 저작권 연도. 제보·의견처럼 정적인 페이지는 build할 때 한 번 그려져 그때의 연도가 굳는다.
 * hydration 때는 서버가 그린 연도(serverYear)로 맞추고, 그 뒤 방문자 시각의 서울 연도로 다시 그린다(2026-11-07).
 */
export function CopyrightYear({ serverYear }: { serverYear: number }) {
  const year = useSyncExternalStore(subscribe, currentSeoulYear, () => serverYear);
  return <>{year}</>;
}
