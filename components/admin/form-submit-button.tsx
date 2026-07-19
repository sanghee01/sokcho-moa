"use client";

import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/loading-spinner";

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
  const { pending } = useFormStatus();
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
