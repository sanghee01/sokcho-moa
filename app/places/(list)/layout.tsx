import type { ReactNode } from "react";
import { ActivityListLayout } from "@/features/places/components/activity-list-layout";
import { getPublicPlaces } from "@/features/places/queries";

/**
 * 가볼만한 곳 전체 목록(/places)과 분류 목록(/places/category/*)이 함께 쓰는 틀. 지역 select와 분류 칩 줄을 여기 두어,
 * 분류를 바꿔도 칩 줄이 그대로 남고 아래 목록만 바뀐다(2026-11-24 사용자 요청). (list)는 주소에 나타나지 않는 묶음이고, 상세(/places/[slug])는 이 틀 밖이다.
 * 이 묶음에는 loading.tsx를 두지 않는다. 행사 목록(app/(event-browse)/layout.tsx)과 같은 이유로, 있으면 목록이 HTML의 숨김 영역으로 가서 JS를 실행하지 않는 크롤러가 못 읽을 수 있다.
 */
// 이 틀 아래(/places, /places/category/*)는 미리 만든 정적 결과로만 응답해야 한다. 누가 요청 값이나 캐시하지 않은 조회를 더하면 빌드가 멈춘다.
// 루트 layout의 instant = false가 사이트 전체의 미리 만들기 검사를 끄므로, 검색 유입을 받는 정적 페이지는 여기서 따로 지킨다(2026-11-24 리뷰).
export const ensureStatic = "navigation";

export default async function PlaceListLayout({ children }: { children: ReactNode }) {
  return <ActivityListLayout places={await getPublicPlaces()}>{children}</ActivityListLayout>;
}
