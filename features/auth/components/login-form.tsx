"use client";

import { useActionState, useState } from "react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { getButtonClassName } from "@/components/ui/button-styles";
import { signInAction } from "@/features/auth/actions";
import type { AdminActionState } from "@/lib/action-state";

const initialState: AdminActionState = { error: null };

export function AdminLoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="mt-8 space-y-5 rounded-card bg-surface p-6 ring-1 ring-line">
      <label className="block text-label font-bold text-content">
        이메일
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-control border border-line-input px-3 py-2.5"
        />
      </label>
      <label className="block text-label font-bold text-content">
        비밀번호
        <input required minLength={8} type="password" name="password" autoComplete="current-password" className="mt-1 w-full rounded-control border border-line-input px-3 py-2.5" />
      </label>
      {state.error && (
        <p role="alert" className="rounded-control bg-danger-subtle px-3 py-2.5 text-label font-bold text-danger ring-1 ring-danger-subtle">
          {state.error}
        </p>
      )}
      <FormSubmitButton
        idleLabel="로그인"
        pendingLabel="로그인 중…"
        className={getButtonClassName({ variant: "primary", width: "full" })}
      />
    </form>
  );
}
