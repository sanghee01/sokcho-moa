import { notFound } from "next/navigation";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { getAdminResultMessage } from "@/components/admin/admin-result";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { NoticeForm } from "@/features/notices/admin/components/notice-form";
import { getAdminNotice } from "@/features/notices/admin/queries";
import { requireAdmin } from "@/lib/auth/admin";
import { firstSearchParam } from "@/lib/search-params";

export default async function EditNoticePage({ params, searchParams }: PageProps<"/admin/notices/[id]">) {
  const idPromise = params.then(({ id }) => id);
  const [admin, row, query] = await Promise.all([
    requireAdmin(),
    idPromise.then(getAdminNotice),
    searchParams,
  ]);
  if (!row) notFound();
  return <AdminShell email={admin.email}><ActionFeedback message={getAdminResultMessage(firstSearchParam(query.result))} /><h1 className="mb-5 text-title-2">공지 수정</h1><NoticeForm row={row} /></AdminShell>;
}
