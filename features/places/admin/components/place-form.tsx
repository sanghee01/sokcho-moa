import { AdminActionForm } from "@/components/admin/admin-action-form";
import { getButtonClassName } from "@/components/ui/button-styles";
import { ConfirmDialog, ConfirmDialogActions } from "@/components/ui/confirm-dialog";
import { formFieldLabelClassName, getFormControlClassName } from "@/components/ui/form-styles";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { deletePlaceAction, savePlaceAction } from "@/features/places/admin/actions";
import {
  activityCategories,
  activityCategoryLabels,
  activityTagLabels,
  activityTags,
  operationStatuses,
  operationStatusLabels,
} from "@/features/places/model/activity";
import { SLUG_PATTERN_SOURCE } from "@/lib/slug";
import type { Tables } from "@/lib/supabase/database.types";

/** 수정 화면에서 받은 DB 행. 새 명소는 null. 생성 타입을 써서 컬럼 이름이 바뀌면 typecheck가 잡는다. */
type Row = Tables<"places"> | null;
// 입력창·라벨은 방문자 폼과 같은 공통 스타일을 쓴다(입력 글자 16px, 2026-11-07).
const input = getFormControlClassName("input");
const textarea = getFormControlClassName("textarea");
const label = formFieldLabelClassName;
function text(row: Row, key: keyof Tables<"places">) {
  return row?.[key] == null ? "" : String(row[key]);
}

