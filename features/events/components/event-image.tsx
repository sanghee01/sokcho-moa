"use client";

import Image from "next/image";
import { Waves } from "lucide-react";
import { useState, type ReactNode } from "react";
import { iconProps } from "@/components/ui/icon";

export function EventImage({
  src,
  alt,
  priority = false,
  muted = false,
  fit = "cover",
  position = "center",
  sizes = "(max-width: 768px) 100vw, 50vw",
  fallback,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  muted?: boolean;
  fit?: "cover" | "contain";
  /** 세로 포스터는 제목이 보통 위쪽에 있어 카드에서는 위쪽을 기준으로 자른다. */
  position?: "center" | "top";
  sizes?: string;
  /** 이미지가 없거나 불러오지 못했을 때 보여 줄 내용. 없으면 물결 아이콘을 둔다. */
  fallback?: ReactNode;
}) {
  const imageSrc = src?.trim() || null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (imageSrc && failedSrc !== imageSrc) {
    return <Image src={imageSrc} alt={alt} fill unoptimized priority={priority} onError={() => setFailedSrc(imageSrc)} className={`${fit === "contain" ? "object-contain" : "object-cover"} ${position === "top" ? "object-top" : "object-center"} ${muted ? "grayscale" : ""}`} sizes={sizes} />;
  }

  // 이미지가 없으면 빈 칸 대신 기본 이미지를 둔다(.ai/DESIGN.md Shapes).
  if (fallback) return <div role="img" aria-label={`${alt} 대표 이미지`}>{fallback}</div>;
  return (
    <div role="img" aria-label={`${alt} 대표 이미지`} className="absolute inset-0 flex items-center justify-center bg-surface-muted text-content-placeholder">
      <Waves {...iconProps} size={24} />
    </div>
  );
}
