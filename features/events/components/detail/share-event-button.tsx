"use client";

import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
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
    // 상세의 하단 행동 바 안에 있으므로 복사 결과는 버튼 위에 띄운다(아래는 화면 밖이다).
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleShare}
        className={getButtonClassName({ variant: "secondary" })}
      >
        <Share2 {...iconProps} size={18} />
        공유하기
      </button>
      {feedback !== null && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-badge bg-surface px-2 py-1 text-caption font-semibold shadow-floating ${feedback.tone}`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
