"use client";

import { useActionState, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { getButtonClassName } from "@/components/ui/button-styles";
import {
  formContainerClassName,
  formErrorMessageClassName,
  formFieldHelpTextClassName,
  formFieldLabelClassName,
  formFieldLabelNoteClassName,
  formSuccessMessageClassName,
  getFormControlClassName,
} from "@/components/ui/form-styles";
import { submitSiteFeedbackAction, type SiteFeedbackActionState } from "@/lib/actions/feedback";
import {
  getSiteFeedbackImageValidationError,
  SITE_FEEDBACK_IMAGE_ACCEPT,
  SITE_FEEDBACK_IMAGE_MAX_MB,
} from "@/lib/domain/feedback";

const initialState: SiteFeedbackActionState = { error: null, success: false };

export function SiteFeedbackForm({ imageUploadEnabled }: { imageUploadEnabled: boolean }) {
  const [state, formAction] = useActionState(submitSiteFeedbackAction, initialState);
  const [imageError, setImageError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "", linkUrl: "" });

  if (state.success) {
    return (
      <div role="status" className={formSuccessMessageClassName}>
        <p className="text-xl font-black">의견을 보내주셔서 감사합니다.</p>
        <p className="mt-2 leading-7">보내주신 내용은 속초모아를 더 편리하게 만드는 데 소중히 참고하겠습니다.</p>
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
          placeholder="어떤 의견인지 한 줄로 알려주세요"
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
          placeholder="사이트를 사용하며 불편했던 점, 개선하면 좋을 점, 좋았던 점이나 사용평을 자유롭게 적어 주세요"
          className={getFormControlClassName("textarea")}
        />
      </label>

      <label className={formFieldLabelClassName}>
        관련 링크 <span className={formFieldLabelNoteClassName}>(선택)</span>
        <input
          type="url"
          maxLength={2048}
          name="linkUrl"
          value={draft.linkUrl}
          onChange={(event) => setDraft((current) => ({ ...current, linkUrl: event.target.value }))}
          inputMode="url"
          placeholder="https://..."
          className={getFormControlClassName("input")}
        />
        <span className={formFieldHelpTextClassName}>의견과 관련된 화면이나 참고할 페이지가 있다면 입력해 주세요.</span>
      </label>

      <label className={formFieldLabelClassName}>
        사진 첨부 <span className={formFieldLabelNoteClassName}>{imageUploadEnabled ? "(선택)" : "(현재 사용 불가)"}</span>
        <input
          type="file"
          name="image"
          disabled={!imageUploadEnabled}
          accept={SITE_FEEDBACK_IMAGE_ACCEPT}
          aria-describedby="feedback-image-help"
          onChange={(event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            const error = file ? getSiteFeedbackImageValidationError(file) : null;
            setImageError(error);
            if (error) input.value = "";
          }}
          className={getFormControlClassName("fileInput")}
        />
        {imageUploadEnabled ? (
          <span id="feedback-image-help" className={formFieldHelpTextClassName}>
            화면을 설명하는 사진 1장을 첨부할 수 있습니다. JPG, PNG, WebP · 최대 {SITE_FEEDBACK_IMAGE_MAX_MB}MB
          </span>
        ) : (
          <span id="feedback-image-help" className="mt-3 block rounded-2xl bg-amber-50 px-4 py-3 font-normal leading-6 text-amber-950 ring-1 ring-amber-200">
            현재 환경에서는 사진 첨부를 사용할 수 없습니다. 사진 없이 작성한 내용과 관련 링크만 보내 주세요.
          </span>
        )}
      </label>

      {imageError && (
        <p role="alert" className={formErrorMessageClassName}>
          {imageError}
        </p>
      )}

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {state.error && !imageError && (
        <p role="alert" className={formErrorMessageClassName}>
          {state.error}
        </p>
      )}

      <FormSubmitButton
        idleLabel="의견 보내기"
        pendingLabel="의견 전송 중…"
        className={getButtonClassName({ variant: "primary", size: "large", width: "fullOnMobile" })}
      />
    </form>
  );
}
