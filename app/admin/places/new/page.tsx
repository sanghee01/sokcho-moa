import { AdminShell } from "@/app/admin/_components/admin-shell";
import { PlaceForm } from "@/features/places/admin/components/place-form";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewPlacePage() {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}><h1 className="mb-5 text-title-2">새 명소 등록</h1><PlaceForm row={null} /></AdminShell>;
}
