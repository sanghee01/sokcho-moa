import { AdminShell } from "@/app/admin/_components/admin-shell";
import { NoticeForm } from "@/features/notices/admin/components/notice-form";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewNoticePage() {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}><h1 className="mb-5 text-title-2">새 공지 쓰기</h1><NoticeForm row={null} /></AdminShell>;
}
