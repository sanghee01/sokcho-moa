import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventCollectionExclusionList } from "@/components/admin/event-collection-exclusion-list";
import { SubmissionReviewCard } from "@/components/admin/submission-review-card";
import { EventReviewRow } from "@/components/admin/event-review-row";
import { TransitionLink } from "@/components/transition-link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardFeedback } from "@/lib/admin/dashboard-feedback";
import {
  getAdminEventCollectionExclusions,
  getAdminEventReports,
  getAdminEvents,
  getAdminEventStatusCounts,
  getAdminPlaces,
  getAdminSiteFeedback,
  ADMIN_EVENT_PAGE_SIZE,
} from "@/lib/admin/queries";

const statusLabels: Record<string, string> = { pending: "검수 대기", published: "공개", rejected: "반려" };
const adminTabs = [
  { id: "events", label: "행사 관리" },
  { id: "exclusions", label: "재수집 제외" },
  { id: "reports", label: "접수된 제보" },
  { id: "feedback", label: "접수된 의견" },
  { id: "places", label: "주변 명소" },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function isAdminTab(value?: string): value is AdminTab {
  return adminTabs.some((tab) => tab.id === value);
}

function adminTabHref(tab: AdminTab) {
  return tab === "events" ? "/admin" : `/admin?tab=${tab}`;
}

function adminPageHref(page: number, status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

function paginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) pages.add(4);
  if (currentPage >= totalPages - 2) pages.add(totalPages - 3);
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string; deleted?: string; released?: string; saved?: string }>;
}) {
  const [admin, { tab, status, page, deleted, released, saved }] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const selectedTab = isAdminTab(tab) ? tab : "events";
  const selectedStatus = status && statusLabels[status] ? status : undefined;
  const requestedPage = parsePage(page);
  const [statusCounts, initialEventPage, places, reports, feedback, exclusions] = await Promise.all([
    selectedTab === "events" ? getAdminEventStatusCounts() : null,
    selectedTab === "events" ? getAdminEvents({ status: selectedStatus, page: requestedPage }) : null,
    selectedTab === "places" ? getAdminPlaces() : null,
    selectedTab === "reports" ? getAdminEventReports() : null,
    selectedTab === "feedback" ? getAdminSiteFeedback() : null,
    selectedTab === "exclusions" ? getAdminEventCollectionExclusions() : null,
  ]);
  let eventPage = initialEventPage;
  const totalPages = Math.max(1, Math.ceil((eventPage?.totalCount ?? 0) / ADMIN_EVENT_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  if (eventPage && currentPage !== requestedPage) {
    eventPage = await getAdminEvents({ status: selectedStatus, page: currentPage });
  }
  const events = eventPage?.events ?? [];
  const feedbackMessage = getAdminDashboardFeedback({ saved, deleted, released });

  return (
    <AdminShell email={admin.email}>
      <ActionFeedback message={feedbackMessage} />
      <nav aria-label="관리 항목" className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 ring-1 ring-slate-200">
        {adminTabs.map((item) => (
          <TransitionLink
            key={item.id}
            href={adminTabHref(item.id)}
            showPendingIndicator={false}
            aria-current={selectedTab === item.id ? "page" : undefined}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${selectedTab === item.id ? "bg-teal-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {item.label}
          </TransitionLink>
        ))}
      </nav>

      {selectedTab === "events" && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            {Object.entries(statusLabels).map(([key, label]) => (
              <TransitionLink key={key} href={adminPageHref(1, key)} className={`rounded-2xl p-5 ring-1 ${status === key ? "bg-teal-800 text-white ring-teal-800" : "bg-white ring-slate-200"}`}>
                <p className="text-sm font-bold opacity-75">{label}</p>
                <p className="mt-2 text-3xl font-black">{statusCounts?.[key as keyof typeof statusCounts] ?? 0}</p>
              </TransitionLink>
            ))}
          </section>

          <section className="mt-10" aria-labelledby="admin-events-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h1 id="admin-events-title" className="text-2xl font-black text-slate-950">행사 관리</h1>
              <TransitionLink href="/admin/events/new" className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white">신규 행사</TransitionLink>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">행사</th><th className="px-4 py-3 text-right">조회수</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">출처</th><th className="px-4 py-3">작업</th></tr></thead>
                <tbody>
                  {events.map((row) => (
                    <EventReviewRow
                      key={String(row.id)}
                      event={{
                        id: String(row.id),
                        slug: String(row.slug),
                        title: String(row.title),
                        sourceName: String(row.source_name),
                        viewCount: Number(row.view_count ?? 0),
                        reviewStatus: String(row.review_status) as "pending" | "published" | "rejected",
                      }}
                    />
                  ))}
                  {events.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">이 상태의 행사가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
            {eventPage && eventPage.totalCount > 0 && (
              <nav aria-label="행사 목록 페이지 이동" className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">총 {eventPage.totalCount.toLocaleString("ko-KR")}건 · {currentPage} / {totalPages}페이지</p>
                <div className="flex items-center gap-1">
                  {currentPage > 1 ? (
                    <TransitionLink href={adminPageHref(currentPage - 1, selectedStatus)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100" aria-label="이전 페이지">이전</TransitionLink>
                  ) : (
                    <span className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300" aria-disabled="true">이전</span>
                  )}
                  {paginationPages(currentPage, totalPages).map((item, index, pages) => (
                    <div key={item} className="contents">
                      {index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
                      {item === currentPage ? (
                        <span className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-black text-white" aria-current="page">{item}</span>
                      ) : (
                        <TransitionLink href={adminPageHref(item, selectedStatus)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">{item}</TransitionLink>
                      )}
                    </div>
                  ))}
                  {currentPage < totalPages ? (
                    <TransitionLink href={adminPageHref(currentPage + 1, selectedStatus)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100" aria-label="다음 페이지">다음</TransitionLink>
                  ) : (
                    <span className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300" aria-disabled="true">다음</span>
                  )}
                </div>
              </nav>
            )}
          </section>
        </>
      )}

      {selectedTab === "exclusions" && <EventCollectionExclusionList exclusions={exclusions ?? []} />}

      {selectedTab === "reports" && <section className="mt-10" aria-labelledby="admin-reports-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 id="admin-reports-title" className="text-2xl font-black text-slate-950">접수된 제보 {(reports ?? []).length}건</h1>
        </div>
        <div className="space-y-3">
          {(reports ?? []).map((report) => (
            <SubmissionReviewCard
              key={String(report.id)}
              kind="event_report"
              submission={{
                id: String(report.id),
                title: String(report.title),
                body: String(report.body),
                linkUrl: report.source_url ? String(report.source_url) : null,
                imageUrl: null,
                reviewStatus: String(report.review_status) as "pending" | "reviewed" | "rejected",
                createdAt: String(report.created_at),
              }}
            />
          ))}
          {(reports ?? []).length === 0 && <p className="rounded-2xl bg-white px-5 py-10 text-center text-slate-500 ring-1 ring-slate-200">접수된 제보가 없습니다.</p>}
        </div>
      </section>}

      {selectedTab === "feedback" && <section className="mt-10" aria-labelledby="admin-feedback-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 id="admin-feedback-title" className="text-2xl font-black text-slate-950">접수된 의견 {(feedback ?? []).length}건</h1>
        </div>
        <div className="space-y-3">
          {(feedback ?? []).map((item) => (
            <SubmissionReviewCard
              key={String(item.id)}
              kind="site_feedback"
              submission={{
                id: String(item.id),
                title: String(item.title),
                body: String(item.body),
                linkUrl: item.link_url ? String(item.link_url) : null,
                imageUrl: item.image_url ? String(item.image_url) : null,
                reviewStatus: String(item.review_status) as "pending" | "reviewed" | "rejected",
                createdAt: String(item.created_at),
              }}
            />
          ))}
          {(feedback ?? []).length === 0 && <p className="rounded-2xl bg-white px-5 py-10 text-center text-slate-500 ring-1 ring-slate-200">접수된 의견이 없습니다.</p>}
        </div>
      </section>}

      {selectedTab === "places" && <section className="mt-10" aria-labelledby="admin-places-title">
        <div className="mb-4 flex items-center justify-between"><h1 id="admin-places-title" className="text-2xl font-black text-slate-950">주변 명소 {(places ?? []).length}곳</h1><TransitionLink href="/admin/places/new" className="text-sm font-bold text-teal-700 underline">명소 등록</TransitionLink></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(places ?? []).map((row) => <TransitionLink key={String(row.id)} href={`/admin/places/${row.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-teal-400"><p className="text-xs font-bold text-teal-700">{String(row.category)}</p><p className="mt-1 font-black">{String(row.name)}</p><p className="mt-2 text-xs text-slate-500">{row.is_published ? "공개" : "비공개"}</p></TransitionLink>)}</div>
      </section>}
    </AdminShell>
  );
}
