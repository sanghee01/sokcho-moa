import type { ChangeEvent } from "react";
import { FilterSelect } from "@/features/places/components/filter-select";
import { ALL_REGIONS, placeRegionLabels, type PlaceRegion } from "@/features/places/model/region";

/**
 * 앱 스크립트가 붙기 전에 임시 select(place-region-select-fallback.tsx)에서 고른 지역을 남겨 두는 window 속성 이름.
 * 붙는 도중에 고르면 Next.js 라우터가 시작하며 주소를 처음 값으로 되돌려, 브라우저용 select(place-region-select.tsx)가 이 값을 이어받아 다시 적용한다(2026-11-24).
 */
export const PENDING_REGION_WINDOW_KEY = "__sokchoMoaPendingRegion";

/**
 * 지역 select의 폼 모양(GET 폼 + FilterSelect). 브라우저에서 움직이는 PlaceRegionSelect와 정적 첫 HTML용 PlaceRegionSelectFallback이 함께 쓴다.
 * data-region-select: 정적 목록의 CSS 거르기(globals.css의 data-region-scope)가 이 폼 안의 고른 보기를 본다.
 */
export function PlaceRegionSelectForm({
  action,
  carriedParams,
  regions,
  value,
  canSubmitWithoutScript,
  onChange,
}: {
  action: string;
  carriedParams: readonly [string, string][];
  regions: readonly PlaceRegion[];
  value: string;
  canSubmitWithoutScript: boolean;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  const options = [{ value: ALL_REGIONS, label: "전체 지역" }, ...regions.map((item) => ({ value: item, label: placeRegionLabels[item] }))];
  return (
    <form method="get" action={action} data-region-select className="inline-flex shrink-0 items-center gap-2">
      {carriedParams.map(([name, paramValue]) => <input key={name} type="hidden" name={name} value={paramValue} />)}
      <FilterSelect label="지역" name="region" value={value} options={options} onChange={onChange} />
      {Boolean(canSubmitWithoutScript) && (
        <noscript>
          <button type="submit" className="min-h-11 rounded-full px-3 text-label font-medium text-primary-text ring-1 ring-inset ring-line-strong">보기</button>
        </noscript>
      )}
    </form>
  );
}
