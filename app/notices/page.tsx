import type { Metadata } from "next";
import { NoticeList } from "@/features/notices/components/notice-list";
import { getPublicNotices } from "@/features/notices/queries";
import { SITE_NAME } from "@/lib/seo/site-identity";

// 미리 만든 정적 결과로만 응답해야 하는 페이지다. 누가 요청 값(searchParams·cookies)이나 캐시하지 않은 조회를 더하면 빌드가 멈춘다.
// 루트 layout의 instant = false가 사이트 전체의 미리 만들기 검사를 끄므로, 검색 유입을 받는 정적 페이지는 여기서 따로 지킨다(2026-11-24 리뷰).
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "공지사항",
  description: `${SITE_NAME}의 공지와 새로 바뀐 점을 알려 드립니다.`,
  alternates: { canonical: "/notices" },
};

export default async function NoticesPage() {
  const notices = await getPublicNotices();
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
      <h1 className="text-title-1 text-content-strong lg:text-title-1-lg">공지사항</h1>
      <NoticeList notices={notices} />
    </main>
  );
}
