"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/form-data";
import type { AdminActionState } from "@/lib/action-state";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signInAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) return { error: "이메일과 8자 이상의 비밀번호를 확인해 주세요." };

  const client = await createSessionSupabaseClient();

  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };

  // Supabase 계정은 맞아도 관리자 허용 목록(admin_users)에 없으면 /admin이 다시 로그인 화면으로 보낸다.
  // 그러면 사용자는 이유를 모른 채 로그인 상태로 남으므로, 여기서 확인하고 세션을 끊은 뒤 이유를 알려 준다.
  const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
  if (adminError || isAdmin !== true) {
    if (adminError) console.error("Admin check after sign-in failed", adminError.message);
    await client.auth.signOut();
    return {
      error: adminError
        ? "관리자 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
        : "관리자 권한이 없는 계정입니다.",
    };
  }
  redirect("/admin");
}

export async function signOutAction() {
  const client = await createSessionSupabaseClient();
  await client.auth.signOut();
  redirect("/admin/login");
}
