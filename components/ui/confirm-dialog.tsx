"use client";

import { X } from "lucide-react";
import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";

/** 확인 창 안의 확정 버튼 색. 되돌릴 수 없는 동작은 danger, 그 밖(재수집 허용 등)은 primary다(.ai/DESIGN.md Button). */
type ConfirmVariant = "danger" | "primary";

/** 열린 확인 창을 닫는 함수. 창 안의 버튼 부품이 클릭할 때만 쓴다. */
const CloseDialogContext = createContext<() => void>(() => {});

/** 확인 창 아래 버튼 줄: 취소 + 확인 버튼 하나. 폼을 쓰는 확인 창은 이 줄을 폼 안에 둔다(오류 문장이 줄 아래에 나온다). */
export function ConfirmDialogActions({ children }: { children: ReactNode }) {
  const close = useContext(CloseDialogContext);
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={close} className={getButtonClassName({ variant: "secondary" })}>취소</button>
      {children}
    </div>
  );
}

/** 폼 없이 바로 실행하는 확인 버튼. 창을 닫은 뒤 onConfirm을 부른다. 폼을 쓰는 확인 창은 FormSubmitButton에 같은 class를 준다. */
export function ConfirmDialogButton({ variant, onConfirm, children }: { variant: ConfirmVariant; onConfirm: () => void; children: ReactNode }) {
  const close = useContext(CloseDialogContext);
  function handleClick() {
    close();
    onConfirm();
  }
  return <button type="button" onClick={handleClick} className={getButtonClassName({ variant })}>{children}</button>;
}

/**
 * 되돌릴 수 없는 동작(삭제, 재수집 허용 등) 전에 묻는 공통 확인 창. 규칙의 원본은 .ai/DESIGN.md "Dialog 규칙"이다.
 * - HTML <dialog>와 showModal()로 초점 가두기·Esc 닫기·뒤 화면 비활성을 브라우저에 맡기고, 닫히면 연 버튼으로 초점이 돌아간다.
 * - 모바일은 아래에서 올라오는 시트, md 이상은 가운데 창(최대 28rem). 높이는 화면의 85%까지이고 넘치면 창 안에서 스크롤한다.
 * - 배경을 누르면 닫힌다(확인 창에는 입력 칸이 없다).
 * 버튼 줄은 children으로 받는다: ConfirmDialogActions 안에 확인 버튼(FormSubmitButton 또는 ConfirmDialogButton)을 둔다.
 * 창을 다시 열면 children을 새로 그려 지난번 오류 문장이 남지 않는다.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  triggerDisabled = false,
  title,
  description,
  children,
}: {
  triggerLabel: string;
  triggerClassName: string;
  triggerDisabled?: boolean;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openCount, setOpenCount] = useState(0);
  const titleId = useId();

  function open() {
    dialogRef.current?.showModal();
    setOpenCount((count) => count + 1);
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button type="button" onClick={open} disabled={triggerDisabled} className={triggerClassName}>{triggerLabel}</button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          // 배경(<dialog> 자신)을 누르면 닫는다. 창 안의 내용을 누른 것은 target이 안쪽 요소다.
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85svh] w-full max-w-none overflow-y-auto rounded-t-card bg-surface p-0 pb-[env(safe-area-inset-bottom)] text-content-strong shadow-floating transition-transform duration-200 backdrop:bg-image-scrim starting:open:translate-y-full motion-reduce:transition-none md:inset-auto md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:pb-0 md:transition-none"
      >
        <CloseDialogContext value={close}>
          <div key={openCount} className="p-6">
            <div className="flex items-start gap-3">
              <h2 id={titleId} className="min-w-0 flex-1 pt-2 text-title-3 text-content-strong">{title}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-content-subtle hover:bg-surface-muted"
              >
                <X {...iconProps} />
              </button>
            </div>
            <div className="mt-2 text-label font-normal text-content-muted">{description}</div>
            <div className="mt-6">{children}</div>
          </div>
        </CloseDialogContext>
      </dialog>
    </>
  );
}
