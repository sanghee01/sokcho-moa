import { AdminShell } from "@/components/admin/admin-shell";
import { PlaceForm } from "@/components/admin/place-form";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewPlacePage() {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}><h1 className="mb-5 text-2xl font-black">새 명소 등록</h1><PlaceForm row={null} /></AdminShell>;
}
