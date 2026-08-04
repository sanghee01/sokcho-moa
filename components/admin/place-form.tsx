import { AdminActionForm } from "@/components/admin/admin-action-form";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { deletePlaceAction, savePlaceAction } from "@/lib/actions/admin/place";

type Row = Record<string, unknown> | null;
const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5";
const label = "text-sm font-bold text-slate-700";
const text = (row: Row, key: string) => row?.[key] == null ? "" : String(row[key]);

export function PlaceForm({ row }: { row: Row }) {
  const id = text(row, "id");
  const slug = text(row, "slug");
  return (
    <div className="space-y-6">
      <AdminActionForm action={savePlaceAction} className="grid gap-5 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-2 sm:p-8">
        {id && <input type="hidden" name="id" value={id} />}
        <label className={label}>명소명<input required name="name" defaultValue={text(row, "name")} className={input} /></label>
        <label className={label}>슬러그<input required name="slug" defaultValue={slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={input} /></label>
        <label className={label}>카테고리<input required name="category" defaultValue={text(row, "category")} className={input} /></label>
        <label className={label}>주소<input name="address" defaultValue={text(row, "address")} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>짧은 소개<textarea name="summary" defaultValue={text(row, "summary")} rows={3} className={input} /></label>
        <label className={label}>위도<input required type="number" step="any" name="latitude" defaultValue={text(row, "latitude")} className={input} /></label>
        <label className={label}>경도<input required type="number" step="any" name="longitude" defaultValue={text(row, "longitude")} className={input} /></label>
        <label className={label}>대표 이미지 URL<input type="url" name="imageUrl" defaultValue={text(row, "image_url")} className={input} /></label>
        <label className={label}>공식 홈페이지<input type="url" name="officialUrl" defaultValue={text(row, "official_url")} className={input} /></label>
        <label className={`${label} sm:col-span-2`}>지도 URL<input type="url" name="mapUrl" defaultValue={text(row, "map_url")} className={input} /></label>
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" name="isPublished" defaultChecked={row?.is_published === true} /> 공개 명소로 표시</label>
        <FormSubmitButton idleLabel="명소 저장" pendingLabel="저장 중…" className="w-fit rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white sm:col-span-2" />
      </AdminActionForm>
      {id && (
        <AdminActionForm action={deletePlaceAction} className="space-y-4 rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-200 sm:p-6">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="slug" value={slug} />
          <p className="font-black text-rose-950">명소 삭제</p>
          <label className="flex items-center gap-2 text-sm font-bold text-rose-950"><input required type="checkbox" name="confirmation" value="delete" /> 삭제 내용을 확인했습니다.</label>
          <FormSubmitButton idleLabel="명소 삭제" pendingLabel="삭제 중…" className="rounded-xl bg-rose-800 px-4 py-2.5 text-sm font-bold text-white" />
        </AdminActionForm>
      )}
    </div>
  );
}
