import type { Metadata } from "next";
import { ActivityListPage } from "@/features/places/components/activity-list-page";
import { ACTIVITY_LIST_PATH, selectActivityPlaces } from "@/features/places/model/activity";
import { getPublicPlaces } from "@/features/places/queries";
import { ACTIVITY_LIST_TITLE, buildActivityListDescription } from "@/features/places/seo";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW_ROBOTS, SITE_NAME, SITE_OPEN_GRAPH_IMAGE_PATH, SITE_OPEN_GRAPH_IMAGES } from "@/lib/seo/site-identity";

export async function generateMetadata(): Promise<Metadata> {
  const places = selectActivityPlaces(await getPublicPlaces());
  const title = `${ACTIVITY_LIST_TITLE} 명소·워터파크·전시·전망대`;
  const description = buildActivityListDescription(places);
  return {
    title,
    description,
    alternates: { canonical: ACTIVITY_LIST_PATH },
    // 장소가 하나도 없을 때는 화면만 열고 검색에 올리지 않는다(빈 페이지를 알리지 않음).
    robots: places.length > 0 ? INDEXABLE_ROBOTS : NOINDEX_FOLLOW_ROBOTS,
    // 카카오톡 등에 공유할 때 미리보기 이미지가 비지 않게 사이트 기본 이미지를 넣는다(2026-11-21 SEO 점검).
    openGraph: { type: "website", locale: "ko_KR", url: ACTIVITY_LIST_PATH, siteName: SITE_NAME, title, description, images: SITE_OPEN_GRAPH_IMAGES },
    twitter: { card: "summary_large_image", title, description, images: [SITE_OPEN_GRAPH_IMAGE_PATH] },
  };
}

export default async function PlacesPage() {
  return <ActivityListPage places={await getPublicPlaces()} />;
}
