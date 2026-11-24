"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState, type ChangeEvent } from "react";
import { PENDING_REGION_WINDOW_KEY, PlaceRegionSelectForm } from "@/features/places/components/place-region-select-form";
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
  // 고른 값은 바로 이 select가 들고 있다. 주소(useSearchParams)는 Next.js 라우터가 주소 변경을 알아챈 뒤에 따라오는데, 스크립트가 막 붙은 순간에는
  // 라우터가 아직 준비되지 않아 select가 앞 값으로 되돌아가고 목록 거르기(CSS)도 앞 지역에 머물렀다(2026-11-24). 뒤로 가기처럼 주소가 바뀌면 주소를 따른다.
  const [selectedValue, setSelectedValue] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setSelectedValue(value);
  }

  function selectRegion(next: string, historyMode: "push" | "replace") {
    if (next === selectedValue) return;
    setSelectedValue(next);
    const params = new URLSearchParams(carriedParams);
    if (next !== defaultValue) params.set("region", next);
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    // 정적 목록은 서버가 지역을 모르고 CSS가 거르므로 서버에 다시 묻지 않고 주소만 바꾼다(Next.js 문서 Native History API).
    // router.push를 쓰면 응답이 올 때까지 select가 앞 값으로 되돌아가 느린 회선에서 잠깐 앞 지역이 보였다(2026-11-22 리뷰).
    // 검색은 서버가 지역으로 거르므로 다시 그려 받는다.
    if (surface === "place_list") {
      // 이어받을 때는 붙기 전의 선택을 되살리는 것이라 기록을 쌓지 않는다.
      if (historyMode === "replace") window.history.replaceState(null, "", href);
      else window.history.pushState(null, "", href);
    } else router.push(href, { scroll: false });
    trackAnalyticsEvent("place_region_changed", { region: next, surface });
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    selectRegion(event.target.value, "push");
  }

  // 앱 스크립트가 붙기 전에 임시 select에서 고른 지역을 이어받는다. 붙는 도중에 고르면 라우터가 주소를 처음 값으로 되돌려 선택이 사라졌다(2026-11-24).
  // 이 select가 붙을 때 한 번만 읽고 지운다(그 뒤의 선택은 handleChange). 정적 목록에만 임시 select가 있다.
  // React는 자식 effect를 부모보다 먼저 돌려, 바로 주소를 바꾸면 Next.js 라우터(부모)가 아직 알아채지 못한다. 첫 화면의 effect가 다 끝난 다음 틱에 적용한다.
  const restorePendingRegion = useEffectEvent(() => {
    const pending: unknown = Reflect.get(window, PENDING_REGION_WINDOW_KEY);
    if (typeof pending !== "string") return;
    Reflect.deleteProperty(window, PENDING_REGION_WINDOW_KEY);
    selectRegion(pending, "replace");
  });

  useEffect(() => {
    const timer = window.setTimeout(() => restorePendingRegion(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <PlaceRegionSelectForm
      action={pathname}
      carriedParams={carriedParams}
      regions={regions}
      value={selectedValue}
      canSubmitWithoutScript={canSubmitWithoutScript}
      onChange={handleChange}
    />
  );
}
