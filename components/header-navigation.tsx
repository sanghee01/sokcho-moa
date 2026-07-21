"use client";

import { useEffect, useState } from "react";
import { TransitionLink } from "@/components/transition-link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const navigationLinkClass = "inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap px-2 py-2 text-center font-black sm:rounded-full sm:border sm:px-4";
const publicLinkClass = `${navigationLinkClass} text-teal-800/85 hover:bg-teal-100/60 active:bg-teal-100 sm:border-teal-800/45 sm:bg-transparent sm:hover:bg-teal-50`;

export function HeaderNavigationLinks({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav aria-label="주요 메뉴" className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"} divide-x divide-teal-800/20 overflow-hidden rounded-xl border border-teal-800/25 bg-teal-50/50 text-xs font-semibold sm:flex sm:w-auto sm:items-center sm:gap-3 sm:divide-x-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:text-sm`}>
      <TransitionLink href="/report" pendingLabel="제보 페이지 불러오는 중" showPendingIndicator={false} className={publicLinkClass}>
        행사 제보하기
      </TransitionLink>
      <TransitionLink href="/feedback" pendingLabel="의견 페이지 불러오는 중" showPendingIndicator={false} className={publicLinkClass}>
        의견 보내기
      </TransitionLink>
      {isAdmin && (
        <TransitionLink href="/admin" pendingLabel="운영자 대시보드 불러오는 중" showPendingIndicator={false} className={`${navigationLinkClass} bg-teal-800 text-white hover:bg-teal-900 active:bg-teal-950 sm:border-teal-800`}>
          운영자
        </TransitionLink>
      )}
    </nav>
  );
}

export function HeaderNavigation() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DATA_MODE !== "supabase") return;
    const client = createSupabaseBrowserClient();
    let active = true;

    const refreshAdminStatus = async () => {
      const { data, error } = await client.rpc("is_admin");
      if (active) setIsAdmin(!error && data === true);
    };

    void refreshAdminStatus();
    const { data: authListener } = client.auth.onAuthStateChange(() => {
      setTimeout(() => void refreshAdminStatus(), 0);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return <HeaderNavigationLinks isAdmin={isAdmin} />;
}
