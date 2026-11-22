"use client";

import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { ActivityCategoryNavLinks } from "@/features/places/components/activity-category-nav-links";
import { parseListRegion } from "@/features/places/model/region";

/**
 * 즐길거리 분류 칩. 주소의 지역(?region=)을 읽어 칩 링크에 붙인다. 고른 지역이 분류를 바꿔도 남는다(2026-11-22).
 * 목록은 정적 페이지라 서버가 지역을 모른다. 그래서 지역은 브라우저에서 읽고, 첫 HTML은 기본 지역(속초) 링크(ActivityCategoryNavLinks)로 그린다.
 */
export function ActivityCategoryNav(props: Omit<ComponentProps<typeof ActivityCategoryNavLinks>, "region">) {
  const region = parseListRegion(useSearchParams().get("region"));
  return <ActivityCategoryNavLinks {...props} region={region} />;
}
