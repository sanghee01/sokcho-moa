"use client";

import { createContext, useContext } from "react";
import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * onSubmit에서 action을 직접 호출하는 폼(AdminActionForm)은 useFormStatus가 제출 중 상태를 알 수 없다.
 * 그런 폼은 이 context로 제출 중 상태를 알려 준다.
 */
export const FormPendingContext = createContext(false);

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  className: string;
  disabled?: boolean;
}) {
  const { pending: formActionPending } = useFormStatus();
  const contextPending = useContext(FormPendingContext);
  const pending = formActionPending || contextPending;
  const isDisabled = disabled || pending;

  return (
    // 저장 중일 때만 기다림 커서를 보인다. 그냥 disabled일 때의 커서는 버튼 helper(disabled:cursor-not-allowed)를 따른다.
    // disabled:cursor-wait를 함께 두면 같은 조건의 두 class가 다퉈 어느 쪽이 보일지 정해지지 않았다(2026-11-07).
    // aria-busy를 더한 선택자가 더 구체적이라 class 순서와 관계없이 이긴다.
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:aria-busy:cursor-wait`}
    >
      {pending && <LoadingSpinner className="size-4" />}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
