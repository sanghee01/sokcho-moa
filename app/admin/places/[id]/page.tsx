import { notFound } from "next/navigation";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { PlaceForm } from "@/features/places/admin/components/place-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminPlace } from "@/features/places/admin/queries";
import { firstSearchParam } from "@/lib/search-params";

export default async function EditPlacePage({ params, searchParams }: PageProps<"/admin/places/[id]">) {
  const idPromise = params.then(({ id }) => id);
  const [admin, row, query] = await Promise.all([
    requireAdmin(),
    idPromise.then(getAdminPlace),
    searchParams,
  ]);
  if (!row) notFound();
  const saved = firstSearchParam(query.saved);
  return <AdminShell email={admin.email}><ActionFeedback message={saved === "1" ? "명소 정보를 저장했습니다." : undefined} /><h1 className="mb-5 text-2xl font-black">명소 수정</h1><PlaceForm row={row} /></AdminShell>;
}
