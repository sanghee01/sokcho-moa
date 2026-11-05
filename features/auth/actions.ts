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
  redirect("/admin");
}

export async function signOutAction() {
  const client = await createSessionSupabaseClient();
  if (client) await client.auth.signOut();
  redirect("/admin/login");
}
