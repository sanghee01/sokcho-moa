import { Suspense, type ReactNode } from "react";
import { filterSelectDividerClassName } from "@/features/places/components/filter-select";
import { ActivityCategoryNav } from "@/features/places/components/activity-category-nav";
import { ActivityCategoryNavLinks } from "@/features/places/components/activity-category-nav-links";
import { PlaceRegionSelect } from "@/features/places/components/place-region-select";
import { PlaceRegionSelectFallback } from "@/features/places/components/place-region-select-fallback";
import { SelectedChipScroller } from "@/features/places/components/selected-chip-scroller";
import { ACTIVITY_LIST_PATH, listActivityCategories, selectActivityPlaces } from "@/features/places/model/activity";
import type { Place } from "@/features/places/model/place";
import { DEFAULT_LIST_REGION, listPlaceRegions } from "@/features/places/model/region";

/**
 * 가볼만한 곳 목록(전체 /places, 분류 /places/category/*)이 함께 쓰는 틀. app/places/(list)/layout.tsx가 쓴다.
 * 지역 select와 분류 칩 줄을 여기 두어, 분류를 바꿔도 칩 줄이 다시 만들어지지 않고 아래 목록만 바뀐다(2026-11-24 사용자 요청).
 * 예전에는 페이지 안에 있어 분류를 누를 때마다 칩 줄이 새로 만들어져, 뒤쪽 분류를 누르면 가로 스크롤이 "전체" 쪽으로 돌아갔다.
 * 행사 목록의 분야 탭(app/(event-browse)/layout.tsx)과 같은 방식이다.
 * main은 이 틀에 둔다. 지역 거르기 CSS(globals.css의 data-region-scope)가 select와 목록 줄을 함께 감싼 칸에서 고른 지역을 보기 때문이다.
 *
 * 지역(?region=)은 분류 칩 왼쪽의 select로 고르고, 처음에는 속초가 골라져 있다(제목 "속초 가볼만한 곳"과 맞음, 2026-11-22 사용자 결정).
 * 줄(data-region), 분류 묶음·칩(data-regions)에 지역을 적고, 고른 지역이 아닌 것은 CSS가 숨긴다.
 */
export function ActivityListLayout({ places, children }: { places: readonly Place[]; children: ReactNode }) {
  const categories = listActivityCategories(places);
  const regions = listPlaceRegions(selectActivityPlaces(places));
  const categoryRegions = Object.fromEntries(categories.map((item) => [item, listPlaceRegions(selectActivityPlaces(places, item))]));
  const navProps = { categories, categoryRegions };

  return (
    <main id="main-content" data-region-scope className="mx-auto max-w-6xl px-4 pb-16 pt-2 sm:px-6 lg:pt-3">
      {/* 분류 칩 줄 맨 앞에 지역 select를 두고 세로 구분선으로 나눈다(A안, 2026-11-22 사용자 결정). 줄을 따로 늘리지 않고 "어디서 → 무엇을" 순서로 읽힌다.
          모바일은 select를 왼쪽에 두고 분류 칩만 가로로 밀어 본다. sm 이상은 칩이 꺾인다. */}
      <div className="flex items-center gap-x-2 sm:items-start">
        {regions.length > 1 && (
          <>
            {/* 틀은 지금 분류를 모른다. 첫 HTML의 select는 제출 버튼이 없어 폼 주소(action)로 가지 않으므로 목록 주소를 둔다. */}
            <Suspense fallback={<PlaceRegionSelectFallback action={ACTIVITY_LIST_PATH} regions={regions} defaultRegion={DEFAULT_LIST_REGION} />}>
              <PlaceRegionSelect regions={regions} defaultRegion={DEFAULT_LIST_REGION} surface="place_list" />
            </Suspense>
            <span aria-hidden="true" className={`${filterSelectDividerClassName} sm:mt-2.5`} />
          </>
        )}
        <SelectedChipScroller className="-mr-4 min-w-0 flex-1 overflow-x-auto pr-4 sm:mr-0 sm:overflow-visible sm:pr-0">
          <Suspense fallback={<ActivityCategoryNavLinks {...navProps} region={DEFAULT_LIST_REGION} />}>
            <ActivityCategoryNav {...navProps} />
          </Suspense>
        </SelectedChipScroller>
      </div>
      {children}
    </main>
  );
}
