import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import {
  formatNoticeDate,
  NOTICE_LIST_PATH,
  noticeKindLabels,
  noticePath,
  summarizeNoticeBody,
} from "@/features/notices/model/notice";
import { getPublicNotices } from "@/features/notices/queries";
import { SITE_NAME } from "@/lib/seo/site-identity";
import { isUuid } from "@/lib/uuid";

export const revalidate = 3600;

async function getNotice(id: string) {
  if (!isUuid(id)) return null;
  return (await getPublicNotices()).find((notice) => notice.id === id) ?? null;
}

export async function generateStaticParams() {
  return (await getPublicNotices()).map((notice) => ({ id: notice.id }));
}

export async function generateMetadata({ params }: PageProps<"/notices/[id]">): Promise<Metadata> {
  const notice = await getNotice((await params).id);
  if (notice === null) return { title: "공지를 찾을 수 없습니다" };
  const description = summarizeNoticeBody(notice.body, 150);
  return {
    title: notice.title,
    description,
    alternates: { canonical: noticePath(notice.id) },
    openGraph: { type: "article", locale: "ko_KR", url: noticePath(notice.id), siteName: SITE_NAME, title: notice.title, description },
  };
}

export default async function NoticeDetailPage({ params }: PageProps<"/notices/[id]">) {
  const notice = await getNotice((await params).id);
  if (notice === null) notFound();
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
      <article>
        <p className="flex items-center gap-2 text-caption">
          <span className="font-semibold text-primary-text">{noticeKindLabels[notice.kind]}</span>
          <time dateTime={notice.publishedAt} className="text-content-subtle tabular-nums">{formatNoticeDate(notice.publishedAt)}</time>
        </p>
        <h1 className="mt-2 text-title-1 text-content-strong lg:text-title-1-lg">{notice.title}</h1>
        {/* 관리자가 넣은 줄바꿈(문단)만 지키고, 그 밖의 줄바꿈은 화면 폭에 맞춰 자연스럽게 흐르게 한다. */}
        <div className="mt-6 space-y-4 border-t border-line pt-6 text-body text-content">
          {notice.body.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">{paragraph}</p>
          ))}
        </div>
      </article>
      <TransitionLink href={NOTICE_LIST_PATH} showPendingIndicator={false} className={`${getButtonClassName({ variant: "tonal" })} mt-10`}>공지 목록</TransitionLink>
    </main>
  );
}
