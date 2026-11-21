"use server";

import { redirect } from "next/navigation";
import { adminResultHref } from "@/components/admin/admin-result";
import { expirePublicNotices } from "@/features/notices/cache";
import { noticeDeleteSchema, noticeFormSchema } from "@/features/notices/admin/schemas";
import { adminActionFailed, invalidInput, type AdminActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { formString } from "@/lib/form-data";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

const NOTICE_SAVE_FAILED_MESSAGE = "공지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

export async function saveNoticeAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = noticeFormSchema.safeParse({
    id: formString(formData, "id") || undefined,
    kind: formString(formData, "kind"),
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return invalidInput(parsed.error);

  const notice = parsed.data;
  const client = await createSessionSupabaseClient();

  // 공개 시각은 처음 공개할 때 한 번만 찍는다. 글을 고칠 때마다 바뀌면 상단 배너가 다시 뜨고 목록 순서가 뒤집힌다.
  let publishedAt: string | null = null;
  if (notice.id) {
    const existing = await client.from("notices").select("published_at").eq("id", notice.id).maybeSingle();
    if (existing.error) {
      console.error("Notice lookup failed", existing.error.message);
      return adminActionFailed(NOTICE_SAVE_FAILED_MESSAGE);
    }
    // RLS에 막히거나 이미 삭제된 행이면 오류 없이 0행이다.
    if (!existing.data) return adminActionFailed("이미 삭제되었거나 권한이 없는 공지입니다. 목록을 새로고침해 주세요.");
    publishedAt = existing.data.published_at;
  }
  if (notice.isPublished && publishedAt === null) publishedAt = new Date().toISOString();

  const payload = {
    kind: notice.kind,
    title: notice.title,
    body: notice.body,
    is_published: notice.isPublished,
    published_at: publishedAt,
  };
  const result = notice.id
    ? await client.from("notices").update(payload).eq("id", notice.id).select("id").maybeSingle()
    : await client.from("notices").insert(payload).select("id").maybeSingle();
  if (result.error) {
    console.error("Notice save failed", result.error.message);
    return adminActionFailed(NOTICE_SAVE_FAILED_MESSAGE);
  }
  if (!result.data) return adminActionFailed("이미 삭제되었거나 권한이 없는 공지입니다. 목록을 새로고침해 주세요.");

  expirePublicNotices();
  redirect(adminResultHref(`/admin/notices/${result.data.id}`, "notice-saved"));
}

export async function deleteNoticeAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = noticeDeleteSchema.safeParse({
    id: formString(formData, "id"),
    confirmation: formString(formData, "confirmation"),
  });
  if (!parsed.success) return adminActionFailed("삭제 요청을 확인한 뒤 다시 시도해 주세요.");

  const client = await createSessionSupabaseClient();
  const { data: deleted, error } = await client.from("notices").delete().eq("id", parsed.data.id).select("id");
  if (error) {
    console.error("Notice delete failed", error.message);
    return adminActionFailed("공지를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  // RLS에 막히거나 이미 삭제된 행이면 오류 없이 0행이다.
  if (!deleted?.length) return adminActionFailed("이미 삭제되었거나 권한이 없는 공지입니다. 목록을 새로고침해 주세요.");

  expirePublicNotices();
  redirect(adminResultHref("/admin?tab=notices", "notice-deleted"));
}
