import { Suspense, type ReactNode } from "react";
import { BannerVisibility } from "@/features/events/components/browse/banner-visibility";
import { CategoryNavigation } from "@/features/events/components/browse/category-navigation";
import { PopularBanner } from "@/features/events/components/browse/popular-banner";
import { selectPopularEvents } from "@/features/events/model/event-list";
import { getAllPublicEvents } from "@/features/events/queries";

/**
 * 홈과 분야(주제) 목록이 함께 쓰는 틀. 배너를 여기에 두어, 탭을 바꿀 때 아래 목록만 다시 불러오고
 * 배너는 그대로 남게 한다. 예전에는 페이지 안에 있어서 탭을 바꿀 때마다 로딩 화면이 통째로 덮어
 * 페이지 전체가 새로고침되는 것처럼 보였다(2026-11-06).
 * 분야 탭은 헤더와 함께 고정하려고 전역 헤더(app/layout.tsx)로 옮겼다(2026-11-07).
 * 이 묶음에는 loading.tsx를 두지 않는다. 있으면 제목(h1)과 행사 목록이 HTML의 푸터 뒤 숨김 영역으로 가서
 * JS를 실행하지 않는 크롤러가 못 읽을 수 있다. 탭을 바꾸는 동안에는 이전 목록이 남고, 누른 분야 탭이 먼저 선택된다(2026-11-15).
 */
export default async function EventBrowseLayout({ children }: { children: ReactNode }) {
  const popularEvents = selectPopularEvents(await getAllPublicEvents(), new Date());
  const banner = <PopularBanner events={popularEvents} />;

  return (
    <>
      {/* 분야 탭. 탭을 바꿔도 다시 그리지 않도록 공통 틀에 둔다. 월별 일정은 목록의 상태 탭 끝으로 옮겼다(2026-11-21, event-view-tabs.tsx).
          위 여백은 8px(lg 12px)이다. 칩의 누르는 영역이 보이는 알약보다 위아래로 4px 커서, 공지 띠·헤더와 보이는 간격은 12px(lg 16px)이 된다.
          가볼만한 곳·월별 페이지도 같은 값이다(2026-11-21 사용자 피드백: 공지 띠와 칩 사이가 넓었음). */}
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-2 sm:px-6 lg:pt-3">
        <CategoryNavigation />
      </div>
      {/* 주소의 검색 조건을 읽는 동안에는 배너를 그대로 보여 준다. */}
      <Suspense fallback={banner}>
        <BannerVisibility>{banner}</BannerVisibility>
      </Suspense>
      {children}
    </>
  );
}
