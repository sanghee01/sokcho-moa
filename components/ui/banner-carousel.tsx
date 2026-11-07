"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { iconProps } from "@/components/ui/icon";

const AUTO_ADVANCE_MS = 5_000;

/** 배너를 index번째 장으로 옮긴다. 끝을 넘으면 처음으로 돌아간다. */
function scrollToSlide(scroller: HTMLDivElement | null, index: number, count: number) {
  if (!scroller || count === 0) return;
  const next = (index + count) % count;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller.scrollTo({ left: next * scroller.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
}

/**
 * 배너(.ai/DESIGN.md Components > BannerCarousel). 무신사·올리브영처럼 5초마다 다음 장으로 넘어간다.
 * - 마우스를 올리거나, 키보드 초점이 들어오거나, 손가락으로 만지면 잠시 멈춘다.
 * - 멈춤 버튼으로 계속 멈출 수 있다(WCAG 2.2.2: 5초 넘게 움직이는 내용은 멈출 수 있어야 함).
 * - 움직임 줄이기 설정을 켠 사용자에게는 자동으로 넘기지 않는다.
 * 모바일은 밀어서, md 이상은 좌우 버튼으로도 넘긴다. 장(slide)의 내용은 서버 컴포넌트가 만들어 넘긴다.
 */
export function BannerCarousel({ label, slides }: { label: string; slides: ReactNode[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const hasMany = slides.length > 1;

  const slideCount = slides.length;
  function goTo(index: number) {
    scrollToSlide(scrollerRef.current, index, slideCount);
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    setCurrent(Math.round(scroller.scrollLeft / scroller.clientWidth));
  }

  useEffect(() => {
    if (!hasMany || paused || interacting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") scrollToSlide(scrollerRef.current, current + 1, slideCount);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [current, hasMany, paused, interacting, slideCount]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
      onTouchStart={() => setInteracting(true)}
      onTouchEnd={() => setInteracting(false)}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        aria-live={paused ? "polite" : "off"}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${slides.length}`}
            className="w-full shrink-0 snap-start"
          >
            {slide}
          </div>
        ))}
      </div>

      {Boolean(hasMany) && (
        <>
          {/* 좌우 버튼은 md 이상에서만 보인다. 누르는 영역 44px(.ai/DESIGN.md BannerCarousel, 2026-11-07). */}
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="이전 배너"
            className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-content-strong shadow-floating hover:bg-surface md:inline-flex"
          >
            <ChevronLeft {...iconProps} />
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="다음 배너"
            className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-content-strong shadow-floating hover:bg-surface md:inline-flex"
          >
            <ChevronRight {...iconProps} />
          </button>
          {/* 점과 멈춤 버튼은 보이는 모양은 작게 두고 누르는 영역을 44px로, 사이를 8px로 둔다. 예전에는 24px이 서로 붙어 있었다(2026-11-07).
              이 줄이 장의 아래 44px을 차지하므로 장 내용은 banner-styles.ts의 bannerSlideBottomSpaceClassName만큼 아래를 비운다. */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`${index + 1}번째 배너 보기`}
                aria-current={index === current ? "true" : undefined}
                className="inline-flex size-11 items-center justify-center"
              >
                <span className={`block h-1.5 rounded-full transition-all ${index === current ? "w-4 bg-on-image" : "w-1.5 bg-on-image/50"}`} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? "배너 자동 넘김 다시 켜기" : "배너 자동 넘김 멈추기"}
              className="inline-flex size-11 items-center justify-center text-on-image"
            >
              {paused ? <Play {...iconProps} size={14} /> : <Pause {...iconProps} size={14} />}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
