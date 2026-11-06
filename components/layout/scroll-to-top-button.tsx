"use client";

import { ArrowUp } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 600;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY >= SHOW_AFTER_PX);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="페이지 맨 위로 이동"
      aria-hidden={!isVisible}
      data-testid="scroll-to-top"
      tabIndex={isVisible ? 0 : -1}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface text-content-strong shadow-floating ring-1 ring-line transition-[opacity,transform,background-color] duration-200 hover:bg-surface-subtle sm:right-6 sm:bottom-6 sm:px-4 ${isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <span className="inline-flex w-12 justify-center sm:w-auto"><ArrowUp {...iconProps} /></span>
      <span className="hidden text-label sm:inline">맨 위로</span>
    </button>
  );
}
