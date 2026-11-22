import type { ChangeEvent } from "react";
import { FilterSelect } from "@/features/places/components/filter-select";
import { ALL_REGIONS, placeRegionLabels, type PlaceRegion } from "@/features/places/model/region";

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
