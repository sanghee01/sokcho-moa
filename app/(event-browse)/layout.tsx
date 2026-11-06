import { Suspense, type ReactNode } from "react";
import { BannerVisibility } from "@/features/events/components/banner-visibility";
import { CategoryNavigation } from "@/features/events/components/category-navigation";
import { PopularBanner } from "@/features/events/components/popular-banner";
import { selectPopularEvents } from "@/features/events/model/event-list";
import { getAllPublicEvents } from "@/features/events/queries";

/**
 * 홈과 분야(주제) 목록이 함께 쓰는 틀. 분야 탭과 배너를 여기에 두어, 탭을 바꿀 때 아래 목록만 다시 불러오고
 * 탭·배너는 그대로 남게 한다. 예전에는 둘 다 페이지 안에 있어서 탭을 바꿀 때마다 로딩 화면이 통째로 덮어
 * 페이지 전체가 새로고침되는 것처럼 보였다(2026-11-06).
 */
export default async function EventBrowseLayout({ children }: { children: ReactNode }) {
  const popularEvents = selectPopularEvents(await getAllPublicEvents(), new Date());
  const banner = <PopularBanner events={popularEvents} />;

  return (
    <>
      <CategoryNavigation />
      {/* 주소의 검색 조건을 읽는 동안에는 배너를 그대로 보여 준다. */}
      <Suspense fallback={banner}>
        <BannerVisibility>{banner}</BannerVisibility>
      </Suspense>
      {children}
    </>
  );
}
