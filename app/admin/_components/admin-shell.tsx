import type { ReactNode } from "react";
import { InternalTrafficMarker } from "@/components/analytics/internal-traffic-marker";
import { getButtonClassName } from "@/components/ui/button-styles";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { TransitionLink } from "@/components/ui/transition-link";
import { signOutAction } from "@/features/auth/actions";

// 관리자 메뉴 버튼도 공통 helper를 쓴다. 행사 등록이 이 화면의 primary이고 나머지는 회색 보조 버튼이다(.ai/DESIGN.md Button, 2026-11-07).
const menuLinkClassName = getButtonClassName({ variant: "neutral" });
// 메뉴 링크는 모서리 스피너를 끈다(showPendingIndicator). 44px 버튼에서는 글자 옆에 붙어 "["처럼 보였다. 누른 버튼이 흐려지고
// 관리자 loading.tsx가 곧 뜨므로 이동 중임은 그대로 알 수 있다(2026-11-07 사용자 결정).

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* 이 기기의 GA 이벤트를 운영자 방문으로 표시해 GA 내부 트래픽 필터로 뺀다(2026-11-07). */}
      <InternalTrafficMarker />
      <header className="mb-8 flex flex-col gap-4 rounded-card bg-surface-subtle p-5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-label font-bold text-primary-text">속초모아 운영자</p>
          <p className="mt-1 text-label font-normal text-content-subtle">{email}</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="관리자 메뉴">
          <TransitionLink href="/admin" prefetch={false} showPendingIndicator={false} className={menuLinkClassName}>대시보드</TransitionLink>
          <TransitionLink href="/admin/events/new" prefetch={false} showPendingIndicator={false} className={getButtonClassName({ variant: "primary" })}>행사 등록</TransitionLink>
          <TransitionLink href="/admin/places/new" prefetch={false} showPendingIndicator={false} className={menuLinkClassName}>명소 등록</TransitionLink>
          <TransitionLink href="/admin/import" prefetch={false} showPendingIndicator={false} className={menuLinkClassName}>후보 JSON</TransitionLink>
          <form action={signOutAction}>
            <FormSubmitButton idleLabel="로그아웃" pendingLabel="로그아웃 중…" className={getButtonClassName({ variant: "secondary" })} />
          </form>
        </nav>
      </header>
      {children}
    </main>
  );
}
