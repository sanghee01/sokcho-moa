"use client";

import { useEffect, useState } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

type ShareStatus = "idle" | "copied" | "error";

const feedbackByStatus: Record<Exclude<ShareStatus, "idle">, { message: string; tone: string }> = {
  copied: { message: "링크를 복사했어요.", tone: "text-primary-text" },
  error: { message: "복사 실패. 다시 눌러 주세요.", tone: "text-danger" },
};

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
        // 공유 시트에서 실제로 공유했을 때만 집계한다(취소하면 AbortError로 아래 catch에 간다).
        trackAnalyticsEvent("share", { method: "native_share_sheet", content_type: "event", item_id: slug });
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

  const feedback = status === "idle" ? null : feedbackByStatus[status];

  return (
    <div className="relative self-start pb-6">
      <button
        type="button"
        onClick={handleShare}
        className={getButtonClassName({ variant: "secondary" })}
      >
        공유하기
      </button>
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`absolute left-1/2 top-11 mt-1 -translate-x-1/2 whitespace-nowrap text-caption font-semibold ${feedback.tone}`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
