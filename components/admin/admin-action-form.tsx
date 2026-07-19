"use client";

import { useActionState, type ReactNode } from "react";
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

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}
    </form>
  );
}
