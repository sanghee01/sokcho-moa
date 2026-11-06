"use client";

import { useState } from "react";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { saveEventAction } from "@/features/events/admin/actions";
import { EventDeleteControl } from "@/features/events/admin/components/event-delete-control";
import {
  DateTimeField,
  FieldHelp,
  inputClassName,
  labelClassName,
  RequiredMark,
  SectionHeading,
  sectionClassName,
} from "@/features/events/admin/components/event-form-fields";
import { checked, dateValue, listText, text, type EventRow } from "@/features/events/admin/components/event-form-row";
import { ImageUploadField } from "@/features/events/admin/components/event-image-upload-field";
import { ScheduleModeField } from "@/features/events/admin/components/schedule-mode-field";
import { audienceLabels, categoryLabels } from "@/features/events/model/format";
import { eventAudiences, eventCategories, getEventIntroduction } from "@/features/events/model/event";

/** 행사 작성·수정 폼. 섹션을 조립하고, 입력값 해석과 저장은 saveEventAction이 맡는다. */
export function EventForm({ row }: { row: EventRow }) {
  const initialAudiences = Array.isArray(row?.audiences) ? row.audiences.map(String) : [];
  const id = text(row, "id");
  const slug = text(row, "slug");
  const [imageUrl, setImageUrl] = useState(text(row, "image_url"));
  const [selectedAudiences, setSelectedAudiences] = useState(initialAudiences);

  const toggleAudience = (value: string, selected: boolean) => {
    setSelectedAudiences((current) => selected
      ? [...current, value]
      : current.filter((audience) => audience !== value));
  };

  return (
    <div className="space-y-6">
      <AdminActionForm action={saveEventAction} className="event-form space-y-7 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
        {id && <><input type="hidden" name="id" value={id} /><input type="hidden" name="slug" value={slug} /></>}

        <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
          <p><span aria-hidden="true" className="font-black text-rose-600">*</span> 표시는 저장에 필요한 항목입니다.</p>
          <p className="text-teal-800">slug와 확인 시각 같은 시스템 정보는 저장할 때 자동으로 관리됩니다.</p>
        </div>

        <section aria-labelledby="event-basic-title" className={sectionClassName}>
          <SectionHeading id="event-basic-title" title="기본 정보" description="방문자가 행사 목록과 상세에서 가장 먼저 확인할 내용을 입력하세요." />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>
              행사명<RequiredMark />
              <input required name="title" defaultValue={text(row, "title")} placeholder="예: 2026 속초 여름 바다축제" className={inputClassName} />
            </label>
            <label className={labelClassName}>
              카테고리<RequiredMark />
              <select required name="category" defaultValue={text(row, "category") || "other"} className={inputClassName}>
                {eventCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}
              </select>
            </label>
            <label className={labelClassName}>
              무료 여부
              <select name="isFree" defaultValue={row?.is_free == null ? "unknown" : String(row.is_free)} className={inputClassName}>
                <option value="unknown">확인 필요</option><option value="true">무료</option><option value="false">유료</option>
              </select>
            </label>
            <fieldset className="sm:col-span-2" aria-required="true" aria-describedby="audiences-help">
              <legend className={labelClassName}>참여 대상<RequiredMark /></legend>
              <p id="audiences-help" className="mt-1 text-xs leading-5 text-slate-500">한 개 이상 선택하세요.</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {eventAudiences.map((value, index) => (
                  <label key={value} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                    <input
                      type="checkbox"
                      name="audiences"
                      value={value}
                      checked={selectedAudiences.includes(value)}
                      required={index === 0 && selectedAudiences.length === 0}
                      onChange={(event) => toggleAudience(value, event.target.checked)}
                    />
                    {audienceLabels[value]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={`${labelClassName} sm:col-span-2`}>
              행사 소개
              <textarea name="introduction" defaultValue={getEventIntroduction({ summary: text(row, "summary") || null, description: text(row, "description") || null }) ?? ""} rows={6} maxLength={5_000} placeholder="예: 주요 프로그램, 행사 특징, 준비물 등 방문 전에 알아야 할 내용을 적어 주세요." className={inputClassName} />
              <FieldHelp>행사 목록 검색, 상세 페이지, 공유 미리보기에 같은 내용으로 표시됩니다.</FieldHelp>
            </label>
          </div>
        </section>

        <section aria-labelledby="event-schedule-title" className={sectionClassName}>
          <SectionHeading id="event-schedule-title" title="일정·신청" description="행사 기간과 실제 운영 방식, 신청 가능 기간을 구분해 입력하세요." />
          <div className="grid gap-5 sm:grid-cols-2">
            <DateTimeField labelText="행사 시작" name="eventStartAt" defaultValue={dateValue(row, "event_start_at")} />
            <DateTimeField labelText="행사 종료" name="eventEndAt" defaultValue={dateValue(row, "event_end_at")} />
            <ScheduleModeField row={row} />
            <DateTimeField labelText="신청 시작" name="applicationStartAt" defaultValue={dateValue(row, "application_start_at")} />
            <DateTimeField labelText="신청 종료" name="applicationEndAt" defaultValue={dateValue(row, "application_end_at")} />
            <label className={`${labelClassName} sm:col-span-2`}>
              운영일정
              <textarea name="operatingHours" defaultValue={text(row, "operating_hours")} rows={4} placeholder={"예:\n매주 수요일 16:00~19:00\n7월 27일은 휴무"} className={inputClassName} />
              <FieldHelp>실제 운영일·요일·회차·시간을 일정별로 줄바꿈해 적어 주세요.</FieldHelp>
            </label>
          </div>
        </section>

        <section aria-labelledby="event-location-title" className={sectionClassName}>
          <SectionHeading id="event-location-title" title="장소·요금" description="장소명과 주소만 입력하면 공개 화면에서 지도 검색 링크를 자동으로 만듭니다." />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>장소명<input name="locationName" defaultValue={text(row, "location_name")} placeholder="예: 속초문화예술회관" className={inputClassName} /></label>
            <label className={labelClassName}>주소<input name="address" defaultValue={text(row, "address")} placeholder="예: 강원특별자치도 속초시 번영로 155" className={inputClassName} /></label>
            <label className={labelClassName}>요금 문구<input name="priceText" defaultValue={text(row, "price_text")} placeholder="예: 무료 또는 성인 10,000원" className={inputClassName} /></label>
          </div>
        </section>

        <section aria-labelledby="event-links-title" className={sectionClassName}>
          <SectionHeading id="event-links-title" title="링크·출처" description="방문자가 포스터 옆에서 보게 될 버튼과 정보의 출처를 입력하세요." />
          <aside aria-label="공개 버튼 생성 안내" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
            <p className="font-black">공개 화면 버튼은 이렇게 만들어집니다</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>행사 안내</strong>: 아래 행사 안내 URL로 항상 생성</li>
              <li><strong>신청·예매</strong>: 신청·예매 URL이 있을 때만 생성</li>
              <li><strong>공유하기</strong>: 입력 없이 시스템이 항상 생성</li>
            </ul>
          </aside>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>주최·주관<input name="organizer" defaultValue={text(row, "organizer")} placeholder="예: 속초시·속초문화관광재단" className={inputClassName} /></label>
            <label className={labelClassName}>
              주최기관 홈페이지
              <input type="url" name="organizerUrl" defaultValue={text(row, "organizer_url")} placeholder="예: https://www.sokcho.go.kr" className={inputClassName} />
              <FieldHelp>행사 상세 페이지가 아니라 주최기관의 공식 홈페이지 주소를 입력하세요.</FieldHelp>
            </label>
            <label className={labelClassName}>
              출연자
              <textarea name="performerPeople" defaultValue={listText(row, "performer_people")} rows={3} placeholder={"예:\n홍길동\n김속초"} className={inputClassName} />
              <FieldHelp>실제로 출연하는 사람을 한 줄에 한 명씩 입력하세요.</FieldHelp>
            </label>
            <label className={labelClassName}>
              출연팀
              <textarea name="performerGroups" defaultValue={listText(row, "performer_groups")} rows={3} placeholder={"예:\n속초시립합창단\n설악 앙상블"} className={inputClassName} />
              <FieldHelp>실제로 출연하는 팀을 한 줄에 한 팀씩 입력하세요. 출연자가 없는 행사는 두 항목 모두 비워 두세요.</FieldHelp>
            </label>
            <label className={labelClassName}>
              문의처 전화번호
              <input type="tel" name="contact" defaultValue={text(row, "contact")} placeholder="예: 033-639-0000" className={inputClassName} />
              <FieldHelp>행사 내용과 신청 방법을 문의할 수 있는 주최 기관의 전화번호를 입력하세요.</FieldHelp>
            </label>
            <label className={labelClassName}>
              출처 기관<RequiredMark />
              <input required name="sourceName" defaultValue={text(row, "source_name")} placeholder="예: 속초시청" className={inputClassName} />
              <FieldHelp>행사 정보를 게시한 시청·시설·주최 기관명을 적어 주세요.</FieldHelp>
            </label>
            <label className={labelClassName}>
              행사 안내 URL<RequiredMark />
              <input required type="url" name="sourceUrl" defaultValue={text(row, "source_url")} placeholder="예: https://www.sokcho.go.kr/portal/event/..." aria-describedby="source-url-help" className={inputClassName} />
              <FieldHelp id="source-url-help">이 행사를 직접 설명하는 공식 상세 페이지를 권장합니다. 입력한 주소는 공개 화면의 ‘행사 안내’ 버튼으로 연결됩니다.</FieldHelp>
            </label>
            <label className={labelClassName}>
              신청·예매 URL
              <input type="url" name="applicationUrl" defaultValue={text(row, "application_url")} placeholder="예: https://booking.example.com/events/123" aria-describedby="application-url-help" className={inputClassName} />
              <FieldHelp id="application-url-help">신청이나 예매를 실제로 시작할 수 있는 주소만 입력하세요. 입력한 경우에만 버튼이 나타납니다.</FieldHelp>
            </label>
            <label className={labelClassName}>
              대표 이미지 URL
              <input type="url" name="imageUrl" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="예: https://example.com/event-poster.jpg" aria-describedby="image-url-help" className={inputClassName} />
              <FieldHelp id="image-url-help" tone="warning">행사 공식 이미지이며 재사용 허가·공공누리 조건을 확인한 경우에만 입력하세요.</FieldHelp>
            </label>
            <ImageUploadField initialUrl={text(row, "image_url")} onUploaded={setImageUrl} />
          </div>
        </section>

        <section aria-labelledby="event-visibility-title" className={sectionClassName}>
          <SectionHeading id="event-visibility-title" title="노출 설정" description="추천 표시와 공개 상태를 관리합니다. 공개 상태는 저장 후 대시보드에서 변경할 수 있습니다." />
          <div>
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-800">
              <input type="checkbox" name="isFeatured" defaultChecked={checked(row, "is_featured")} /> 추천 행사로 표시
            </label>
            <FieldHelp>현재는 검색엔진용 사이트맵 우선순위만 높아지며, 홈이나 행사 목록의 노출 순서는 바뀌지 않습니다.</FieldHelp>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <FormSubmitButton idleLabel={id ? "수정 완료" : "작성 완료"} pendingLabel="저장 중…" className="min-h-12 rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white hover:bg-teal-900" />
          <p className="text-sm text-slate-500">완료하면 관리자 대시보드로 이동합니다.</p>
        </div>
      </AdminActionForm>

      {id && (
        <section className="space-y-4 rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-200 sm:p-6">
          <p className="font-black text-rose-950">행사 삭제</p>
          <p className="mt-1 text-sm leading-6 text-rose-900">행사와 연결된 출처 기록이 영구 삭제되고, 같은 행사는 재수집 제외 목록에 저장됩니다.</p>
          <EventDeleteControl event={{ id, slug, title: text(row, "title") || "행사" }} />
        </section>
      )}
    </div>
  );
}