export function PlaceForm({ row }: { row: Row }) {
  const id = text(row, "id");
  const slug = text(row, "slug");
  return (
    <div className="space-y-6">
      <AdminActionForm action={savePlaceAction} className="grid gap-5 rounded-card bg-surface p-5 ring-1 ring-line sm:grid-cols-2 sm:p-8">
        {Boolean(id) && <input type="hidden" name="id" value={id} />}
        <label className={label}>명소명<input required name="name" defaultValue={text(row, "name")} className={input} /></label>
        <label className={label}>슬러그<input required name="slug" defaultValue={slug} pattern={SLUG_PATTERN_SOURCE} className={input} /></label>
        <label className={label}>카테고리<input required name="category" defaultValue={text(row, "category")} className={input} /></label>
        <label className={label}>주소<input name="address" defaultValue={text(row, "address")} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>짧은 소개<textarea name="summary" defaultValue={text(row, "summary")} rows={3} className={textarea} /></label>
        <label className={label}>위도<input required type="number" step="any" name="latitude" defaultValue={text(row, "latitude")} className={input} /></label>
        <label className={label}>경도<input required type="number" step="any" name="longitude" defaultValue={text(row, "longitude")} className={input} /></label>
        {/* type="url"을 쓰지 않는다. 우리 사이트에 올린 사진은 "/places/…webp" 경로라 브라우저의 URL 검사에 걸린다. 서버가 검증한다. */}
        <label className={label}>대표 사진 주소 <span className="font-normal text-content-subtle">(http 주소 또는 /places/…webp)</span><input name="imageUrl" defaultValue={text(row, "image_url")} className={input} /></label>
        <label className={label}>사진 출처 문구 <span className="font-normal text-content-subtle">(사진이 있으면 필수)</span><input name="imageCredit" defaultValue={text(row, "image_credit")} placeholder="사진: 만든 사람, CC BY-SA 4.0 (위키미디어 공용)" className={input} /></label>
        <label className={label}>사진 원본 페이지<input type="url" name="imageSourceUrl" defaultValue={text(row, "image_source_url")} className={input} /></label>
        <label className={label}>사진 설명 <span className="font-normal text-content-subtle">(보이는 장면)</span><input name="imageAlt" defaultValue={text(row, "image_alt")} className={input} /></label>
        <label className={label}>공식 홈페이지<input type="url" name="officialUrl" defaultValue={text(row, "official_url")} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>지도 URL<input type="url" name="mapUrl" defaultValue={text(row, "map_url")} className={input} /></label>
        <label className="flex min-h-11 items-center gap-2 text-label font-semibold text-content-strong sm:col-span-2"><input type="checkbox" name="isPublished" defaultChecked={row?.is_published === true} /> 공개 명소로 표시</label>

        {/* 즐길거리 목록·상세(/places)에 쓰는 값. 분류를 고른 장소만 즐길거리에 나온다(2026-11-21). */}
        <fieldset className="grid gap-5 border-t border-line pt-5 sm:col-span-2 sm:grid-cols-2">
          <legend className="text-title-3 text-content-strong">가볼만한 곳 정보</legend>
          <label className={label}>
            가볼만한 곳 분류
            <select name="activityCategory" defaultValue={text(row, "activity_category")} className={input}>
              {/* 행사 상세의 주변 명소 구역을 뺀 뒤(2026-11-21) 분류가 없는 장소는 공개여도 방문자에게 보이지 않는다. */}
              <option value="">없음 (사이트에 보이지 않음)</option>
              {activityCategories.map((category) => <option key={category} value={category}>{activityCategoryLabels[category]}</option>)}
            </select>
          </label>
          <label className={label}>
            운영 상태
            <select name="operationStatus" defaultValue={row?.operation_status ?? "open"} className={input}>
              {operationStatuses.map((status) => <option key={status} value={status}>{operationStatusLabels[status]}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2">
            <p className={label}>조건 태그</p>
            <div className="mt-1 flex flex-wrap gap-x-5">
              {activityTags.map((tag) => (
                <label key={tag} className="flex min-h-11 items-center gap-2 text-label font-medium text-content-strong">
                  <input type="checkbox" name="tags" value={tag} defaultChecked={row?.tags.includes(tag) === true} /> {activityTagLabels[tag]}
                </label>
              ))}
            </div>
          </div>
          <label className={label}>운영 상태 안내 <span className="font-normal text-content-subtle">(예: 겨울 휴장, 12월~2월)</span><input name="statusNote" defaultValue={text(row, "status_note")} className={input} /></label>
          {/* 안내에 날짜가 들어 있으면 그 안내가 맞는 마지막 날을 적는다. 지나면 사이트에서 안내만 숨긴다(2026-11-22 사용자 결정). */}
          <label className={label}>안내 끝나는 날 <span className="font-normal text-content-subtle">(지나면 안내를 숨김, 비우면 늘 보임)</span><input type="date" name="statusNoteUntil" defaultValue={text(row, "status_note_until")} className={input} /></label>
          <label className={`${label} sm:col-span-2`}>소개 <span className="font-normal text-content-subtle">(직접 쓴 2~4문장)</span><textarea name="description" defaultValue={text(row, "description")} rows={4} className={textarea} /></label>
          <label className={label}>운영시간<textarea name="hoursSummary" defaultValue={text(row, "hours_summary")} rows={2} className={textarea} /></label>
          <label className={label}>휴무<input name="closedSummary" defaultValue={text(row, "closed_summary")} className={input} /></label>
          <label className={label}>요금 <span className="font-normal text-content-subtle">(대표값 한 줄)</span><input name="priceSummary" defaultValue={text(row, "price_summary")} className={input} /></label>
          <label className={label}>전화<input name="phone" defaultValue={text(row, "phone")} className={input} /></label>
          <label className={`${label} sm:col-span-2`}>주차<input name="parkingSummary" defaultValue={text(row, "parking_summary")} className={input} /></label>
          <label className={`${label} sm:col-span-2`}>유의사항 <span className="font-normal text-content-subtle">(한 줄에 하나)</span><textarea name="cautions" defaultValue={text(row, "cautions")} rows={4} className={textarea} /></label>
          <label className={label}>예매 URL<input type="url" name="bookingUrl" defaultValue={text(row, "booking_url")} className={input} /></label>
          <label className={label}>정보 확인일 <span className="font-normal text-content-subtle">(실제로 다시 확인한 날만)</span><input type="date" name="verifiedOn" defaultValue={text(row, "verified_on")} className={input} /></label>
        </fieldset>
        <FormSubmitButton idleLabel="명소 저장" pendingLabel="저장 중…" className={`${getButtonClassName({ variant: "primary", size: "lg" })} justify-self-start sm:col-span-2`} />
      </AdminActionForm>
      {Boolean(id) && (
        // 삭제 확인은 다른 관리자 화면과 같은 공통 확인 창으로 묻는다(2026-11-06 사용자 결정).
        // "명소 삭제" 버튼은 확인 창을 열기만 해서 secondary, 확인 창 안의 확정 버튼이 danger다(.ai/DESIGN.md Button).
        <section className="space-y-3 rounded-card bg-danger-subtle p-5 ring-1 ring-danger-subtle sm:p-6">
          <p className="font-bold text-danger">명소 삭제</p>
          <p className="text-label font-normal text-danger">삭제한 명소는 복구할 수 없고, 가볼만한 곳 목록·상세·지도에서도 빠집니다.</p>
          <ConfirmDialog
            triggerLabel="명소 삭제"
            triggerClassName={getButtonClassName({ variant: "secondary" })}
            title={`${text(row, "name")} 삭제`}
            description="삭제한 명소는 복구할 수 없고, 가볼만한 곳 목록·상세·지도에서도 빠집니다."
          >
            <AdminActionForm action={deletePlaceAction} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="confirmation" value="delete" />
              <ConfirmDialogActions>
                <FormSubmitButton idleLabel="명소 삭제" pendingLabel="삭제 중…" className={getButtonClassName({ variant: "danger" })} />
              </ConfirmDialogActions>
            </AdminActionForm>
          </ConfirmDialog>
        </section>
      )}
    </div>
  );
}
