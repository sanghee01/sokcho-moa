"use client";

import { useActionState, useState } from "react";
import { AnalyticsMountTracking } from "@/components/analytics/analytics-mount-tracking";
import { FormField, getFieldControlProps } from "@/components/ui/form-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { getButtonClassName } from "@/components/ui/button-styles";
import {
  formContainerClassName,
  formErrorMessageClassName,
  formSuccessMessageClassName,
  getFormControlClassName,
} from "@/components/ui/form-styles";
import { submitEventReportAction } from "@/features/reports/actions";
import { initialFormActionState } from "@/lib/action-state";
import { HoneypotField } from "@/components/ui/honeypot-field";

export function EventReportForm() {
  const [state, formAction] = useActionState(submitEventReportAction, initialFormActionState);
  const [draft, setDraft] = useState({ title: "", body: "", sourceUrl: "" });
  const fieldErrors = state.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  if (state.success) {
    return (
      <div role="status" className={formSuccessMessageClassName}>
        {/* 서버가 접수한 제보만 센다. GA 자동 수집 form_submit은 이 폼에서 기록되지 않고 실패한 제출도 센다(2026-11-07). */}
        <AnalyticsMountTracking name="event_report_submitted" properties={{}} />
        <p className="text-title-3">제보가 접수되었습니다.</p>
        <p className="mt-2 text-body">보내주신 내용을 확인한 뒤 반영 가능한 행사라면 속초모아에 등록하겠습니다. 감사합니다.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={formContainerClassName}>
      <FormField id="report-title" label="제목" error={fieldErrors.title}>
        <input
          {...getFieldControlProps("report-title", { error: fieldErrors.title })}
          required
          minLength={2}
          maxLength={200}
          name="title"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          autoComplete="off"
          placeholder="행사나 프로그램 이름"
          className={getFormControlClassName("input")}
        />
      </FormField>

      <FormField id="report-body" label="본문" error={fieldErrors.body}>
        <textarea
          {...getFieldControlProps("report-body", { error: fieldErrors.body })}
          required
          minLength={10}
          maxLength={5000}
          name="body"
          value={draft.body}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          rows={8}
          placeholder="일정, 장소, 신청 방법 등 알고 있는 내용"
          className={getFormControlClassName("textarea")}
        />
      </FormField>

      <FormField id="report-source-url" label="링크" help="공식 안내 페이지나 신청 페이지 주소를 입력해 주세요." error={fieldErrors.sourceUrl}>
        <input
          {...getFieldControlProps("report-source-url", { hasHelp: true, error: fieldErrors.sourceUrl })}
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
      </FormField>

      <HoneypotField />

      {/* 칸별 오류가 있으면 칸 아래에만 보여 준다. 칸과 관계없는 오류(요청 제한, 저장 실패)만 여기 둔다. */}
      {Boolean(state.error) && !hasFieldErrors && (
        <p role="alert" className={formErrorMessageClassName}>
          {state.error}
        </p>
      )}

      <FormSubmitButton
        idleLabel="제보 보내기"
        pendingLabel="제보 접수 중…"
        className={getButtonClassName({ variant: "primary", size: "lg", width: "full" })}
      />
    </form>
  );
}
