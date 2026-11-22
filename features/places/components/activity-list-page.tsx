import { Suspense } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { filterSelectDividerClassName } from "@/features/places/components/filter-select";
import { InfoNote } from "@/features/places/components/info-note";
import { TransitionLink } from "@/components/ui/transition-link";
import { ActivityCategoryNav } from "@/features/places/components/activity-category-nav";
import { ActivityCategoryNavLinks } from "@/features/places/components/activity-category-nav-links";
import { ActivityPlaceRow, activityPlaceListClassName } from "@/features/places/components/activity-place-row";
import { PlaceRegionSelect } from "@/features/places/components/place-region-select";
import { PlaceRegionSelectFallback } from "@/features/places/components/place-region-select-fallback";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  listActivityCategories,
  selectActivityPlaces,
  type ActivityCategory,
} from "@/features/places/model/activity";
import type { Place } from "@/features/places/model/place";
import { ALL_REGIONS, DEFAULT_LIST_REGION, listPlaceRegions, placeRegionHref, placeRegionLabels, placeRegions } from "@/features/places/model/region";
import { ACTIVITY_LIST_TITLE } from "@/features/places/seo";

/**
 * 즐길거리 목록 화면. 전체(/places)와 분류(/places/category/*)가 함께 쓴다.
 * 전체에서는 분류마다 제목을 달아 묶고(분류 없이 수십 곳을 늘어놓지 않음), 분류 페이지에서는 그 분류만 보인다.
 * 페이지 제목은 행사 목록처럼 화면 읽기·검색엔진용(sr-only)으로만 둔다. 지금 위치는 주요 메뉴와 고른 분류 칩이 이미 알려 준다(2026-11-21 통일).
 *
 * 지역(?region=)은 분류 칩 왼쪽의 select로 고르고, 처음에는 속초가 골라져 있다(제목 "속초 가볼만한 곳"과 맞음, 2026-11-22 사용자 결정).
 * 장소 값이 거의 바뀌지 않아 페이지는 미리 만들어 두고(정적),
 * 모든 지역의 줄을 그린 뒤 고른 지역이 아닌 줄·분류·칩을 CSS가 숨긴다(globals.css의 data-region-scope, 2026-11-22 사용자 결정).
 * 줄(data-region), 분류 묶음·칩(data-regions)에 지역을 적고, 고른 지역에 보일 곳이 없으면 그 지역의 빈 안내(data-region-empty)가 보인다.
 */
export function ActivityListPage({ places, category }: { places: readonly Place[]; category?: ActivityCategory }) {
  const categories = listActivityCategories(places);
  const groups = (category === undefined ? categories : [category])
    .map((item) => ({ category: item, places: selectActivityPlaces(places, item) }))
    .filter((group) => group.places.length > 0);
  const regions = listPlaceRegions(selectActivityPlaces(places));
  const categoryRegions = Object.fromEntries(categories.map((item) => [item, listPlaceRegions(selectActivityPlaces(places, item))]));
  const shownRegions = listPlaceRegions(groups.flatMap((group) => group.places));
  const emptyRegions = placeRegions.filter((region) => regions.includes(region) && !shownRegions.includes(region));
  const pathname = category === undefined ? ACTIVITY_LIST_PATH : activityCategoryPath(category);
  const navProps = { categories, categoryRegions, selected: category };

  return (
    <main id="main-content" data-region-scope className="mx-auto max-w-6xl px-4 pb-16 pt-2 sm:px-6 lg:pt-3">
      <h1 className="sr-only">
        {category === undefined ? ACTIVITY_LIST_TITLE : `속초 ${activityCategoryLabels[category]}`}
      </h1>
      {/* 분류 칩 줄 맨 앞에 지역 select를 두고 세로 구분선으로 나눈다(A안, 2026-11-22 사용자 결정). 줄을 따로 늘리지 않고 "어디서 → 무엇을" 순서로 읽힌다.
          모바일은 select를 왼쪽에 두고 분류 칩만 가로로 밀어 본다. sm 이상은 칩이 꺾인다. */}
      <div className="flex items-center gap-x-2 sm:items-start">
        {regions.length > 1 && (
          <>
            <Suspense fallback={<PlaceRegionSelectFallback action={pathname} regions={regions} defaultRegion={DEFAULT_LIST_REGION} />}>
              <PlaceRegionSelect regions={regions} defaultRegion={DEFAULT_LIST_REGION} surface="place_list" />
            </Suspense>
            <span aria-hidden="true" className={`${filterSelectDividerClassName} sm:mt-2.5`} />
          </>
        )}
        <div className="-mr-4 min-w-0 flex-1 overflow-x-auto pr-4 sm:mr-0 sm:overflow-visible sm:pr-0">
          <Suspense fallback={<ActivityCategoryNavLinks {...navProps} region={DEFAULT_LIST_REGION} />}>
            <ActivityCategoryNav {...navProps} />
          </Suspense>
        </div>
      </div>
      {/* 사진 출처는 각 장소 페이지에 있고, 방문자가 목록에서 알 필요는 없어 뺐다(2026-11-21 사용자 결정). */}
      <div className="mt-3">
        <InfoNote>운영시간과 요금은 시즌마다 바뀔 수 있어요. 방문 전에 공식 홈페이지에서 확인해 주세요.</InfoNote>
      </div>
      {groups.length === 0 && (
        <div className="mt-10">
          <p className="text-body text-content-muted">아직 올라온 곳이 없어요.</p>
          <TransitionLink href="/" pendingLabel="행사 목록 불러오는 중" showPendingIndicator={false} className={`${getButtonClassName({ variant: "tonal" })} mt-4`}>진행 중인 행사 보기</TransitionLink>
        </div>
      )}
      {emptyRegions.map((region) => (
        <div key={region} data-region-empty={region} className="mt-10 hidden">
          <p className="text-body text-content-muted">{placeRegionLabels[region]}에는 아직 올라온 곳이 없어요.</p>
          <TransitionLink href={placeRegionHref(pathname, ALL_REGIONS)} showPendingIndicator={false} scroll={false} className={`${getButtonClassName({ variant: "tonal" })} mt-4`}>전체 지역 보기</TransitionLink>
        </div>
      ))}
      {groups.map((group) => (
        <section
          key={group.category}
          aria-labelledby={`activity-${group.category}-title`}
          data-regions={listPlaceRegions(group.places).join(" ")}
          className="mt-8 first-of-type:mt-6"
        >
          {/* 분류 페이지에서는 h1이 곧 분류 이름이라 구역 제목을 화면에 되풀이하지 않는다. */}
          <h2 id={`activity-${group.category}-title`} className={category === undefined ? "text-title-2 text-content-strong" : "sr-only"}>
            {activityCategoryLabels[group.category]}
          </h2>
          <ul className={`${category === undefined ? "mt-3" : ""} ${activityPlaceListClassName}`}>
            {group.places.map((place) => <ActivityPlaceRow key={place.id} place={place} showCategory={false} contentSource="place_list" />)}
          </ul>
        </section>
      ))}
    </main>
  );
}
