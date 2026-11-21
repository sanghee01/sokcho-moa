import { Badge } from "@/components/ui/badge";
import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { getAdminNotices } from "@/features/notices/admin/queries";
import { formatNoticeDate, isNoticeKind, noticeKindLabels } from "@/features/notices/model/notice";

/** 관리자 대시보드의 "공지" 탭 */
export async function AdminNoticesTab() {
  const notices = await getAdminNotices();
  return (
    <section className="mt-10" aria-labelledby="admin-notices-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 id="admin-notices-title" className="text-title-2 text-content-strong">공지 {notices.length}개</h1>
        <TransitionLink href="/admin/notices/new" showPendingIndicator={false} className={getButtonClassName({ variant: "tonal" })}>공지 쓰기</TransitionLink>
      </div>
      {notices.length === 0 && <p className="rounded-card bg-surface p-6 text-content-muted ring-1 ring-line">아직 쓴 공지가 없습니다.</p>}
      <div className="grid gap-3">
        {notices.map((row) => (
          <TransitionLink key={row.id} href={`/admin/notices/${row.id}`} className="rounded-card bg-surface p-4 ring-1 ring-line hover:ring-primary">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={row.is_published ? "success" : "muted"}>{row.is_published ? "공개" : "비공개"}</Badge>
              <span className="text-caption font-semibold text-primary-text">{isNoticeKind(row.kind) ? noticeKindLabels[row.kind] : row.kind}</span>
              {row.published_at !== null && <span className="text-caption text-content-subtle tabular-nums">{formatNoticeDate(row.published_at)}</span>}
            </div>
            <p className="mt-2 font-semibold text-content-strong">{row.title}</p>
          </TransitionLink>
        ))}
      </div>
    </section>
  );
}
