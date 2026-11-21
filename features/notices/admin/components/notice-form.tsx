import { AdminActionForm } from "@/components/admin/admin-action-form";
import { getButtonClassName } from "@/components/ui/button-styles";
import { ConfirmDialog, ConfirmDialogActions } from "@/components/ui/confirm-dialog";
import { formFieldHelpTextClassName, formFieldLabelClassName, getFormControlClassName } from "@/components/ui/form-styles";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { deleteNoticeAction, saveNoticeAction } from "@/features/notices/admin/actions";
import { NOTICE_BODY_MAX_LENGTH, NOTICE_TITLE_MAX_LENGTH } from "@/features/notices/admin/schemas";
import { NOTICE_BANNER_DAYS, noticeKindLabels, noticeKinds } from "@/features/notices/model/notice";
import type { Tables } from "@/lib/supabase/database.types";

/** 수정 화면에서 받은 DB 행. 새 공지는 null. */
type Row = Tables<"notices"> | null;
const input = getFormControlClassName("input");
const textarea = getFormControlClassName("textarea");
const label = formFieldLabelClassName;

export function NoticeForm({ row }: { row: Row }) {
  const id = row?.id ?? "";
  return (
    <div className="space-y-6">
      <AdminActionForm action={saveNoticeAction} className="grid gap-5 rounded-card bg-surface p-5 ring-1 ring-line sm:p-8">
        {Boolean(id) && <input type="hidden" name="id" value={id} />}
        <label className={label}>
          종류
          <select name="kind" defaultValue={row?.kind ?? "notice"} className={input}>
            {noticeKinds.map((kind) => <option key={kind} value={kind}>{noticeKindLabels[kind]}</option>)}
          </select>
        </label>
        <label className={label}>제목<input required name="title" maxLength={NOTICE_TITLE_MAX_LENGTH} defaultValue={row?.title ?? ""} className={input} /></label>
        <label className={label}>
          내용
          <textarea required name="body" rows={10} maxLength={NOTICE_BODY_MAX_LENGTH} defaultValue={row?.body ?? ""} className={textarea} />
          <span className={`block ${formFieldHelpTextClassName}`}>줄바꿈은 그대로 보입니다.</span>
        </label>
        <div>
          <label className="flex min-h-11 items-center gap-2 text-label font-semibold text-content-strong"><input type="checkbox" name="isPublished" defaultChecked={row?.is_published === true} /> 방문자에게 공개</label>
          <p className={formFieldHelpTextClassName}>처음 공개한 날부터 {NOTICE_BANNER_DAYS}일 동안 모든 페이지 위쪽에 제목이 보입니다.</p>
        </div>
        <FormSubmitButton idleLabel="공지 저장" pendingLabel="저장 중…" className={`${getButtonClassName({ variant: "primary", size: "lg" })} justify-self-start`} />
      </AdminActionForm>
      {Boolean(id) && (
        // 삭제 확인은 다른 관리자 화면과 같은 공통 확인 창으로 묻는다(.ai/DESIGN.md Dialog).
        <section className="space-y-3 rounded-card bg-danger-subtle p-5 ring-1 ring-danger-subtle sm:p-6">
          <p className="font-bold text-danger">공지 삭제</p>
          <p className="text-label font-normal text-danger">삭제한 공지는 복구할 수 없습니다. 잠시 내리려면 공개를 끄고 저장하세요.</p>
          <ConfirmDialog
            triggerLabel="공지 삭제"
            triggerClassName={getButtonClassName({ variant: "secondary" })}
            title={`${row?.title ?? "공지"} 삭제`}
            description="삭제한 공지는 복구할 수 없습니다."
          >
            <AdminActionForm action={deleteNoticeAction} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="confirmation" value="delete" />
              <ConfirmDialogActions>
                <FormSubmitButton idleLabel="공지 삭제" pendingLabel="삭제 중…" className={getButtonClassName({ variant: "danger" })} />
              </ConfirmDialogActions>
            </AdminActionForm>
          </ConfirmDialog>
        </section>
      )}
    </div>
  );
}
