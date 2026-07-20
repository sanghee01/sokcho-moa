"use client";

import { useEffect, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

type ShareStatus = "idle" | "copied" | "shared" | "error";

function eventShareUrl(slug: string) {
  const url = new URL(`/events/${encodeURIComponent(slug)}`, window.location.origin);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  if (!fallbackCopy(text)) throw new Error("copy failed");
}

export function ShareEventButton({ slug }: { slug: string }) {
  const [status, setStatus] = useState<ShareStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timeoutId = window.setTimeout(() => setStatus("idle"), 2_500);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  async function handleShare() {
    const url = eventShareUrl(slug);
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const canShareNatively = isTouchDevice
      && typeof navigator.share === "function"
      && (typeof navigator.canShare !== "function" || navigator.canShare({ url }));

    if (canShareNatively) {
      try {
        await navigator.share({ url });
        trackAnalyticsEvent("share", { method: "native_share", content_type: "event", item_id: slug });
        setStatus("shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await copyText(url);
      trackAnalyticsEvent("share", { method: "link_copy", content_type: "event", item_id: slug });
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const label = status === "copied"
    ? "링크 복사됨"
    : status === "shared"
      ? "공유 완료"
      : status === "error"
        ? "복사 실패"
        : "공유하기";

  const announcement = status === "copied"
    ? "행사 링크가 복사되었습니다."
    : status === "shared"
      ? "행사 링크를 공유했습니다."
      : status === "error"
        ? "링크를 복사하지 못했습니다. 다시 시도해 주세요."
        : "";

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="min-h-12 min-w-[7rem] rounded-2xl border border-teal-800 bg-white px-5 py-3 font-bold text-teal-800 transition hover:bg-teal-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
      >
        {label}
      </button>
      <span aria-live="polite" className="sr-only">{announcement}</span>
    </>
  );
}
