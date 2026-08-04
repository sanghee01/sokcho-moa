"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/actions/admin/form-data";
import type { AdminActionState } from "@/lib/actions/admin/types";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

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

  const client = await createAuthenticatedSupabaseClient();
  if (!client) return { error: "운영자 로그인이 아직 설정되지 않았습니다." };

  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  redirect("/admin");
}

export async function signOutAction() {
  const client = await createAuthenticatedSupabaseClient();
  if (client) await client.auth.signOut();
  redirect("/admin/login");
}
