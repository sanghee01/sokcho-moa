"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { iconProps } from "@/components/ui/icon";
import { DISMISSED_NOTICE_STORAGE_KEY } from "@/features/notices/model/notice";

/**
 * 상단 공지 띠의 틀과 닫기 버튼. 닫으면 그 공지 id를 브라우저에 적어 두어 다시 띄우지 않는다.
 * 이미 닫은 방문자에게는 notice-banner.tsx의 inline script가 첫 그리기 전에 hidden을 붙인다.
 * 그 hidden은 서버가 보낸 HTML에 없으므로 suppressHydrationWarning으로 차이를 허용한다.
 */
export function NoticeBannerFrame({ noticeId, children }: { noticeId: string; children: ReactNode }) {
  const [isDismissed, setIsDismissed] = useState(false);
  if (isDismissed) return null;

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISSED_NOTICE_STORAGE_KEY, noticeId);
    } catch {
      // 저장소를 막은 브라우저에서는 이번 화면에서만 닫힌다.
    }
    setIsDismissed(true);
  }

  return (
    <aside data-notice-banner suppressHydrationWarning aria-label="새 공지" className="border-b border-line bg-primary-subtle">
      <div className="mx-auto flex max-w-6xl items-center gap-2 pl-4 pr-1 sm:pl-6 sm:pr-3">
        {children}
        <button type="button" onClick={handleDismiss} aria-label="공지 닫기" className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-primary-text hover:bg-primary-subtle-hover">
          <X {...iconProps} />
        </button>
      </div>
    </aside>
  );
}
