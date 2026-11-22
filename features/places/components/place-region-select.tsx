"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { PlaceRegionSelectForm } from "@/features/places/components/place-region-select-form";
import { ALL_REGIONS, isPlaceRegion, type PlaceRegion } from "@/features/places/model/region";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/**
 * 가볼만한 곳 지역 고르기(.ai/DESIGN.md PlaceRegionSelect). 목록과 검색이 쓴다.
 * 지역 칩 줄 대신 select 하나로 고른다(2026-11-22 사용자 결정: 칩이 많으면 정신없어 보임). 보기는 전체 지역 · 속초 · 고성 · 양양이다.
 * defaultRegion: 주소에 ?region=이 없을 때 골라져 있는 값. 목록은 속초(전체는 ?region=all), 검색은 null = 전체 지역이다(2026-11-22 사용자 결정).
 * 고르면 지금 주소의 다른 값(검색어·범위)은 두고 ?region=만 바꿔 옮긴다. 기본값을 고르면 주소에서 뺀다. 주소에 남아 상세에서 돌아와도 그대로다.
 * 목록 페이지는 미리 만들어 둔 정적 페이지라 서버가 지역을 모른다. 목록은 이 select의 고른 값을 보고 CSS가 다른 지역 줄을 숨긴다(globals.css의 data-region-scope).
 * canSubmitWithoutScript: 서버가 ?region=을 읽는 화면(검색)은 스크립트가 없어도 GET 폼과 "보기" 버튼으로 같은 주소를 연다.
 * 정적 목록은 서버가 지역을 모르고 브라우저가 거르므로 버튼을 두지 않는다(스크립트가 없으면 기본 지역이 보인다).
 */
export function PlaceRegionSelect({
  regions,
  defaultRegion,
  surface,
  canSubmitWithoutScript = false,
}: {
  regions: readonly PlaceRegion[];
  defaultRegion: PlaceRegion | null;
  /** GA place_region_changed의 화면. 지역을 어디서 바꾸는지 본다. */
  surface: "place_list" | "site_search";
  canSubmitWithoutScript?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultValue = defaultRegion ?? ALL_REGIONS;
  const param = searchParams.get("region");
  // 보기에 없는 지역(결과에 없는 지역)이 주소에 있으면 기본값을 고른 것으로 보인다. 서버도 그 값을 무시한다(resolveSearchRegion).
  const value = param === ALL_REGIONS || (isPlaceRegion(param) && regions.includes(param)) ? param : defaultValue;
  const carriedParams = [...searchParams.entries()].filter(([name]) => name !== "region");

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === value) return;
    const params = new URLSearchParams(carriedParams);
    if (next !== defaultValue) params.set("region", next);
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    // 정적 목록은 서버가 지역을 모르고 CSS가 거르므로 서버에 다시 묻지 않고 주소만 바꾼다(Next.js 문서 Native History API).
    // router.push를 쓰면 응답이 올 때까지 select가 앞 값으로 되돌아가 느린 회선에서 잠깐 앞 지역이 보였다(2026-11-22 리뷰).
    // 검색은 서버가 지역으로 거르므로 다시 그려 받는다.
    if (surface === "place_list") window.history.pushState(null, "", href);
    else router.push(href, { scroll: false });
    trackAnalyticsEvent("place_region_changed", { region: next, surface });
  }

  return (
    <PlaceRegionSelectForm
      action={pathname}
      carriedParams={carriedParams}
      regions={regions}
      value={value}
      canSubmitWithoutScript={canSubmitWithoutScript}
      onChange={handleChange}
    />
  );
}
