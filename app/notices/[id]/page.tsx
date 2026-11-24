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
import { SITE_NAME, SITE_OPEN_GRAPH_IMAGES, SITE_OPEN_GRAPH_IMAGE_PATH } from "@/lib/seo/site-identity";
import { withEmptyStaticParam } from "@/lib/static-params";
import { isUuid } from "@/lib/uuid";

// 미리 만든 정적 결과로만 응답해야 하는 페이지다. 누가 요청 값(searchParams·cookies)이나 캐시하지 않은 조회를 더하면 빌드가 멈춘다.
// 루트 layout의 instant = false가 사이트 전체의 미리 만들기 검사를 끄므로, 검색 유입을 받는 정적 페이지는 여기서 따로 지킨다(2026-11-24 리뷰).
export const ensureStatic = "navigation";

async function getNotice(id: string) {
  if (!isUuid(id)) return null;
  return (await getPublicNotices()).find((notice) => notice.id === id) ?? null;
}

export async function generateStaticParams() {
  return withEmptyStaticParam((await getPublicNotices()).map((notice) => ({ id: notice.id })), "id");
}

export async function generateMetadata({ params }: PageProps<"/notices/[id]">): Promise<Metadata> {
  const notice = await getNotice((await params).id);
  if (notice === null) return { title: "공지를 찾을 수 없습니다" };
  const description = summarizeNoticeBody(notice.body, 150);
  return {
    title: notice.title,
    description,
    alternates: { canonical: noticePath(notice.id) },
    // 공유 미리보기 이미지가 비지 않게 사이트 기본 이미지를 넣는다(2026-11-21 SEO 점검).
    openGraph: { type: "article", locale: "ko_KR", url: noticePath(notice.id), siteName: SITE_NAME, title: notice.title, description, images: SITE_OPEN_GRAPH_IMAGES },
    twitter: { card: "summary_large_image", title: notice.title, description, images: [SITE_OPEN_GRAPH_IMAGE_PATH] },
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
        {/* 빈 줄은 문단을 나누고, 한 줄 줄바꿈은 문단 안에서 그대로 줄을 바꾼다(관리자 폼 안내 "줄바꿈은 그대로 보입니다"와 같음). */}
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
