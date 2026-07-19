import { notFound } from "next/navigation";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlaceForm } from "@/components/admin/place-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPlace } from "@/lib/admin/queries";

export default async function EditPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const idPromise = params.then(({ id }) => id);
  const [admin, row, { saved }] = await Promise.all([
    requireAdmin(),
    idPromise.then(getAdminPlace),
    searchParams,
  ]);
  if (!row) notFound();
  return <AdminShell email={admin.email}><ActionFeedback message={saved === "1" ? "명소 정보를 저장했습니다." : undefined} /><h1 className="mb-5 text-2xl font-black">명소 수정</h1><PlaceForm row={row as Record<string, unknown>} /></AdminShell>;
}
