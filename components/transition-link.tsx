"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent, type ReactNode } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function TransitionLink({
  href,
  children,
  className = "",
  pendingLabel = "페이지 이동 중",
  scroll,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  scroll?: boolean;
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
    <Link href={href} onClick={handleClick} aria-busy={isPending} className={`relative ${className}`}>
      {children}
      {isPending && (
        <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-current/10 p-1">
          <LoadingSpinner className="size-3" />
          <span className="sr-only">{pendingLabel}</span>
        </span>
      )}
    </Link>
  );
}
