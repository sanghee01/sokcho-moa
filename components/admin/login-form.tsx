"use client";

import { useActionState, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { signInAction } from "@/lib/actions/admin/auth";
import type { AdminActionState } from "@/lib/actions/admin/types";

const initialState: AdminActionState = { error: null };

export function AdminLoginForm({ disabled }: { disabled: boolean }) {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="mt-8 space-y-5 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
      <label className="block text-sm font-bold text-slate-700">
        이메일
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
        />
      </label>
      <label className="block text-sm font-bold text-slate-700">
        비밀번호
        <input required minLength={8} type="password" name="password" autoComplete="current-password" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}
      <FormSubmitButton
        idleLabel="로그인"
        pendingLabel="로그인 중…"
        disabled={disabled}
        className="w-full rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white"
      />
    </form>
  );
}
