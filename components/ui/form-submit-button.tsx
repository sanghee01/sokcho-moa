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
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60`}
    >
      {pending && <LoadingSpinner className="size-4" />}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
