import { notFound } from "next/navigation";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";
import { StatusControls } from "@/components/admin/status-controls";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminEvent } from "@/lib/admin/queries";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; uploaded?: string; created?: string }>;
}) {
  const idPromise = params.then(({ id }) => id);
  const [admin, row, feedback] = await Promise.all([
    requireAdmin(),
    idPromise.then(getAdminEvent),
    searchParams,
  ]);
  if (!row) notFound();
  const feedbackMessage = feedback.created === "1"
    ? "검수 대기 행사로 등록했습니다."
    : feedback.uploaded === "1"
      ? "대표 이미지를 업로드했습니다."
      : feedback.saved === "1"
        ? "행사 정보를 저장했습니다."
        : undefined;
  return (
    <AdminShell email={admin.email}>
      <ActionFeedback message={feedbackMessage} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">행사 수정</h1><StatusControls id={String(row.id)} slug={String(row.slug)} current={String(row.review_status)} /></div>
      <EventForm row={row as Record<string, unknown>} />
    </AdminShell>
  );
}
