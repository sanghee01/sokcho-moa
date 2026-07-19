import { deleteEventAction, saveEventAction, uploadEventImageAction } from "@/lib/actions/admin";
import { isoToSeoulDatetimeLocal } from "@/lib/admin/datetime";
import { audienceLabels, categoryLabels } from "@/lib/domain/format";
import { eventAudiences, eventCategories } from "@/lib/domain/event";

type Row = Record<string, unknown> | null;
const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5";
const label = "text-sm font-bold text-slate-700";
const text = (row: Row, key: string) => row?.[key] == null ? "" : String(row[key]);
const checked = (row: Row, key: string) => row?.[key] === true;
const dateValue = (row: Row, key: string) => {
  const raw = text(row, key);
  return raw ? isoToSeoulDatetimeLocal(raw) : "";
};

export function EventForm({ row }: { row: Row }) {
  const audiences = Array.isArray(row?.audiences) ? row.audiences.map(String) : [];
  const id = text(row, "id");
  const slug = text(row, "slug");
  return (
    <div className="space-y-6">
      <form action={saveEventAction} className="space-y-7 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
        {id && <input type="hidden" name="id" value={id} />}
        <section className="grid gap-5 sm:grid-cols-2">
          <label className={label}>행사명<input required name="title" defaultValue={text(row, "title")} className={input} /></label>
          <label className={label}>슬러그<input required name="slug" defaultValue={slug} placeholder="sokcho-event-name" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={input} /></label>
          <label className={label}>카테고리<select name="category" defaultValue={text(row, "category") || "other"} className={input}>{eventCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}</select></label>
          <label className={label}>무료 여부<select name="isFree" defaultValue={row?.is_free == null ? "unknown" : String(row.is_free)} className={input}><option value="unknown">확인 필요</option><option value="true">무료</option><option value="false">유료</option></select></label>
        </section>

        <fieldset>
          <legend className={label}>참여 대상</legend>
          <div className="mt-2 flex flex-wrap gap-3">{eventAudiences.map((value) => <label key={value} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"><input type="checkbox" name="audiences" value={value} defaultChecked={audiences.includes(value)} /> {audienceLabels[value]}</label>)}</div>
        </fieldset>

        <section className="grid gap-5 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>한 줄 요약<textarea name="summary" defaultValue={text(row, "summary")} rows={2} className={input} /></label>
          <label className={`${label} sm:col-span-2`}>행사 소개<textarea name="description" defaultValue={text(row, "description")} rows={6} className={input} /></label>
          <label className={label}>행사 시작<input type="datetime-local" name="eventStartAt" defaultValue={dateValue(row, "event_start_at")} className={input} /></label>
          <label className={label}>행사 종료<input type="datetime-local" name="eventEndAt" defaultValue={dateValue(row, "event_end_at")} className={input} /></label>
          <label className={label}>신청 시작<input type="datetime-local" name="applicationStartAt" defaultValue={dateValue(row, "application_start_at")} className={input} /></label>
          <label className={label}>신청 종료<input type="datetime-local" name="applicationEndAt" defaultValue={dateValue(row, "application_end_at")} className={input} /></label>
          <label className={label}>운영일정<input name="operatingHours" defaultValue={text(row, "operating_hours")} placeholder="예: 매주 수요일 16:00~19:00 · 총 10회" className={input} /><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">행사기간을 반복하지 말고 실제 운영일·요일·회차·시간만 적어 주세요.</span></label>
          <label className={label}>요금 문구<input name="priceText" defaultValue={text(row, "price_text")} className={input} /></label>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <label className={label}>장소명<input name="locationName" defaultValue={text(row, "location_name")} className={input} /></label>
          <label className={label}>주소<input name="address" defaultValue={text(row, "address")} className={input} /></label>
          <label className={label}>위도<input type="number" step="any" name="latitude" defaultValue={text(row, "latitude")} className={input} /></label>
          <label className={label}>경도<input type="number" step="any" name="longitude" defaultValue={text(row, "longitude")} className={input} /></label>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <label className={label}>주최·주관<input name="organizer" defaultValue={text(row, "organizer")} className={input} /></label>
          <label className={label}>문의처<input name="contact" defaultValue={text(row, "contact")} className={input} /></label>
          <label className={label}>공식 안내 URL<input type="url" name="officialUrl" defaultValue={text(row, "official_url")} className={input} /><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">주최기관 또는 행사 공식 안내 주소입니다.</span></label>
          <label className={label}>신청·예매 URL<input type="url" name="applicationUrl" defaultValue={text(row, "application_url")} className={input} /><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">신청이나 예매를 실제로 시작할 수 있는 주소만 입력하세요.</span></label>
          <label className={label}>대표 이미지 URL<input type="url" name="imageUrl" defaultValue={text(row, "image_url")} className={input} /><span className="mt-1 block text-xs font-normal leading-5 text-rose-700">행사 공식 이미지이며 재사용 허가·공공누리 조건을 확인한 경우에만 입력하세요.</span></label>
          <label className={label}>마지막 확인일<input type="datetime-local" name="lastVerifiedAt" defaultValue={dateValue(row, "last_verified_at")} className={input} /></label>
          <label className={label}>출처 기관<input required name="sourceName" defaultValue={text(row, "source_name")} className={input} /></label>
          <label className={label}>공식 원문 URL<input required type="url" name="sourceUrl" defaultValue={text(row, "source_url")} className={input} /><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">기관 대표 홈이나 목록이 아니라 해당 행사를 직접 설명하는 상세 원문을 입력하세요.</span></label>
        </section>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="isFeatured" defaultChecked={checked(row, "is_featured")} /> 추천 행사로 표시</label>
        <button className="rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white hover:bg-teal-900">행사 저장</button>
      </form>

      {id && (
        <>
          <form action={uploadEventImageAction} className="rounded-3xl bg-cyan-50 p-5 ring-1 ring-cyan-200 sm:p-6">
            <input type="hidden" name="id" value={id} /><input type="hidden" name="slug" value={slug} />
            <label className={label}>대표 이미지 업로드 (JPG·PNG·WebP, 최대 5MB)<input required type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" /><span className="mt-2 block text-xs font-normal leading-5 text-cyan-950">공식 원본과 재사용 조건을 확인한 파일만 Storage에 올려 주세요.</span></label>
            <button className="mt-4 rounded-xl bg-cyan-800 px-4 py-2.5 text-sm font-bold text-white">Storage에 업로드</button>
          </form>
          <form action={deleteEventAction} className="rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-200 sm:p-6">
            <input type="hidden" name="id" value={id} /><input type="hidden" name="slug" value={slug} />
            <p className="font-black text-rose-950">행사 삭제</p>
            <p className="mt-1 text-sm leading-6 text-rose-900">행사와 연결된 출처 기록이 영구 삭제됩니다.</p>
            <label className="mt-4 flex items-center gap-2 text-sm font-bold text-rose-950"><input required type="checkbox" name="confirmation" value="delete" /> 삭제 내용을 확인했습니다.</label>
            <button className="mt-4 rounded-xl bg-rose-800 px-4 py-2.5 text-sm font-bold text-white">행사 삭제</button>
          </form>
        </>
      )}
    </div>
  );
}
