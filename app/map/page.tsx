import type { Metadata } from "next";
import { EventMapPage } from "@/features/events/components/map/event-map-page";
import { getAllPublicEvents } from "@/features/events/queries";
import { getNaverMapClientId } from "@/lib/env";

// 끝나거나 신청이 마감된 행사를 핀에서 빼려고 다시 만든다(월별 페이지와 같은 값).
// 실제 주기는 안에서 쓰는 행사 데이터 캐시(5분, features/events/queries.ts)를 따른다.
export const revalidate = 3600;

// 화면 내용 대부분이 지도(스크립트)라 검색 결과에 올리지 않는다. 행사 상세·목록·월별 페이지가 검색을 맡는다(2026-11-16).
export const metadata: Metadata = {
  title: "행사 지도",
  description: "속초·고성·양양에서 지금 신청하거나 참여할 수 있는 행사를 지도에서 장소별로 찾아보세요.",
  alternates: { canonical: "/map" },
  robots: { index: false, follow: true },
};

export default async function MapPage() {
  return <EventMapPage events={await getAllPublicEvents()} clientId={getNaverMapClientId()} />;
}
