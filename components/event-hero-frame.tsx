import Image from "next/image";
import type { ReactNode } from "react";
import desktopBannerImage from "@/public/sokchomoa-banner-desktop-bg.webp";
import mobileBannerImage from "@/public/sokchomoa-banner-bg.webp";

export function EventHeroFrame({
  children,
  overlayAriaHidden = false,
  priority = false,
}: {
  children: ReactNode;
  overlayAriaHidden?: boolean;
  priority?: boolean;
}) {
  return (
    <div
      data-event-hero-frame
      className="relative h-[10.8rem] overflow-hidden bg-cyan-100 sm:h-[min(33.77vw,24rem)] lg:mx-auto lg:aspect-[5/1] lg:h-auto lg:max-w-[120rem]"
    >
      <picture className="absolute inset-x-0 bottom-0 top-0 lg:-top-2">
        <source media="(min-width: 1024px)" srcSet={desktopBannerImage.src} type="image/webp" />
        <Image
          src={mobileBannerImage}
          alt=""
          fill
          priority={priority}
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-center"
        />
      </picture>
      <div
        aria-hidden={overlayAriaHidden || undefined}
        className="absolute inset-0 flex items-center justify-center px-2 sm:px-4"
      >
        {children}
      </div>
    </div>
  );
}
