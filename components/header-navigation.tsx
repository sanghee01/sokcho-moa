"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/transition-link";
import { eventTopics } from "@/lib/domain/event-topic";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const navigationLinkClass = "inline-flex min-h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-lg px-1.5 py-2 text-center font-black sm:min-h-11 sm:rounded-full sm:border sm:px-3";
const primaryNavigation = [
  { href: "/", label: "전체" },
  ...eventTopics.map((topic) => ({ href: topic.path, label: topic.label })),
];

export function HeaderNavigationLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="grid w-full grid-cols-4 gap-1 rounded-xl border border-teal-800/20 bg-teal-50/50 p-1 text-xs sm:flex sm:w-auto sm:items-center sm:gap-1.5 sm:border-0 sm:bg-transparent sm:p-0 sm:text-sm">
      {primaryNavigation.map((item) => {
        const active = pathname === item.href;

        return (
          <TransitionLink
            key={item.href}
            href={item.href}
            pendingLabel={`${item.label} 불러오는 중`}
            showPendingIndicator={false}
            aria-current={active ? "page" : undefined}
            className={`${navigationLinkClass} ${active ? "bg-teal-800 text-white shadow-sm sm:border-teal-800" : "text-teal-900 hover:bg-teal-100 active:bg-teal-200 sm:border-transparent sm:hover:border-teal-800/25 sm:hover:bg-teal-50"}`}
          >
            {item.label}
          </TransitionLink>
        );
      })}
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
