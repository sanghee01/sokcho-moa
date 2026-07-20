import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventReviewRow } from "@/components/admin/event-review-row";
import { TransitionLink } from "@/components/transition-link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminEventReports, getAdminEvents, getAdminPlaces } from "@/lib/admin/queries";

const statusLabels: Record<string, string> = { pending: "검수 대기", published: "공개", rejected: "반려" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; deleted?: string }>;
}) {
  const [admin, { status, deleted }, allEvents, places, reports] = await Promise.all([
    requireAdmin(),
    searchParams,
    getAdminEvents(),
    getAdminPlaces(),
    getAdminEventReports(),
  ]);
  const events = status && statusLabels[status]
    ? allEvents.filter((row) => row.review_status === status)
    : allEvents;
  const statusCounts = Object.fromEntries(
    Object.keys(statusLabels).map((key) => [
      key,
      allEvents.filter((row) => row.review_status === key).length,
    ]),
  );
  const deletedMessage = deleted === "event"
    ? "행사를 삭제했습니다."
    : deleted === "place"
      ? "명소를 삭제했습니다."
      : undefined;

  return (
    <AdminShell email={admin.email}>
      <ActionFeedback message={deletedMessage} />
      <section className="grid gap-4 sm:grid-cols-3">
        {Object.entries(statusLabels).map(([key, label]) => (
          <TransitionLink key={key} href={`/admin?status=${key}`} className={`rounded-2xl p-5 ring-1 ${status === key ? "bg-teal-800 text-white ring-teal-800" : "bg-white ring-slate-200"}`}>
            <p className="text-sm font-bold opacity-75">{label}</p>
            <p className="mt-2 text-3xl font-black">{statusCounts[key]}</p>
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
      </section>

      <section className="mt-10" aria-labelledby="admin-reports-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="admin-reports-title" className="text-2xl font-black text-slate-950">접수된 제보 {reports.length}건</h2>
        </div>
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={String(report.id)} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-black text-slate-950">{String(report.title)}</h3>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">검토 대기</span>
              </div>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{String(report.body)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {report.source_url && <a href={String(report.source_url)} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline underline-offset-4">제보 링크 <span className="sr-only">(새 창)</span></a>}
                <time className="text-slate-500" dateTime={String(report.created_at)}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(String(report.created_at)))}</time>
              </div>
            </article>
          ))}
          {reports.length === 0 && <p className="rounded-2xl bg-white px-5 py-10 text-center text-slate-500 ring-1 ring-slate-200">접수된 제보가 없습니다.</p>}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="admin-places-title">
        <div className="mb-4 flex items-center justify-between"><h2 id="admin-places-title" className="text-2xl font-black text-slate-950">주변 명소 {places.length}곳</h2><TransitionLink href="/admin/places/new" className="text-sm font-bold text-teal-700 underline">명소 등록</TransitionLink></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{places.map((row) => <TransitionLink key={String(row.id)} href={`/admin/places/${row.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-teal-400"><p className="text-xs font-bold text-teal-700">{String(row.category)}</p><p className="mt-1 font-black">{String(row.name)}</p><p className="mt-2 text-xs text-slate-500">{row.is_published ? "공개" : "비공개"}</p></TransitionLink>)}</div>
      </section>
    </AdminShell>
  );
}
