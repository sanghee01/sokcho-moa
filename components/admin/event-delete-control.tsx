"use client";

import { useRef, useState } from "react";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { statusControlStyles } from "@/components/admin/status-control-styles";
import { deleteEventAction } from "@/lib/actions/admin/event";

type EventDeletionTarget = {
  id: string;
  slug: string;
  title: string;
};

export function EventDeleteControl({ event }: { event: EventDeletionTarget }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `event-delete-${event.id}`;

  const openDialog = () => {
    dialogRef.current?.showModal();
    setIsOpen(true);
  };

  const closeDialog = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" onClick={openDialog} className={statusControlStyles.deleteButton}>삭제</button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-rose-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/40"
      >
        <AdminActionForm key={isOpen ? "open" : "closed"} action={deleteEventAction} className="space-y-5 p-6">
          <div>
            <h2 id={titleId} className="text-xl font-black">{event.title} 삭제</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">삭제한 행사는 복구할 수 없으며, 연결된 출처 기록과 운영 회차도 함께 삭제됩니다. 같은 행사가 다시 수집되지 않도록 재수집 제외 목록에 저장됩니다.</p>
          </div>
          <input type="hidden" name="id" value={event.id} />
          <input type="hidden" name="slug" value={event.slug} />
          <input type="hidden" name="confirmation" value="delete" />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={closeDialog} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">취소</button>
            <FormSubmitButton idleLabel="행사 삭제" pendingLabel="삭제 중…" className="min-h-11 rounded-xl bg-rose-800 px-4 py-2 text-sm font-bold text-white hover:bg-rose-900" />
          </div>
        </AdminActionForm>
      </dialog>
    </>
  );
}
