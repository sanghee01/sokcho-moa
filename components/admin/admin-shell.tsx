import Link from "next/link";
import type { ReactNode } from "react";
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
          <Link href="/admin" className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">대시보드</Link>
          <Link href="/admin/events/new" className="rounded-xl bg-teal-600 px-3 py-2 hover:bg-teal-500">행사 등록</Link>
          <Link href="/admin/places/new" className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">명소 등록</Link>
          <Link href="/admin/import" className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">후보 JSON</Link>
          <form action={signOutAction}><button className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10">로그아웃</button></form>
        </nav>
      </header>
      {children}
    </main>
  );
}
