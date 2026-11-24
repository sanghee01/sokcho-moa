import { JsonLd } from "@/components/seo/json-ld";
import { getButtonClassName } from "@/components/ui/button-styles";
import { InfoNote } from "@/features/places/components/info-note";
import { TransitionLink } from "@/components/ui/transition-link";
import { ActivityPlaceRow, activityPlaceListClassName } from "@/features/places/components/activity-place-row";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  listActivityCategories,
  selectActivityPlaces,
  type ActivityCategory,
} from "@/features/places/model/activity";
import type { Place } from "@/features/places/model/place";
import { ALL_REGIONS, listPlaceRegions, placeRegionHref, placeRegionLabels, placeRegions } from "@/features/places/model/region";
import { ACTIVITY_LIST_TITLE, buildActivityListStructuredData } from "@/features/places/seo";
import { getPublicEnv } from "@/lib/env";

/**
 * 즐길거리 목록의 본문. 전체(/places)와 분류(/places/category/*)가 함께 쓴다.
 * 지역 select·분류 칩 줄과 main은 두 페이지가 함께 쓰는 틀(activity-list-layout.tsx)에 있고, 이 컴포넌트는 그 아래 내용만 그린다(2026-11-24).
 * 전체에서는 분류마다 제목을 달아 묶고(분류 없이 수십 곳을 늘어놓지 않음), 분류 페이지에서는 그 분류만 보인다.
 * 페이지 제목은 행사 목록처럼 화면 읽기·검색엔진용(sr-only)으로만 둔다. 지금 위치는 주요 메뉴와 고른 분류 칩이 이미 알려 준다(2026-11-21 통일).
 *
 * 장소 값이 거의 바뀌지 않아 페이지는 미리 만들어 두고(정적),
 * 모든 지역의 줄을 그린 뒤 고른 지역이 아닌 줄·분류를 CSS가 숨긴다(globals.css의 data-region-scope, 2026-11-22 사용자 결정).
 * 줄(data-region), 분류 묶음(data-regions)에 지역을 적고, 고른 지역에 보일 곳이 없으면 그 지역의 빈 안내(data-region-empty)가 보인다.
 */
export function ActivityListPage({ places, category }: { places: readonly Place[]; category?: ActivityCategory }) {
  const groups = (category === undefined ? listActivityCategories(places) : [category])
    .map((item) => ({ category: item, places: selectActivityPlaces(places, item) }))
    .filter((group) => group.places.length > 0);
  const regions = listPlaceRegions(selectActivityPlaces(places));
  const shownRegions = listPlaceRegions(groups.flatMap((group) => group.places));
  const emptyRegions = placeRegions.filter((region) => regions.includes(region) && !shownRegions.includes(region));
  const pathname = category === undefined ? ACTIVITY_LIST_PATH : activityCategoryPath(category);

  return (
    <>
      <JsonLd data={buildActivityListStructuredData(selectActivityPlaces(places, category), getPublicEnv().NEXT_PUBLIC_SITE_URL, category)} />
      <h1 className="sr-only">
        {category === undefined ? ACTIVITY_LIST_TITLE : `속초 ${activityCategoryLabels[category]}`}
      </h1>
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
    </>
  );
}
