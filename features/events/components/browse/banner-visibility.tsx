"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 검색 결과를 볼 때만 결과에 집중하도록 배너를 숨긴다(.ai/DESIGN.md 페이지 구조 > 홈·주제 목록).
 * 진행중/마감도 탭이라, 배너를 모든 탭에서 같게 보여 준다는 원칙에 따라 마감 탭에서는 숨기지 않는다(2026-11-06).
 * 배너는 탭을 옮겨도 유지되는 공통 틀(layout)에 있어서, 주소의 검색 조건을 여기서 읽는다.
 */
export function BannerVisibility({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const isSearching = Boolean(searchParams.get("q")?.trim());
  if (isSearching) return null;
  return children;
}
