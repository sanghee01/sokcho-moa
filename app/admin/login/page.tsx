import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getAdminIdentity } from "@/lib/admin/auth";
import { getPublicEnv } from "@/lib/config/env";

export default async function AdminLoginPage() {
  if (await getAdminIdentity()) redirect("/admin");
  const demo = getPublicEnv().NEXT_PUBLIC_DATA_MODE === "demo";
  return (
    <main id="main-content" className="mx-auto max-w-md px-4 py-20">
      <p className="text-sm font-bold text-teal-700">속초모아 운영자</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">이메일로 로그인</h1>
      {demo && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">현재 데모 모드입니다. `.env.local`에 Supabase 공개 환경 변수를 설정해야 로그인할 수 있습니다.</p>}
      <AdminLoginForm disabled={demo} />
    </main>
  );
}
