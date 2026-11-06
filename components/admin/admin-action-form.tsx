"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { FormPendingContext } from "@/components/ui/form-submit-button";
import type { AdminActionState } from "@/lib/action-state";

type AdminFormAction = (
  previousState: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

const initialState: AdminActionState = { error: null };

/**
 * 관리자 폼. 성공하면 action이 redirect하고, 실패하면 오류 문장을 보여 준다.
 *
 * `<form action>`에 action을 바로 넘기면 React 19는 결과와 관계없이 제출 뒤 입력을 초기값으로 되돌린다.
 * 그러면 서버 검증 오류 한 번에 관리자가 쓴 내용이 모두 사라진다. 그래서 onSubmit에서 FormData를 만들어
 * action을 직접 호출하고(자동 초기화 없음), 제출 중 상태는 FormPendingContext로 제출 버튼에 알린다.
 */
export function AdminActionForm({
  action,
  className,
  children,
}: {
  action: AdminFormAction;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [dismissedState, setDismissedState] = useState<AdminActionState | null>(null);
  const error = dismissedState === state ? null : state.error;

  function dismissCurrentError() {
    if (state.error) setDismissedState(state);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    dismissCurrentError();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return (
    <FormPendingContext value={isPending}>
      <form className={className} onChange={dismissCurrentError} onSubmit={submit} aria-busy={isPending}>
        {children}
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
            {error}
          </p>
        )}
      </form>
    </FormPendingContext>
  );
}
