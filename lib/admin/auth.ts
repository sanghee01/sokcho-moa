import "server-only";
import { redirect } from "next/navigation";
import { getPublicEnv } from "@/lib/config/env";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

export type AdminIdentity = { id: string; email: string };

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  if (getPublicEnv().NEXT_PUBLIC_DATA_MODE !== "supabase") return null;
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return null;
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user?.email) return null;
  const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
  if (adminError || isAdmin !== true) return null;
  return { id: userData.user.id, email: userData.user.email };
}

export async function requireAdmin() {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/login");
  return admin;
}
