import { Suspense, type ReactNode } from "react";
import { VisiblePageStyle } from "@/components/layout/visible-page-style";
import { MapView } from "@/features/map/components/map-view";
import type { PlaceMapPin, VenueMapPin } from "@/features/map/model/map-pins";

// 지도가 헤더 아래를 꽉 채우는 화면이라 공통 푸터를 숨긴다. 푸터가 있으면 페이지가 화면보다 길어 칩·헤더를 끌 때 페이지가 스크롤돼
// 지도가 위로 밀렸다(2026-11-16 사용자 결정). 공지 띠도 같은 이유로 숨긴다. 지도 높이는 화면에서 헤더만 뺀 값이라 띠가 끼면 그만큼 넘친다(2026-11-21).
// 지도 화면이 보일 때만 켠다(VisiblePageStyle). 예전에는 globals.css의 :has() 규칙이라 지도를 떠난 뒤에도 푸터가 숨은 채 남았다(2026-11-24 리뷰).
const FULL_SCREEN_MAP_PAGE_CSS = `@layer base {
  body > footer, body > [data-notice-banner] { display: none; }
}`;

/**
 * 지도 탭 화면(.ai/DESIGN.md 지도). 핀과 카드는 서버에서 만들고, 지도·핀·칩은 브라우저에서 그린다.
 * 행사 카드(EventCard)와 장소 카드는 app/map/page.tsx가 각 도메인에서 그려 넘긴다. 지도는 행사와 가볼만한 곳을 함께 보여 주는 화면이라
 * features/map에 두고, 다른 feature에서는 model만 가져온다(2026-11-22 사용자 결정으로 features/events에서 옮김).
 * 예전 이름은 EventMapPage였다(같은 이유로 2026-11-22 MapScreen으로 바꿈).
 */
export function MapScreen({
  pins,
  placePins,
  cards,
  clientId,
}: {
  pins: VenueMapPin[];
  placePins: PlaceMapPin[];
  /** 행사 slug 또는 장소 핀 id → 서버가 그린 카드 */
  cards: Record<string, ReactNode>;
  clientId: string | null;
}) {
  return (
    // 지도가 헤더와 하단 탭 사이를 꽉 채운다(높이는 이 한 곳에서 정한다). 공통 푸터는 위 FULL_SCREEN_MAP_PAGE_CSS가 숨긴다.
    // 모바일 하단 탭(--bottom-chrome-height)과 safe area만큼 더 뺀다. body가 그만큼 아래 여백을 두기 때문이다(2026-11-21).
    <main id="main-content" className="h-[calc(100svh-var(--site-header-height)-var(--bottom-chrome-height)-env(safe-area-inset-bottom))]">
      <VisiblePageStyle css={FULL_SCREEN_MAP_PAGE_CSS} />
      <h1 className="sr-only">속초 행사·가볼만한 곳 지도</h1>
      {/* 레이어(?layer=)·분야(?category=)·장소(?place=)를 주소에서 읽어, 정적 페이지를 만들 때는 빈 지도 자리만 그린다. */}
      <Suspense fallback={<div className="h-full bg-surface-muted" />}>
        <MapView pins={pins} placePins={placePins} cards={cards} clientId={clientId} />
      </Suspense>
    </main>
  );
}
