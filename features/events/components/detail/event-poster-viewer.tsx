"use client";

import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { iconProps } from "@/components/ui/icon";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/** 크게 보기를 열 때 넣는 방문 기록 칸의 표시. 이 칸이 현재 기록일 때만 닫으면서 뒤로 돌린다. */
const VIEWER_HISTORY_KEY = "eventPosterViewer";

function isViewerHistoryEntry(state: unknown) {
  return typeof state === "object" && state !== null && VIEWER_HISTORY_KEY in state;
}

/** 어떤 포스터 위에서도 보이도록 진한 반투명 원 + 흰 테두리를 둔다. 흰 포스터에서는 원이, 검은 포스터에서는 테두리가 보인다. */
const posterControlClassName = "inline-flex items-center justify-center rounded-full bg-content-strong/75 text-on-image ring-1 ring-on-image/40";

/**
 * 상세 포스터 위를 덮는 "포스터 크게 보기" 버튼과 화면 전체 크게 보기. 모바일 포스터 영역은 높이 240px이라
 * 세로 포스터 속 글자를 읽기 어려웠다(2026-11-18 사용자 결정). 규칙의 원본은 .ai/DESIGN.md "Dialog 규칙"의 이미지 보기다.
 * - <dialog>와 showModal()로 초점 가두기·Esc 닫기·닫은 뒤 버튼으로 초점 돌려주기를 브라우저에 맡긴다.
 * - 안드로이드 뒤로가기는 페이지를 떠나지 않고 창만 닫도록 열 때 같은 주소의 기록을 하나 넣는다.
 *   닫기·Esc·배경으로 닫으면 그 기록을 되돌려, 열고 닫기를 반복해도 뒤로가기 한 번이면 이전 페이지로 간다.
 * - 열려 있는 동안 뒤 페이지 스크롤을 막는다.
 * - 포스터 바깥(어두운 곳)을 누르면 닫히고, 포스터 자체를 누르면 닫지 않는다(두 손가락 확대 중 잘못 닫히지 않게).
 */
export function EventPosterViewer({ imageUrl, title, slug, category }: { imageUrl: string; title: string; slug: string; category: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    function handlePopState() {
      if (dialogRef.current?.open) dialogRef.current.close();
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleOpen() {
    dialogRef.current?.showModal();
    // <dialog>는 뒤 화면 스크롤을 막지 않아, 열린 채 스크롤하면 닫았을 때 다른 위치에 있었다(2026-11-18 확인).
    document.documentElement.style.overflow = "hidden";
    window.history.pushState({ [VIEWER_HISTORY_KEY]: true }, "");
    trackAnalyticsEvent("poster_viewed", { event_slug: slug, event_category: category });
  }

  function handleClose() {
    dialogRef.current?.close();
  }

  // 닫는 방법(닫기 버튼, Esc, 배경, 뒤로가기)이 모두 지나는 close 이벤트에서 기록을 정리한다.
  // 뒤로가기로 닫힌 때는 이미 기록이 한 칸 돌아가 있어 다시 돌리지 않는다.
  function handleDialogClose() {
    document.documentElement.style.overflow = "";
    if (isViewerHistoryEntry(window.history.state)) window.history.back();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (!(event.target instanceof HTMLImageElement)) handleClose();
  }

  return (
    <>
      {/* 포스터 영역 전체가 누르는 곳이다. 오른쪽 아래 확대 아이콘은 누를 수 있다는 표시라 hover 없이 항상 보인다. */}
      <button type="button" onClick={handleOpen} aria-label="포스터 크게 보기" className="absolute inset-0 flex cursor-zoom-in items-end justify-end p-3">
        <span className={`${posterControlClassName} size-9`}>
          <Maximize2 {...iconProps} size={18} />
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`${title} 포스터`}
        onClose={handleDialogClose}
        onClick={handleDialogClick}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-image-scrim-strong p-0 text-on-image transition-opacity duration-200 backdrop:bg-transparent starting:open:opacity-0 motion-reduce:transition-none"
      >
        <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          {/* 닫기 버튼은 포스터와 겹치지 않는 윗줄에 둔다. 확대해서 포스터가 올라와도 버튼 자체 배경으로 보인다. */}
          {/* 가장자리에서 8px은 모서리에 붙어 보여 포스터 좌우 여백과 같은 16px(lg 24px)로 띄운다(2026-11-18 사용자 결정). */}
          <div className="flex shrink-0 justify-end px-4 pb-2 pt-4 lg:px-6 lg:pt-6">
            <button type="button" onClick={handleClose} aria-label="닫기" className={`${posterControlClassName} size-11 hover:bg-content-strong`}>
              <X {...iconProps} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
            {hasLoadError ? (
              <p className="text-body">포스터를 불러오지 못했어요.</p>
            ) : (
              // 이미지 상자가 보이는 포스터 크기와 같아야 바깥 클릭을 구분할 수 있어 fill 대신 원래 비율로 줄인다.
              // 작은 원본은 늘리지 않는다(흐려 보임).
              <Image
                src={imageUrl}
                alt={title}
                width={0}
                height={0}
                unoptimized
                sizes="100vw"
                onError={() => setHasLoadError(true)}
                className="size-auto max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
