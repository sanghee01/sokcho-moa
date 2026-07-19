import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { TransitionLink } from "@/components/transition-link";
import { signOutAction } from "@/lib/actions/admin";

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-300">속초모아 운영자</p>
          <p className="mt-1 text-sm text-slate-300">{email}</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm font-bold" aria-label="관리자 메뉴">
          <TransitionLink href="/admin" className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">대시보드</TransitionLink>
          <TransitionLink href="/admin/events/new" className="rounded-xl bg-teal-600 px-3 py-2 hover:bg-teal-500">행사 등록</TransitionLink>
          <TransitionLink href="/admin/places/new" className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">명소 등록</TransitionLink>
          <TransitionLink href="/admin/import" className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">후보 JSON</TransitionLink>
          <form action={signOutAction}>
            <FormSubmitButton idleLabel="로그아웃" pendingLabel="로그아웃 중…" className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10" />
          </form>
        </nav>
      </header>
      {children}
    </main>
  );
}
