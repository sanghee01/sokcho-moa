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
  title,
  onNavigate,
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
  title?: string;
  /** 이동을 시작하는 transition 안에서 부른다. 부모가 useOptimistic으로 누른 상태를 먼저 보여 줄 때 쓴다. */
  onNavigate?: () => void;
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
      onNavigate?.();
      router.push(href, { scroll });
    });
  }

  return (
    // transition(색·투명도 함께)을 쓴다. transition-opacity였을 때 버튼 helper의 transition-colors와 같은 속성을 다퉈 한쪽 효과가 사라졌다(2026-11-07).
    <Link href={href} prefetch={prefetch} onClick={handleClick} aria-busy={isPending} rel={rel} title={title} {...analyticsAttributes} className={`relative transition aria-busy:opacity-70 ${className}`}>
      {children}
      {Boolean(isPending) && (
        <>
          {Boolean(showPendingIndicator) && (
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
