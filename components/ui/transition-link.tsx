"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
  prefetch,
  scroll,
  rel,
  ...analyticsAttributes
}: {
  href: string;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  showPendingIndicator?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
  rel?: string;
} & Partial<AnalyticsDataAttributes> & {
  "aria-current"?: "page";
  "aria-label"?: string;
}) {
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
    // transition(색·투명도 함께)을 쓴다. transition-opacity였을 때 버튼 helper의 transition-colors와 같은 속성을 다퉈 한쪽 효과가 사라졌다(2026-11-07).
    <Link href={href} prefetch={prefetch} onClick={handleClick} aria-busy={isPending} rel={rel} {...analyticsAttributes} className={`relative transition aria-busy:opacity-70 ${className}`}>
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
