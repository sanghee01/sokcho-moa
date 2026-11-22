import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { listRowLinkClassName } from "@/components/ui/list-row-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { analyticsData } from "@/lib/analytics/events";
import {
  activityCategoryLabels,
  activityPlacePath,
  activityTagLabels,
  getPlaceDistrictLabel,
  operationStatusLabels,
} from "@/features/places/model/activity";
import type { ActivityPlace } from "@/features/places/model/place";
import { selectPlacePhoto } from "@/features/places/model/place-photo";

/**
 * 즐길거리 목록의 한 줄(.ai/DESIGN.md ActivityPlaceRow). 줄 전체가 상세로 가는 링크 하나다.
 * 사진은 오른쪽 80px 정사각 썸네일이고, 쓸 수 있는 사진이 없는 장소는 썸네일 자리를 빼고 글이 폭 전체를 쓴다.
 * 모든 장소에 사진을 보장할 수 없을 때는 오른쪽에 둬야 글의 왼쪽 정렬이 흔들리지 않는다(NN/g List Thumbnails on Mobile).
 * 빈 상자나 기본 이미지로 채우지 않는다. 내용이 빠진 미완성 화면처럼 보인다(2026-11-21).
 * 평점·후기 수·조회수는 쓰지 않는다. 직접 받은 후기가 없고, 갈지 말지 정하는 값이 아니다(2026-11-21).
 */
export function ActivityPlaceRow({
  place,
  contentSource,
  showCategory = true,
}: {
  place: ActivityPlace;
  /** GA select_content의 출처. 어느 목록에서 장소를 골랐는지 본다(2026-11-21). */
  contentSource: "place_list" | "site_search" | "similar_places";
  showCategory?: boolean;
}) {
  const district = getPlaceDistrictLabel(place.address);
  // 속초 밖의 장소만 지역을 적는다. 대부분 속초라 줄마다 "속초"를 되풀이하지 않는다.
  const meta = [showCategory ? activityCategoryLabels[place.activityCategory] : null, district !== null && district !== "속초" ? district : null].filter(Boolean).join(" · ");
  // 요금이 이미 "무료"라고 말하면 무료 태그를 되풀이하지 않는다.
  const tags = place.tags.filter((tag) => !(tag === "free" && place.priceSummary?.includes("무료") === true));
  const details = [place.priceSummary, ...tags.map((tag) => activityTagLabels[tag])].filter(Boolean).join(" · ");
  const thumbnailUrl = selectPlacePhoto(place)?.thumbnailUrl ?? null;
  return (
    // li를 flex로 두고 링크가 남은 높이를 채운다(flex-1). md부터 두 열이라 옆 줄이 더 높으면 칸이 늘어나는데,
    // 링크가 제 높이만 차지해 hover 배경 아래가 비었다(2026-11-21 사용자 피드백).
    // 모든 줄의 최소 높이를 128px로 둬 사진·요금이 있든 없든, 모바일에서 소개가 두 줄이 돼도 줄 높이가 같다(소개는 두 줄까지만).
    // 128px = 위아래 여백 32px + 분류 한 줄 + 이름 + 소개 두 줄 + 요금 한 줄이 들어가는 높이다.
    <li className="flex border-b border-line">
      <TransitionLink href={activityPlacePath(place.slug)} showPendingIndicator={false} {...analyticsData("select_content", { content_type: "place", content_id: place.slug, content_source: contentSource, place_category: place.activityCategory })} className={`${listRowLinkClassName} min-h-32 min-w-0 flex-1 gap-3 py-4`}>
        <span className="min-w-0 flex-1">
          {Boolean(meta) && <span className="block text-caption font-medium text-primary-text">{meta}</span>}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-title-3 text-content-strong">{place.name}</span>
            {place.operationStatus !== "open" && <Badge tone="muted">{operationStatusLabels[place.operationStatus]}</Badge>}
          </span>
          {Boolean(place.summary) && <span className="mt-1 line-clamp-2 text-label font-normal text-content-muted">{place.summary}</span>}
          {/* 요금 문구가 길면 한 줄에서 자른다. 전체 요금은 상세에 있고, 목록에서는 훑어보는 값이다. */}
          {Boolean(details) && <span className="mt-1 block truncate text-caption text-content-subtle">{details}</span>}
        </span>
        {/* 이름이 바로 옆에 글로 있어 대체 텍스트는 비운다(W3C alt 결정 트리: 옆 글과 같은 내용). 화면 아래 줄은 보일 때 불러온다. */}
        {/* 사진이 없는 줄에도 화살표(>)를 두지 않는다. 사진 있는 줄에는 화살표가 없어 줄마다 모양이 달랐고,
            줄 전체가 링크라는 것은 hover 배경과 목록 모양으로 이미 알 수 있다(2026-11-21 사용자 피드백). */}
        {thumbnailUrl !== null && <Image src={thumbnailUrl} alt="" width={80} height={80} unoptimized loading="lazy" className="size-20 shrink-0 rounded-control bg-surface-muted object-cover" />}
      </TransitionLink>
    </li>
  );
}

/** 목록 줄 묶음. 모바일 한 열, md부터 두 열이다. */
export const activityPlaceListClassName = "border-t border-line md:grid md:grid-cols-2 md:gap-x-10 md:border-t-0";
