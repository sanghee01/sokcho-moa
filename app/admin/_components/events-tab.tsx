import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { toAdminEventListItem } from "@/features/events/admin/mappers";
import { EventReviewRow } from "@/features/events/admin/components/event-review-row";
import { ADMIN_EVENT_PAGE_SIZE, getAdminEvents, getAdminEventStatusCounts } from "@/features/events/admin/queries";
import { eventReviewStatuses, eventReviewStatusLabels, type EventReviewStatus } from "@/features/events/model/review-status";

function adminPageHref(page: number, status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

// 페이지 이동 버튼: 누를 수 있는 곳은 회색 보조 버튼, 지금 페이지는 연한 파랑, 갈 수 없는 이전·다음은 흐리게(높이 44px, 2026-11-07).
const pageLinkClassName = `${getButtonClassName({ variant: "neutral" })} min-w-11`;
const currentPageClassName = `${getButtonClassName({ variant: "tonal" })} min-w-11`;
const unavailablePageClassName = `${pageLinkClassName} pointer-events-none opacity-60`;

function paginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) pages.add(4);
  if (currentPage >= totalPages - 2) pages.add(totalPages - 3);
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

/** 관리자 대시보드의 "행사 관리" 탭: 검수 상태별 개수, 행사 표, 페이지 이동 */
export async function AdminEventsTab({ status, requestedPage }: { status?: EventReviewStatus; requestedPage: number }) {
  const [statusCounts, initialEventPage] = await Promise.all([
    getAdminEventStatusCounts(),
    getAdminEvents({ status, page: requestedPage }),
  ]);
  let eventPage = initialEventPage;
  const totalPages = Math.max(1, Math.ceil(eventPage.totalCount / ADMIN_EVENT_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  // 범위를 넘는 페이지 번호는 마지막 페이지로 보여 준다.
  if (currentPage !== requestedPage) {
    eventPage = await getAdminEvents({ status, page: currentPage });
  }
  const { events } = eventPage;

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {eventReviewStatuses.map((key) => (
          <TransitionLink key={key} href={adminPageHref(1, key)} className={`rounded-card p-5 ring-1 ${status === key ? "bg-primary text-on-primary ring-primary" : "bg-surface ring-line"}`}>
            <p className="text-label font-bold opacity-75">{eventReviewStatusLabels[key]}</p>
            <p className="mt-2 text-title-1">{statusCounts[key]}</p>
          </TransitionLink>
        ))}
      </section>

      <section className="mt-10" aria-labelledby="admin-events-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 id="admin-events-title" className="text-title-2 text-content-strong">행사 관리</h1>
          {/* 위 관리자 메뉴의 "행사 등록"이 이 화면의 primary라, 같은 곳으로 가는 이 버튼은 보조 색으로 둔다(.ai/DESIGN.md Button). */}
          <TransitionLink href="/admin/events/new" className={getButtonClassName({ variant: "tonal" })}>신규 행사</TransitionLink>
        </div>
        <div className="overflow-x-auto rounded-card bg-surface ring-1 ring-line">
          <table className="min-w-full text-left text-label">
            <thead className="bg-surface-subtle text-content-muted"><tr><th className="px-4 py-3">행사</th><th className="px-4 py-3 text-right">조회수</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">출처</th><th className="px-4 py-3">작업</th></tr></thead>
            <tbody>
              {events.map((row) => <EventReviewRow key={row.id} event={toAdminEventListItem(row)} />)}
              {events.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-content-subtle">이 상태의 행사가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        {eventPage.totalCount > 0 && (
          <nav aria-label="행사 목록 페이지 이동" className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-label font-medium text-content-muted">총 {eventPage.totalCount.toLocaleString("ko-KR")}건 · {currentPage} / {totalPages}페이지</p>
            <div className="flex items-center gap-1">
              {currentPage > 1 ? (
                <TransitionLink href={adminPageHref(currentPage - 1, status)} className={pageLinkClassName} aria-label="이전 페이지">이전</TransitionLink>
              ) : (
                <span className={unavailablePageClassName} aria-disabled="true">이전</span>
              )}
              {paginationPages(currentPage, totalPages).map((item, index, pages) => (
                <div key={item} className="contents">
                  {index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-content-subtle" aria-hidden="true">…</span>}
                  {item === currentPage ? (
                    <span className={currentPageClassName} aria-current="page">{item}</span>
                  ) : (
                    <TransitionLink href={adminPageHref(item, status)} className={pageLinkClassName}>{item}</TransitionLink>
                  )}
                </div>
              ))}
              {currentPage < totalPages ? (
                <TransitionLink href={adminPageHref(currentPage + 1, status)} className={pageLinkClassName} aria-label="다음 페이지">다음</TransitionLink>
              ) : (
                <span className={unavailablePageClassName} aria-disabled="true">다음</span>
              )}
            </div>
          </nav>
        )}
      </section>
    </>
  );
}
