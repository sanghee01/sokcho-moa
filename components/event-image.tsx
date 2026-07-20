"use client";

import Image from "next/image";
import { useState } from "react";

export function EventImage({
  src,
  alt,
  priority = false,
  muted = false,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
  muted?: boolean;
  fit?: "cover" | "contain";
}) {
  const imageSrc = src?.trim() || null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (imageSrc && failedSrc !== imageSrc) {
    return <Image src={imageSrc} alt={alt} fill unoptimized priority={priority} onError={() => setFailedSrc(imageSrc)} className={`${fit === "contain" ? "object-contain" : "object-cover"} ${muted ? "grayscale opacity-65" : ""}`} sizes="(max-width: 768px) 100vw, 50vw" />;
  }

  return <div role="img" aria-label={`${alt} 대표 이미지`} className={`absolute inset-0 bg-gradient-to-br ${muted ? "from-slate-200 via-slate-100 to-slate-300" : "from-cyan-100 via-teal-50 to-amber-100"}`} />;
}
