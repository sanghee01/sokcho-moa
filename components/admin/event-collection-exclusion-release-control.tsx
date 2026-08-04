"use client";

import { useRef, useState } from "react";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { releaseEventCollectionExclusionAction } from "@/lib/actions/admin/event";

export function EventCollectionExclusionReleaseControl({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `event-exclusion-release-${id}`;

  const openDialog = () => {
    dialogRef.current?.showModal();
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="min-h-10 shrink-0 rounded-xl border border-teal-700 px-3 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50"
      >
        재수집 허용
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-teal-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/40"
      >
        <AdminActionForm
          key={isOpen ? "open" : "closed"}
          action={releaseEventCollectionExclusionAction}
          className="space-y-5 p-6"
        >
          <div>
            <h2 id={titleId} className="text-xl font-black">{title} 재수집 허용</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              재수집 차단 상태만 해제됩니다. 삭제 당시 기록과 식별 정보는 감사 목적으로 보존되며, 이후 수집에서 같은 행사가 다시 등록될 수 있습니다.
            </p>
          </div>
          <input type="hidden" name="id" value={id} />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <FormSubmitButton
              idleLabel="재수집 허용"
              pendingLabel="해제 중…"
              className="min-h-11 rounded-xl bg-teal-800 px-4 py-2 text-sm font-bold text-white hover:bg-teal-900"
            />
          </div>
        </AdminActionForm>
      </dialog>
    </>
  );
}
