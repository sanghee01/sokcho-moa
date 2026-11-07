"use client";

import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ConfirmDialog, ConfirmDialogActions, getConfirmButtonClassName } from "@/components/ui/confirm-dialog";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { statusControlStyles } from "@/features/events/admin/components/status-control-styles";
import { deleteEventAction } from "@/features/events/admin/actions";

interface EventDeletionTarget {
  id: string;
  title: string;
}

export function EventDeleteControl({ event }: { event: EventDeletionTarget }) {
  return (
    <ConfirmDialog
      triggerLabel="삭제"
      triggerClassName={statusControlStyles.deleteButton}
      title={`${event.title} 삭제`}
      description="삭제한 행사는 복구할 수 없으며, 연결된 출처 기록과 운영 회차도 함께 삭제됩니다. 같은 행사가 다시 수집되지 않도록 재수집 제외 목록에 저장됩니다."
    >
      <AdminActionForm action={deleteEventAction} className="space-y-3">
        <input type="hidden" name="id" value={event.id} />
        <input type="hidden" name="confirmation" value="delete" />
        <ConfirmDialogActions>
          <FormSubmitButton idleLabel="행사 삭제" pendingLabel="삭제 중…" className={getConfirmButtonClassName("danger")} />
        </ConfirmDialogActions>
      </AdminActionForm>
    </ConfirmDialog>
  );
}
