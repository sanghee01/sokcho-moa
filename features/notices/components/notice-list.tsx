import { ChevronRight } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { formatNoticeDate, noticeKindLabels, noticePath, type Notice } from "@/features/notices/model/notice";

/**
 * 공지 목록(.ai/DESIGN.md 공지). 제목·종류·날짜만 훑고, 누르면 글 페이지로 간다.
 * 목록 안에서 펼치는 방식(아코디언)은 긴 글을 펼치면 아래 목록이 끝없이 밀리고 글마다 주소가 없어 공유·검색이 안 돼 쓰지 않는다(2026-11-21).
 */
export function NoticeList({ notices }: { notices: readonly Notice[] }) {
  if (notices.length === 0) {
    return <p className="mt-8 text-body text-content-muted">아직 올라온 공지가 없어요.</p>;
  }
  return (
    <ul className="mt-6 border-t border-line">
      {notices.map((notice) => (
        <li key={notice.id} className="border-b border-line">
          <TransitionLink href={noticePath(notice.id)} showPendingIndicator={false} className="flex min-h-11 items-center gap-3 py-5 hover:bg-surface-subtle">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-caption">
                <span className="font-semibold text-primary-text">{noticeKindLabels[notice.kind]}</span>
                <time dateTime={notice.publishedAt} className="text-content-subtle tabular-nums">{formatNoticeDate(notice.publishedAt)}</time>
              </span>
              <span className="mt-1 block text-title-3 text-content-strong">{notice.title}</span>
            </span>
            <ChevronRight {...iconProps} className="shrink-0 text-content-subtle" aria-hidden="true" />
          </TransitionLink>
        </li>
      ))}
    </ul>
  );
}
