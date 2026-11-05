import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/auth/components/login-form";
import { getAdminIdentity } from "@/lib/auth/admin";

export default async function AdminLoginPage() {
  if (await getAdminIdentity()) redirect("/admin");
  return (
    <main id="main-content" className="mx-auto max-w-md px-4 py-20">
      <p className="text-sm font-bold text-teal-700">속초모아 운영자</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">이메일로 로그인</h1>
      <AdminLoginForm />
    </main>
  );
}
