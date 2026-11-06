import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export interface AdminIdentity { id: string; email: string }

/**
 * 로그인 사용자가 관리자 허용 목록(admin_users)에 있는지 확인한다.
 * 한 요청 안에서 layout·page·action이 여러 번 불러도 Auth 서버 호출은 한 번만 하도록 cache로 감싼다.
 */
export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  const client = await createSessionSupabaseClient();
  const [{ data: userData, error: userError }, { data: isAdmin, error: adminError }] = await Promise.all([
    client.auth.getUser(),
    client.rpc("is_admin"),
  ]);
  if (userError || !userData.user?.email) return null;
  if (adminError || isAdmin !== true) return null;
  return { id: userData.user.id, email: userData.user.email };
});

/** 관리자 화면과 관리자 action의 첫 줄에서 호출한다. 페이지 보호가 action까지 지켜 주지 않기 때문이다. */
export async function requireAdmin() {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/login");
  return admin;
}
