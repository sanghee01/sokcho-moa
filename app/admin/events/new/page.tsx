import { AdminShell } from "@/app/admin/_components/admin-shell";
import { EventForm } from "@/features/events/admin/components/event-form";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewEventPage() {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}><h1 className="mb-5 text-title-2">새 행사 등록</h1><EventForm row={null} /></AdminShell>;
}
