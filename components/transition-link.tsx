"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { AnalyticsDataAttributes } from "@/lib/analytics/events";

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function TransitionLink({
  href,
  children,
  className = "",
  pendingLabel = "페이지 이동 중",
  showPendingIndicator = true,
  scroll,
  ...analyticsAttributes
}: {
  href: string;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  showPendingIndicator?: boolean;
  scroll?: boolean;
} & Partial<AnalyticsDataAttributes> & { "aria-current"?: "page" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (shouldUseNativeNavigation(event)) return;
    event.preventDefault();
    if (isPending) return;

    startTransition(() => {
      router.push(href, { scroll });
    });
  }

  return (
    <Link href={href} onClick={handleClick} aria-busy={isPending} {...analyticsAttributes} className={`relative transition-opacity aria-busy:opacity-70 ${className}`}>
      {children}
      {isPending && (
        <>
          {showPendingIndicator && (
            <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-current/10 p-1">
              <LoadingSpinner className="size-3" />
            </span>
          )}
          <span className="sr-only">{pendingLabel}</span>
        </>
      )}
    </Link>
  );
}
