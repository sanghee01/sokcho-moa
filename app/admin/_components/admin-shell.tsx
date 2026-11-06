import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { TransitionLink } from "@/components/ui/transition-link";
import { signOutAction } from "@/features/auth/actions";

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-4 rounded-card bg-surface-subtle p-5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-label font-bold text-primary-text">속초모아 운영자</p>
          <p className="mt-1 text-label font-normal text-content-subtle">{email}</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-label font-bold" aria-label="관리자 메뉴">
          <TransitionLink href="/admin" prefetch={false} className="inline-flex min-h-11 items-center rounded-control px-3 text-content hover:bg-surface-muted">대시보드</TransitionLink>
          <TransitionLink href="/admin/events/new" prefetch={false} className="inline-flex min-h-11 items-center rounded-control bg-primary px-3 text-on-primary hover:bg-primary-hover">행사 등록</TransitionLink>
          <TransitionLink href="/admin/places/new" prefetch={false} className="inline-flex min-h-11 items-center rounded-control px-3 text-content hover:bg-surface-muted">명소 등록</TransitionLink>
          <TransitionLink href="/admin/import" prefetch={false} className="inline-flex min-h-11 items-center rounded-control px-3 text-content hover:bg-surface-muted">후보 JSON</TransitionLink>
          <form action={signOutAction}>
            <FormSubmitButton idleLabel="로그아웃" pendingLabel="로그아웃 중…" className="min-h-11 rounded-control border border-line-strong bg-surface px-3 text-content hover:bg-surface-subtle" />
          </form>
        </nav>
      </header>
      {children}
    </main>
  );
}
