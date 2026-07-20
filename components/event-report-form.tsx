"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { submitEventReportAction, type EventReportActionState } from "@/lib/actions/reports";

const initialState: EventReportActionState = { error: null, success: false };

export function EventReportForm() {
  const [state, formAction] = useActionState(submitEventReportAction, initialState);

  if (state.success) {
    return (
      <div role="status" className="rounded-3xl border border-teal-200 bg-teal-50 p-6 text-teal-950 sm:p-8">
        <p className="text-xl font-black">제보가 접수되었습니다.</p>
        <p className="mt-2 leading-7">보내주신 내용을 확인한 뒤 반영 가능한 행사라면 속초모아에 등록하겠습니다. 감사합니다.</p>
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
          autoComplete="off"
          placeholder="행사나 프로그램 이름을 입력해 주세요"
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 placeholder:text-slate-400"
        />
      </label>

      <label className="block text-sm font-bold text-slate-700">
        본문 <span className="text-rose-600" aria-hidden="true">*</span>
        <textarea
          required
          minLength={10}
          maxLength={5000}
          name="body"
          rows={9}
          placeholder="일정, 장소, 신청 방법 등 알고 있는 내용을 적어 주세요"
          className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-950 placeholder:text-slate-400"
        />
      </label>

      <label className="block text-sm font-bold text-slate-700">
        링크 <span className="font-normal text-slate-500">(선택)</span>
        <input
          type="url"
          maxLength={2048}
          name="sourceUrl"
          inputMode="url"
          placeholder="https://..."
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 placeholder:text-slate-400"
        />
        <span className="mt-2 block font-normal leading-6 text-slate-500">공식 안내 페이지나 신청 페이지가 있다면 함께 보내주세요.</span>
      </label>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>웹사이트<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}

      <FormSubmitButton
        idleLabel="제보 보내기"
        pendingLabel="제보 접수 중…"
        className="w-full rounded-2xl bg-teal-800 px-6 py-3.5 font-black text-white hover:bg-teal-900 sm:w-auto"
      />
    </form>
  );
}
