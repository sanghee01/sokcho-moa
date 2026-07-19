import { AdminShell } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewEventPage() {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}><h1 className="mb-5 text-2xl font-black">새 행사 등록</h1><EventForm row={null} /></AdminShell>;
}
