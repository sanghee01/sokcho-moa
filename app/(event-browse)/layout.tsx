import { Suspense, type ReactNode } from "react";
import { BannerVisibility } from "@/features/events/components/browse/banner-visibility";
import { PopularBanner } from "@/features/events/components/browse/popular-banner";
import { selectPopularEvents } from "@/features/events/model/event-list";
import { getAllPublicEvents } from "@/features/events/queries";

/**
 * 홈과 분야(주제) 목록이 함께 쓰는 틀. 배너를 여기에 두어, 탭을 바꿀 때 아래 목록만 다시 불러오고
 * 배너는 그대로 남게 한다. 예전에는 페이지 안에 있어서 탭을 바꿀 때마다 로딩 화면이 통째로 덮어
 * 페이지 전체가 새로고침되는 것처럼 보였다(2026-11-06).
 * 분야 탭은 헤더와 함께 고정하려고 전역 헤더(app/layout.tsx)로 옮겼다(2026-11-07).
 */
export default async function EventBrowseLayout({ children }: { children: ReactNode }) {
  const popularEvents = selectPopularEvents(await getAllPublicEvents(), new Date());
  const banner = <PopularBanner events={popularEvents} />;

  return (
    <>
      {/* 주소의 검색 조건을 읽는 동안에는 배너를 그대로 보여 준다. */}
      <Suspense fallback={banner}>
        <BannerVisibility>{banner}</BannerVisibility>
      </Suspense>
      {children}
    </>
  );
}
