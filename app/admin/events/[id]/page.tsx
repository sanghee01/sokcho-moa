import { notFound } from "next/navigation";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { EventForm } from "@/features/events/admin/components/event-form";
import { StatusControls } from "@/features/events/admin/components/status-controls";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminEvent } from "@/features/events/admin/queries";
import { firstSearchParam } from "@/lib/search-params";

export default async function EditEventPage({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  const idPromise = params.then(({ id }) => id);
  const [admin, row, query] = await Promise.all([
    requireAdmin(),
    idPromise.then(getAdminEvent),
    searchParams,
  ]);
  if (!row) notFound();
  // 후보 JSON 가져오기(import-actions.ts)만 created=1로 이 페이지에 돌아온다. 행사 저장은 /admin으로 간다.
  const feedbackMessage = firstSearchParam(query.created) === "1" ? "검수 대기 행사로 등록했습니다." : undefined;
  return (
    <AdminShell email={admin.email}>
      <ActionFeedback message={feedbackMessage} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-title-2 font-bold">행사 수정</h1><StatusControls id={row.id} current={row.review_status} /></div>
      <EventForm row={row} />
    </AdminShell>
  );
}
