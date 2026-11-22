import { Suspense, type ReactNode } from "react";
import { MapView } from "@/features/map/components/map-view";
import type { PlaceMapPin, VenueMapPin } from "@/features/map/model/map-pins";

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
    // 지도가 헤더와 하단 탭 사이를 꽉 채운다(높이는 이 한 곳에서 정한다). data-full-screen-map이 있으면 globals.css가 공통 푸터를 숨긴다:
    // 푸터가 지도 아래 붙으면 페이지가 화면보다 길어, 칩·헤더를 끌 때 페이지가 스크롤돼 지도가 밀렸다(2026-11-16 사용자 결정).
    // 모바일 하단 탭(--bottom-chrome-height)과 safe area만큼 더 뺀다. body가 그만큼 아래 여백을 두기 때문이다(2026-11-21).
    <main id="main-content" data-full-screen-map className="h-[calc(100svh-var(--site-header-height)-var(--bottom-chrome-height)-env(safe-area-inset-bottom))]">
      <h1 className="sr-only">속초 행사·가볼만한 곳 지도</h1>
      {/* 레이어(?layer=)·분야(?category=)·장소(?place=)를 주소에서 읽어, 정적 페이지를 만들 때는 빈 지도 자리만 그린다. */}
      <Suspense fallback={<div className="h-full bg-surface-muted" />}>
        <MapView pins={pins} placePins={placePins} cards={cards} clientId={clientId} />
      </Suspense>
    </main>
  );
}
