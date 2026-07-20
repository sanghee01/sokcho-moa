import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventReviewRow } from "@/components/admin/event-review-row";
import { TransitionLink } from "@/components/transition-link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminEvents, getAdminPlaces } from "@/lib/admin/queries";
import { getPublicEnv } from "@/lib/config/env";

const statusLabels: Record<string, string> = { pending: "검수 대기", published: "공개", rejected: "반려" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; deleted?: string }>;
}) {
  const env = getPublicEnv();
  if (env.NEXT_PUBLIC_DATA_MODE === "demo") return <AdminSetup />;
  const [admin, { status, deleted }, allEvents, places] = await Promise.all([
    requireAdmin(),
    searchParams,
    getAdminEvents(),
    getAdminPlaces(),
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

      <section className="mt-10" aria-labelledby="admin-places-title">
        <div className="mb-4 flex items-center justify-between"><h2 id="admin-places-title" className="text-2xl font-black text-slate-950">주변 명소 {places.length}곳</h2><TransitionLink href="/admin/places/new" className="text-sm font-bold text-teal-700 underline">명소 등록</TransitionLink></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{places.map((row) => <TransitionLink key={String(row.id)} href={`/admin/places/${row.id}`} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-teal-400"><p className="text-xs font-bold text-teal-700">{String(row.category)}</p><p className="mt-1 font-black">{String(row.name)}</p><p className="mt-2 text-xs text-slate-500">{row.is_published ? "공개" : "비공개"}</p></TransitionLink>)}</div>
      </section>
    </AdminShell>
  );
}

function AdminSetup() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-bold text-teal-700">운영자 설정 필요</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">데모 모드에서는 관리자 쓰기를 잠갔습니다.</h1>
      <p className="mt-4 leading-7 text-slate-600">실제 프로젝트의 RLS를 우회하는 가짜 관리자 기능은 제공하지 않습니다. 아래 설정을 마치면 같은 화면에서 실제 Auth 세션으로 CRUD가 동작합니다.</p>
      <ol className="mt-8 space-y-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        <li><strong>1.</strong> Supabase에 migration과 seed를 적용합니다.</li>
        <li><strong>2.</strong> Auth에서 운영자 이메일 사용자를 만들고 해당 UUID와 이메일을 <code className="rounded bg-slate-100 px-1.5 py-1">admin_users</code>에 삽입합니다.</li>
        <li><strong>3.</strong> `.env.local`에 공개 URL·publishable key를 넣고 <code className="rounded bg-slate-100 px-1.5 py-1">NEXT_PUBLIC_DATA_MODE=supabase</code>로 바꿉니다.</li>
      </ol>
      <TransitionLink href="/admin/login" className="mt-8 inline-block rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">로그인 화면 확인</TransitionLink>
    </main>
  );
}
