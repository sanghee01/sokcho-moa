"use client";

import { useActionState, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { getButtonClassName } from "@/components/ui/button-styles";
import {
  formContainerClassName,
  formErrorMessageClassName,
  formFieldHelpTextClassName,
  formFieldLabelClassName,
  formSuccessMessageClassName,
  getFormControlClassName,
} from "@/components/ui/form-styles";
import { submitEventReportAction, type EventReportActionState } from "@/lib/actions/reports";

const initialState: EventReportActionState = { error: null, success: false };

export function EventReportForm() {
  const [state, formAction] = useActionState(submitEventReportAction, initialState);
  const [draft, setDraft] = useState({ title: "", body: "", sourceUrl: "" });

  if (state.success) {
    return (
      <div role="status" className={formSuccessMessageClassName}>
        <p className="text-xl font-black">제보가 접수되었습니다.</p>
        <p className="mt-2 leading-7">보내주신 내용을 확인한 뒤 반영 가능한 행사라면 속초모아에 등록하겠습니다. 감사합니다.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={formContainerClassName}>
      <label className={formFieldLabelClassName}>
        제목 <span className="text-rose-600" aria-hidden="true">*</span>
        <input
          required
          minLength={2}
          maxLength={200}
          name="title"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          autoComplete="off"
          placeholder="행사나 프로그램 이름을 입력해 주세요"
          className={getFormControlClassName("input")}
        />
      </label>

      <label className={formFieldLabelClassName}>
        본문 <span className="text-rose-600" aria-hidden="true">*</span>
        <textarea
          required
          minLength={10}
          maxLength={5000}
          name="body"
          value={draft.body}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          rows={9}
          placeholder="일정, 장소, 신청 방법 등 알고 있는 내용을 적어 주세요"
          className={getFormControlClassName("textarea")}
        />
      </label>

      <label className={formFieldLabelClassName}>
        링크 <span className="text-rose-600" aria-hidden="true">*</span>
        <input
          required
          type="url"
          maxLength={2048}
          name="sourceUrl"
          value={draft.sourceUrl}
          onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))}
          inputMode="url"
          placeholder="https://..."
          className={getFormControlClassName("input")}
        />
        <span className={formFieldHelpTextClassName}>공식 안내 페이지나 신청 페이지 링크를 입력해 주세요.</span>
      </label>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {state.error && (
        <p role="alert" className={formErrorMessageClassName}>
          {state.error}
        </p>
      )}

      <FormSubmitButton
        idleLabel="제보 보내기"
        pendingLabel="제보 접수 중…"
        className={getButtonClassName({ variant: "primary", size: "large", width: "fullOnMobile" })}
      />
    </form>
  );
}
