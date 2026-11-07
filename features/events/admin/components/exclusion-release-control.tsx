"use client";

import { AdminActionForm } from "@/components/admin/admin-action-form";
import { getButtonClassName } from "@/components/ui/button-styles";
import { ConfirmDialog, ConfirmDialogActions } from "@/components/ui/confirm-dialog";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { releaseEventCollectionExclusionAction } from "@/features/events/admin/actions";

export function EventCollectionExclusionReleaseControl({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <ConfirmDialog
      triggerLabel="재수집 허용"
      triggerClassName={`${getButtonClassName({ variant: "tonal" })} shrink-0`}
      title={`${title} 재수집 허용`}
      description="재수집 차단 상태만 해제됩니다. 삭제 당시 기록과 식별 정보는 감사 목적으로 보존되며, 이후 수집에서 같은 행사가 다시 등록될 수 있습니다."
    >
      <AdminActionForm action={releaseEventCollectionExclusionAction} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <ConfirmDialogActions>
          <FormSubmitButton idleLabel="재수집 허용" pendingLabel="해제 중…" className={getButtonClassName({ variant: "primary" })} />
        </ConfirmDialogActions>
      </AdminActionForm>
    </ConfirmDialog>
  );
}
