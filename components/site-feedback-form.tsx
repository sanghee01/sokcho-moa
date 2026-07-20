"use client";

import { useActionState, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
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
      <div role="status" className="rounded-3xl border border-teal-200 bg-teal-50 p-6 text-teal-950 sm:p-8">
        <p className="text-xl font-black">의견을 보내주셔서 감사합니다.</p>
        <p className="mt-2 leading-7">보내주신 내용은 속초모아를 더 편리하게 만드는 데 소중히 참고하겠습니다.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <label className="block text-sm font-bold text-slate-700">
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
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-950 placeholder:font-normal placeholder:text-slate-400"
        />
      </label>

      <label className="block text-sm font-bold text-slate-700">
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
          className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal leading-6 text-slate-950 placeholder:font-normal placeholder:text-slate-400"
        />
      </label>

      <label className="block text-sm font-bold text-slate-700">
        관련 링크 <span className="font-normal text-slate-500">(선택)</span>
        <input
          type="url"
          maxLength={2048}
          name="linkUrl"
          value={draft.linkUrl}
          onChange={(event) => setDraft((current) => ({ ...current, linkUrl: event.target.value }))}
          inputMode="url"
          placeholder="https://..."
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-950 placeholder:font-normal placeholder:text-slate-400"
        />
        <span className="mt-2 block font-normal leading-6 text-slate-500">의견과 관련된 화면이나 참고할 페이지가 있다면 입력해 주세요.</span>
      </label>

      <label className="block text-sm font-bold text-slate-700">
        사진 첨부 <span className="font-normal text-slate-500">{imageUploadEnabled ? "(선택)" : "(현재 사용 불가)"}</span>
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
          className="mt-2 block w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-teal-800 hover:file:bg-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
        />
        {imageUploadEnabled ? (
          <span id="feedback-image-help" className="mt-2 block font-normal leading-6 text-slate-500">
            화면을 설명하는 사진 1장을 첨부할 수 있습니다. JPG, PNG, WebP · 최대 {SITE_FEEDBACK_IMAGE_MAX_MB}MB
          </span>
        ) : (
          <span id="feedback-image-help" className="mt-3 block rounded-2xl bg-amber-50 px-4 py-3 font-normal leading-6 text-amber-950 ring-1 ring-amber-200">
            현재 환경에서는 사진 첨부를 사용할 수 없습니다. 사진 없이 작성한 내용과 관련 링크만 보내 주세요.
          </span>
        )}
      </label>

      {imageError && (
        <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
          {imageError}
        </p>
      )}

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {state.error && !imageError && (
        <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}

      <FormSubmitButton
        idleLabel="의견 보내기"
        pendingLabel="의견 전송 중…"
        className="w-full rounded-2xl bg-teal-800 px-6 py-3.5 font-black text-white hover:bg-teal-900 sm:w-auto"
      />
    </form>
  );
}
