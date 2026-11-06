import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ConfirmDialog, ConfirmDialogActions, getConfirmButtonClassName } from "@/components/ui/confirm-dialog";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { deletePlaceAction, savePlaceAction } from "@/features/places/admin/actions";
import { SLUG_PATTERN_SOURCE } from "@/lib/slug";
import type { Tables } from "@/lib/supabase/database.types";

/** 수정 화면에서 받은 DB 행. 새 명소는 null. 생성 타입을 써서 컬럼 이름이 바뀌면 typecheck가 잡는다. */
type Row = Tables<"places"> | null;
const input = "mt-1 w-full rounded-control border border-line-input bg-surface px-3 py-2.5";
const label = "text-label font-bold text-content";
function text(row: Row, key: keyof Tables<"places">) {
  return row?.[key] == null ? "" : String(row[key]);
}

export function PlaceForm({ row }: { row: Row }) {
  const id = text(row, "id");
  const slug = text(row, "slug");
  return (
    <div className="space-y-6">
      <AdminActionForm action={savePlaceAction} className="grid gap-5 rounded-card bg-surface p-5 ring-1 ring-line sm:grid-cols-2 sm:p-8">
        {id && <input type="hidden" name="id" value={id} />}
        <label className={label}>명소명<input required name="name" defaultValue={text(row, "name")} className={input} /></label>
        <label className={label}>슬러그<input required name="slug" defaultValue={slug} pattern={SLUG_PATTERN_SOURCE} className={input} /></label>
        <label className={label}>카테고리<input required name="category" defaultValue={text(row, "category")} className={input} /></label>
        <label className={label}>주소<input name="address" defaultValue={text(row, "address")} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>짧은 소개<textarea name="summary" defaultValue={text(row, "summary")} rows={3} className={input} /></label>
        <label className={label}>위도<input required type="number" step="any" name="latitude" defaultValue={text(row, "latitude")} className={input} /></label>
        <label className={label}>경도<input required type="number" step="any" name="longitude" defaultValue={text(row, "longitude")} className={input} /></label>
        <label className={label}>대표 이미지 URL<input type="url" name="imageUrl" defaultValue={text(row, "image_url")} className={input} /></label>
        <label className={label}>공식 홈페이지<input type="url" name="officialUrl" defaultValue={text(row, "official_url")} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>지도 URL<input type="url" name="mapUrl" defaultValue={text(row, "map_url")} className={input} /></label>
        <label className="flex items-center gap-2 text-label font-bold sm:col-span-2"><input type="checkbox" name="isPublished" defaultChecked={row?.is_published === true} /> 공개 명소로 표시</label>
        <FormSubmitButton idleLabel="명소 저장" pendingLabel="저장 중…" className="w-fit rounded-card bg-primary px-6 py-3 font-bold text-on-primary sm:col-span-2" />
      </AdminActionForm>
      {id && (
        // 삭제 확인은 다른 관리자 화면과 같은 공통 확인 창으로 묻는다(2026-11-06 사용자 결정).
        <section className="space-y-3 rounded-card bg-danger-subtle p-5 ring-1 ring-danger-subtle sm:p-6">
          <p className="font-bold text-danger">명소 삭제</p>
          <p className="text-label font-normal text-danger">삭제한 명소는 복구할 수 없고, 행사 상세의 주변 명소에서도 빠집니다.</p>
          <ConfirmDialog
            triggerLabel="명소 삭제"
            triggerClassName={getConfirmButtonClassName("danger")}
            title={`${text(row, "name")} 삭제`}
            description="삭제한 명소는 복구할 수 없고, 행사 상세의 주변 명소에서도 빠집니다."
          >
            <AdminActionForm action={deletePlaceAction} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="confirmation" value="delete" />
              <ConfirmDialogActions>
                <FormSubmitButton idleLabel="명소 삭제" pendingLabel="삭제 중…" className={getConfirmButtonClassName("danger")} />
              </ConfirmDialogActions>
            </AdminActionForm>
          </ConfirmDialog>
        </section>
      )}
    </div>
  );
}
