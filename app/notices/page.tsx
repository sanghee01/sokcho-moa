import type { Metadata } from "next";
import { NoticeList } from "@/features/notices/components/notice-list";
import { getPublicNotices } from "@/features/notices/queries";
import { SITE_NAME } from "@/lib/seo/site-identity";

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
