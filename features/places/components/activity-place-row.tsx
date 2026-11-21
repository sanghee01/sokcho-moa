import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
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
export function ActivityPlaceRow({ place, showCategory = true }: { place: ActivityPlace; showCategory?: boolean }) {
  const district = getPlaceDistrictLabel(place.address);
  // 속초 밖의 장소만 지역을 적는다. 대부분 속초라 줄마다 "속초"를 되풀이하지 않는다.
  const meta = [showCategory ? activityCategoryLabels[place.activityCategory] : null, district !== null && district !== "속초" ? district : null].filter(Boolean).join(" · ");
  // 요금이 이미 "무료"라고 말하면 무료 태그를 되풀이하지 않는다.
  const tags = place.tags.filter((tag) => !(tag === "free" && place.priceSummary?.includes("무료") === true));
  const details = [place.priceSummary, ...tags.map((tag) => activityTagLabels[tag])].filter(Boolean).join(" · ");
  const thumbnailUrl = selectPlacePhoto(place)?.thumbnailUrl ?? null;
  return (
    <li className="border-b border-line">
      <TransitionLink href={activityPlacePath(place.slug)} showPendingIndicator={false} className="flex min-h-11 items-center gap-3 py-4 hover:bg-surface-subtle">
        <span className="min-w-0 flex-1">
          {Boolean(meta) && <span className="block text-caption font-medium text-primary-text">{meta}</span>}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-title-3 text-content-strong">{place.name}</span>
            {place.operationStatus !== "open" && <Badge tone="muted">{operationStatusLabels[place.operationStatus]}</Badge>}
          </span>
          {Boolean(place.summary) && <span className="mt-1 block text-label font-normal text-content-muted">{place.summary}</span>}
          {/* 요금 문구가 길면 한 줄에서 자른다. 전체 요금은 상세에 있고, 목록에서는 훑어보는 값이다. */}
          {Boolean(details) && <span className="mt-1 block truncate text-caption text-content-subtle">{details}</span>}
        </span>
        {/* 이름이 바로 옆에 글로 있어 대체 텍스트는 비운다(W3C alt 결정 트리: 옆 글과 같은 내용). 화면 아래 줄은 보일 때 불러온다. */}
        {thumbnailUrl !== null
          ? <Image src={thumbnailUrl} alt="" width={80} height={80} unoptimized loading="lazy" className="size-20 shrink-0 rounded-control bg-surface-muted object-cover" />
          : <ChevronRight {...iconProps} className="shrink-0 text-content-subtle" aria-hidden="true" />}
      </TransitionLink>
    </li>
  );
}

/** 목록 줄 묶음. 모바일 한 열, md부터 두 열이다. */
export const activityPlaceListClassName = "border-t border-line md:grid md:grid-cols-2 md:gap-x-10 md:border-t-0";
