"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 600;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY >= SHOW_AFTER_PX);
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
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-teal-800 text-white shadow-lg ring-1 ring-white/60 transition-[opacity,transform,background-color] duration-200 hover:bg-teal-900 focus-visible:ring-4 focus-visible:ring-teal-300 sm:right-6 sm:bottom-6 sm:px-4 ${isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <span aria-hidden="true" className="w-12 text-center text-xl font-black leading-none sm:w-auto">↑</span>
      <span className="hidden text-sm font-black sm:inline">맨 위로</span>
    </button>
  );
}
