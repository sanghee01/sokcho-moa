"use client";

import { useActionState, useState } from "react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { getButtonClassName } from "@/components/ui/button-styles";
import { formErrorMessageClassName, formFieldLabelClassName, getFormControlClassName } from "@/components/ui/form-styles";
import { signInAction } from "@/features/auth/actions";
import { initialAdminActionState } from "@/lib/action-state";

export function AdminLoginForm() {
  const [state, formAction] = useActionState(signInAction, initialAdminActionState);
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="mt-8 space-y-5 rounded-card bg-surface p-6 ring-1 ring-line">
      {/* 입력창은 방문자 폼과 같은 공통 스타일(입력 글자 16px). 예전에는 라벨의 14px을 물려받아 iOS에서 화면이 확대됐다(2026-11-07). */}
      <label className={formFieldLabelClassName}>
        이메일
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className={getFormControlClassName("input")}
        />
      </label>
      <label className={formFieldLabelClassName}>
        비밀번호
        <input required minLength={8} type="password" name="password" autoComplete="current-password" className={getFormControlClassName("input")} />
      </label>
      {state.error !== null && (
        <p role="alert" className={formErrorMessageClassName}>
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
