import { redirect } from "next/navigation";
import { signInAction } from "@/lib/actions/admin";
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
      <form action={signInAction} className="mt-8 space-y-5 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        <label className="block text-sm font-bold text-slate-700">이메일<input required type="email" name="email" autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
        <label className="block text-sm font-bold text-slate-700">비밀번호<input required minLength={8} type="password" name="password" autoComplete="current-password" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
        <button disabled={demo} className="w-full rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">로그인</button>
      </form>
    </main>
  );
}
