"use client";

import { useActionState, useState } from "react";
import { FormField, getFieldControlProps } from "@/components/ui/form-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { getButtonClassName } from "@/components/ui/button-styles";
import {
  formContainerClassName,
  formErrorMessageClassName,
  formSuccessMessageClassName,
  getFormControlClassName,
} from "@/components/ui/form-styles";
import { submitSiteFeedbackAction } from "@/features/feedback/actions";
import { initialFormActionState } from "@/lib/action-state";
import {
  getSiteFeedbackImageValidationError,
  SITE_FEEDBACK_IMAGE_ACCEPT,
  SITE_FEEDBACK_IMAGE_MAX_MB,
} from "@/features/feedback/schemas";
import { HoneypotField } from "@/components/ui/honeypot-field";

export function SiteFeedbackForm() {
  const [state, formAction] = useActionState(submitSiteFeedbackAction, initialFormActionState);
  const [imageError, setImageError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "", linkUrl: "" });
  const fieldErrors = state.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  // 고르는 즉시 확인한 사진 오류를 서버 오류보다 먼저 보여 준다.
  const imageFieldError = imageError ?? fieldErrors.image;

  if (state.success) {
    return (
      <div role="status" className={formSuccessMessageClassName}>
        <p className="text-title-3">의견을 보내주셔서 감사합니다.</p>
        <p className="mt-2 text-body">보내주신 내용은 속초모아를 더 편리하게 만드는 데 소중히 참고하겠습니다.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={formContainerClassName}>
      <FormField id="feedback-title" label="제목" error={fieldErrors.title}>
        <input
          {...getFieldControlProps("feedback-title", { error: fieldErrors.title })}
          required
          minLength={2}
          maxLength={200}
          name="title"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          autoComplete="off"
          placeholder="어떤 의견인지 한 줄로"
          className={getFormControlClassName("input")}
        />
      </FormField>

      <FormField id="feedback-body" label="본문" error={fieldErrors.body}>
        <textarea
          {...getFieldControlProps("feedback-body", { error: fieldErrors.body })}
          required
          minLength={10}
          maxLength={5000}
          name="body"
          value={draft.body}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          rows={8}
          placeholder="불편했던 점, 개선하면 좋을 점, 좋았던 점"
          className={getFormControlClassName("textarea")}
        />
      </FormField>

      <FormField id="feedback-link-url" label="관련 링크" optional help="의견과 관련된 화면이나 참고할 페이지가 있다면 입력해 주세요." error={fieldErrors.linkUrl}>
        <input
          {...getFieldControlProps("feedback-link-url", { hasHelp: true, error: fieldErrors.linkUrl })}
          type="url"
          maxLength={2048}
          name="linkUrl"
          value={draft.linkUrl}
          onChange={(event) => setDraft((current) => ({ ...current, linkUrl: event.target.value }))}
          inputMode="url"
          placeholder="https://..."
          className={getFormControlClassName("input")}
        />
      </FormField>

      <FormField
        id="feedback-image"
        label="사진 첨부"
        optional
        help={`화면을 설명하는 사진 1장을 첨부할 수 있습니다. JPG, PNG, WebP · 최대 ${SITE_FEEDBACK_IMAGE_MAX_MB}MB`}
        error={imageFieldError}
      >
        <input
          {...getFieldControlProps("feedback-image", { hasHelp: true, error: imageFieldError })}
          type="file"
          name="image"
          accept={SITE_FEEDBACK_IMAGE_ACCEPT}
          onChange={(event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            const error = file ? getSiteFeedbackImageValidationError(file) : null;
            setImageError(error);
            if (error) input.value = "";
          }}
          className={getFormControlClassName("fileInput")}
        />
      </FormField>

      <HoneypotField />

      {/* 칸별 오류가 있으면 칸 아래에만 보여 준다. 칸과 관계없는 오류(요청 제한, 저장 실패)만 여기 둔다. */}
      {Boolean(state.error) && !hasFieldErrors && !imageError && (
        <p role="alert" className={formErrorMessageClassName}>
          {state.error}
        </p>
      )}

      <FormSubmitButton
        idleLabel="의견 보내기"
        pendingLabel="의견 전송 중…"
        className={getButtonClassName({ variant: "primary", size: "lg", width: "full" })}
      />
    </form>
  );
}
