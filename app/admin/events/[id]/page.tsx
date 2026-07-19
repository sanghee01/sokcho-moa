import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";
import { StatusControls } from "@/components/admin/status-controls";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminEvent } from "@/lib/admin/queries";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const row = await getAdminEvent(id);
  if (!row) notFound();
  return (
    <AdminShell email={admin.email}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">행사 수정</h1><StatusControls id={String(row.id)} slug={String(row.slug)} current={String(row.review_status)} /></div>
      <EventForm row={row as Record<string, unknown>} />
    </AdminShell>
  );
}
