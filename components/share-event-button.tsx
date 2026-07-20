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
    const timeoutId = window.setTimeout(() => setStatus("idle"), 3_000);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  async function handleShare() {
    setStatus("idle");
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

  const feedback = status === "copied"
    ? {
        message: "링크 복사 완료!",
        tone: "text-teal-700",
      }
    : status === "shared"
      ? {
          message: "공유 완료!",
          tone: "text-teal-700",
        }
      : status === "error"
        ? {
            message: "복사 실패. 다시 눌러 주세요.",
            tone: "text-rose-700",
          }
        : null;

  return (
    <div className="relative self-start pb-6">
      <button
        type="button"
        onClick={handleShare}
        className="min-h-12 min-w-[7rem] rounded-2xl border border-teal-800 bg-white px-5 py-3 font-bold text-teal-800 transition hover:bg-teal-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
      >
        공유하기
      </button>
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`absolute left-1/2 top-12 mt-1 -translate-x-1/2 whitespace-nowrap text-sm font-black ${feedback.tone}`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
