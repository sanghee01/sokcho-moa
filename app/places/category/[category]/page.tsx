import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityListPage } from "@/features/places/components/activity-list-page";
import {
  activityCategoryPath,
  isActivityCategory,
  listActivityCategories,
  selectActivityPlaces,
} from "@/features/places/model/activity";
import { getPublicPlaces } from "@/features/places/queries";
import { buildActivityCategorySeoTitle, buildActivityListDescription } from "@/features/places/seo";
import { INDEXABLE_ROBOTS, SITE_NAME, SITE_OPEN_GRAPH_IMAGES, SITE_OPEN_GRAPH_IMAGE_PATH } from "@/lib/seo/site-identity";

export const revalidate = 3600;

export async function generateStaticParams() {
  return listActivityCategories(await getPublicPlaces()).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/places/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isActivityCategory(category)) return { title: "페이지를 찾을 수 없습니다" };
  const places = selectActivityPlaces(await getPublicPlaces(), category);
  const title = buildActivityCategorySeoTitle(places, category);
  const description = buildActivityListDescription(places, category);
  const path = activityCategoryPath(category);
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: INDEXABLE_ROBOTS,
    // 공유 미리보기 이미지가 비지 않게 사이트 기본 이미지를 넣는다(2026-11-21 SEO 점검).
    openGraph: { type: "website", locale: "ko_KR", url: path, siteName: SITE_NAME, title, description, images: SITE_OPEN_GRAPH_IMAGES },
    twitter: { card: "summary_large_image", title, description, images: [SITE_OPEN_GRAPH_IMAGE_PATH] },
  };
}

export default async function PlaceCategoryPage({ params }: PageProps<"/places/category/[category]">) {
  const [{ category }, places] = await Promise.all([params, getPublicPlaces()]);
  // 모르는 분류와 장소가 하나도 없는 분류는 열지 않는다. 내용 없는 분류 페이지를 검색에 남기지 않는다.
  if (!isActivityCategory(category) || selectActivityPlaces(places, category).length === 0) notFound();
  return <ActivityListPage places={places} category={category} />;
}
