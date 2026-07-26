"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { AdminActionState } from "@/lib/actions/admin";

type AdminFormAction = (
  previousState: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

const initialState: AdminActionState = { error: null };

export function AdminActionForm({
  action,
  className,
  children,
}: {
  action: AdminFormAction;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [dismissedState, setDismissedState] = useState<AdminActionState | null>(null);
  const error = dismissedState === state ? null : state.error;

  const dismissCurrentError = () => {
    if (state.error) setDismissedState(state);
  };

  return (
    <form action={formAction} className={className} onChange={dismissCurrentError} onSubmit={dismissCurrentError}>
      {children}
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
          {error}
        </p>
      )}
    </form>
  );
}
