"use client";

import { useEffect } from "react";
import { markInternalTraffic } from "@/lib/analytics/internal-traffic";

/**
 * 관리자 화면에 들어온 기기를 운영자 기기로 표시한다. 화면에는 아무것도 그리지 않는다.
 * 로그인한 관리자 화면(AdminShell)에만 두어, 로그인 화면만 연 방문자는 표시하지 않는다(2026-11-07).
 */
export function InternalTrafficMarker() {
  useEffect(() => {
    markInternalTraffic();
  }, []);

  return null;
}
