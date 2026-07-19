import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlaceForm } from "@/components/admin/place-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPlace } from "@/lib/admin/queries";

export default async function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const row = await getAdminPlace(id);
  if (!row) notFound();
  return <AdminShell email={admin.email}><h1 className="mb-5 text-2xl font-black">명소 수정</h1><PlaceForm row={row as Record<string, unknown>} /></AdminShell>;
}
