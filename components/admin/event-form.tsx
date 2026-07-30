"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { deleteEventAction, saveEventAction, uploadEventImageAction, type EventImageUploadState } from "@/lib/actions/admin";
import { isoToSeoulDatetimeLocal } from "@/lib/admin/datetime";
import { EVENT_IMAGE_ACCEPT, validateEventImage } from "@/lib/admin/event-image";
import { audienceLabels, categoryLabels } from "@/lib/domain/format";
import { eventAudiences, eventCategories, getEventIntroduction } from "@/lib/domain/event";

type Row = Record<string, unknown> | null;
const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5";
const label = "text-sm font-bold text-slate-700";
const section = "space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6";
const text = (row: Row, key: string) => row?.[key] == null ? "" : String(row[key]);
const listText = (row: Row, key: string) => Array.isArray(row?.[key])
  ? row[key].map(String).join("\n")
  : "";
const checked = (row: Row, key: string) => row?.[key] === true;
const dateValue = (row: Row, key: string) => {
  const raw = text(row, key);
  return raw ? isoToSeoulDatetimeLocal(raw) : "";
};

type OccurrenceDraft = { key: string; startsAt: string; endsAt: string };
const initialImageUploadState: EventImageUploadState = {
  error: null,
  publicUrl: null,
  uploadedPath: null,
  selectionToken: null,
  fileName: null,
};

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-rose-600">*</span>
      <span className="sr-only"> (필수)</span>
    </>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div>
      <h2 id={id} className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function FieldHelp({ id, children, tone = "default" }: { id?: string; children: ReactNode; tone?: "default" | "warning" }) {
  return (
    <span id={id} className={`mt-1 block text-xs font-normal leading-5 ${tone === "warning" ? "text-rose-700" : "text-slate-500"}`}>
      {children}
    </span>
  );
}

function dateTimeParts(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

function DateTimeField({
  labelText,
  name,
  defaultValue,
  requiredDate = false,
}: {
  labelText: string;
  name: string;
  defaultValue: string;
  requiredDate?: boolean;
}) {
  const parts = dateTimeParts(defaultValue);
  return (
    <fieldset className="min-w-0">
      <legend className={label}>{labelText}{requiredDate && <RequiredMark />}</legend>
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
        <label className="text-xs font-medium text-slate-600">
          날짜
          <input required={requiredDate} type="date" name={name} defaultValue={parts.date} className={input} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          시간 (선택)
          <input type="time" name={`${name}Time`} defaultValue={parts.time} className={input} />
        </label>
      </div>
    </fieldset>
  );
}

function ImageUploadField({ initialUrl, onUploaded }: { initialUrl: string; onUploaded: (url: string) => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [uploadState, uploadAction, isUploading] = useActionState(uploadEventImageAction, initialImageUploadState);
  const [previewUrl, setPreviewUrl] = useState(initialUrl.trim());
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectionToken, setSelectionToken] = useState("");
  const [clientValidationError, setClientValidationError] = useState<string | null>(null);
  const hasPreview = Boolean(previewUrl) && failedPreviewUrl !== previewUrl;
  const isUploaded = Boolean(fileName) && uploadState.selectionToken === selectionToken && Boolean(uploadState.publicUrl);
  const uploadError = clientValidationError || (uploadState.selectionToken === selectionToken ? uploadState.error : null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    if (isUploaded && uploadState.publicUrl) onUploaded(uploadState.publicUrl);
  }, [isUploaded, onUploaded, uploadState.publicUrl]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(initialUrl.trim());
      setFileName("");
      setSelectionToken("");
      setClientValidationError(null);
      setFailedPreviewUrl(null);
      return;
    }

    const validationError = validateEventImage(file);
    if (validationError) {
      event.target.value = "";
      setPreviewUrl(initialUrl.trim());
      setFileName("");
      setSelectionToken("");
      setClientValidationError(validationError);
      setFailedPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFileName(file.name);
    setSelectionToken(crypto.randomUUID());
    setClientValidationError(null);
    setFailedPreviewUrl(null);
  };

  const handleUpload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file || !selectionToken || isUploading) return;
    const formData = new FormData();
    formData.set("image", file);
    formData.set("imageSelectionToken", selectionToken);
    if (uploadState.uploadedPath) formData.set("previousUploadedImagePath", uploadState.uploadedPath);
    startTransition(() => uploadAction(formData));
  };

  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 sm:col-span-2">
      <p className={label}>대표 이미지 파일 업로드</p>
      <input type="hidden" name="uploadedImageUrl" value={isUploaded ? uploadState.publicUrl ?? "" : ""} />
      <div data-testid="event-image-upload-panel" className="mt-3 grid min-h-32 grid-cols-[5rem_minmax(0,1fr)] items-center gap-4">
        <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-cyan-200 bg-white">
          {hasPreview ? (
            <Image
              src={previewUrl}
              alt="대표 이미지 미리보기"
              fill
              unoptimized
              sizes="80px"
              onError={() => setFailedPreviewUrl(previewUrl)}
              className="object-contain"
            />
          ) : (
            <div role="img" aria-label="대표 이미지 미리보기 없음" className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-amber-50 px-2 text-center text-[11px] font-medium leading-4 text-slate-500">
              미리보기 없음
            </div>
          )}
        </div>
        <div className="min-w-0">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            name="image"
            accept={EVENT_IMAGE_ACCEPT}
            onChange={handleImageChange}
            className="sr-only"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-700 bg-white px-4 py-2.5 text-sm font-bold text-cyan-900 hover:bg-cyan-100">
              파일 선택
            </button>
            <button type="button" disabled={!fileName || isUploading || isUploaded} onClick={handleUpload} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
              {isUploading ? "업로드 중…" : isUploaded ? "업로드 완료" : "이미지 업로드"}
            </button>
          </div>
          <p aria-live="polite" className={`mt-2 min-h-10 text-xs font-normal leading-5 ${uploadError ? "text-rose-700" : "text-slate-600"}`}>
            {uploadError || (fileName
              ? `${fileName} · ${isUploaded ? "업로드 완료" : "업로드 대기"}`
              : initialUrl.trim() ? "현재 등록된 이미지" : "선택된 파일 없음")}
          </p>
        </div>
      </div>
      <FieldHelp>JPG·PNG·WebP, 최대 5MB. 파일 선택 후 ‘이미지 업로드’를 누르세요. 업로드한 파일은 위의 대표 이미지 URL보다 우선 사용합니다.</FieldHelp>
      <FieldHelp tone="warning">공식 원본과 재사용 허가·공공누리 조건을 확인한 파일만 업로드하세요.</FieldHelp>
    </div>
  );
}

function initialOccurrences(row: Row): OccurrenceDraft[] {
  const values = Array.isArray(row?.event_occurrences)
    ? row.event_occurrences.filter((value): value is Record<string, unknown> => value != null && typeof value === "object")
    : [];
  return values
    .map((occurrence, index) => ({
      key: String(occurrence.id ?? index),
      startsAt: occurrence.starts_at ? isoToSeoulDatetimeLocal(String(occurrence.starts_at)) : "",
      endsAt: occurrence.ends_at ? isoToSeoulDatetimeLocal(String(occurrence.ends_at)) : "",
    }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function EventForm({ row }: { row: Row }) {
  const initialAudiences = Array.isArray(row?.audiences) ? row.audiences.map(String) : [];
  const id = text(row, "id");
  const slug = text(row, "slug");
  const [imageUrl, setImageUrl] = useState(text(row, "image_url"));
  const [selectedAudiences, setSelectedAudiences] = useState(initialAudiences);
  const [scheduleMode, setScheduleMode] = useState<"continuous" | "occurrences">(
    text(row, "schedule_mode") === "occurrences" ? "occurrences" : "continuous",
  );
  const [occurrences, setOccurrences] = useState<OccurrenceDraft[]>(() => initialOccurrences(row));

  const toggleAudience = (value: string, selected: boolean) => {
    setSelectedAudiences((current) => selected
      ? [...current, value]
      : current.filter((audience) => audience !== value));
  };
  const selectScheduleMode = (value: "continuous" | "occurrences") => {
    setScheduleMode(value);
    if (value === "occurrences" && occurrences.length === 0) {
      setOccurrences([{ key: "new-0", startsAt: "", endsAt: "" }]);
    }
  };
  const addOccurrence = () => setOccurrences((current) => [
    ...current,
    { key: `new-${Date.now()}`, startsAt: "", endsAt: "" },
  ]);
  const removeOccurrence = (key: string) => setOccurrences((current) => current.filter((item) => item.key !== key));

  return (
    <div className="space-y-6">
      <AdminActionForm action={saveEventAction} className="event-form space-y-7 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
        {id && <><input type="hidden" name="id" value={id} /><input type="hidden" name="slug" value={slug} /></>}

        <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
          <p><span aria-hidden="true" className="font-black text-rose-600">*</span> 표시는 저장에 필요한 항목입니다.</p>
          <p className="text-teal-800">slug와 확인 시각 같은 시스템 정보는 저장할 때 자동으로 관리됩니다.</p>
        </div>

        <section aria-labelledby="event-basic-title" className={section}>
          <SectionHeading id="event-basic-title" title="기본 정보" description="방문자가 행사 목록과 상세에서 가장 먼저 확인할 내용을 입력하세요." />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={label}>
              행사명<RequiredMark />
              <input required name="title" defaultValue={text(row, "title")} placeholder="예: 2026 속초 여름 바다축제" className={input} />
            </label>
            <label className={label}>
              카테고리<RequiredMark />
              <select required name="category" defaultValue={text(row, "category") || "other"} className={input}>
                {eventCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}
              </select>
            </label>
            <label className={label}>
              무료 여부
              <select name="isFree" defaultValue={row?.is_free == null ? "unknown" : String(row.is_free)} className={input}>
                <option value="unknown">확인 필요</option><option value="true">무료</option><option value="false">유료</option>
              </select>
            </label>
            <fieldset className="sm:col-span-2" aria-required="true" aria-describedby="audiences-help">
              <legend className={label}>참여 대상<RequiredMark /></legend>
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
            <label className={`${label} sm:col-span-2`}>
              행사 소개
              <textarea name="introduction" defaultValue={getEventIntroduction({ summary: text(row, "summary") || null, description: text(row, "description") || null }) ?? ""} rows={6} maxLength={5_000} placeholder="예: 주요 프로그램, 행사 특징, 준비물 등 방문 전에 알아야 할 내용을 적어 주세요." className={input} />
              <FieldHelp>행사 목록 검색, 상세 페이지, 공유 미리보기에 같은 내용으로 표시됩니다.</FieldHelp>
            </label>
          </div>
        </section>

        <section aria-labelledby="event-schedule-title" className={section}>
          <SectionHeading id="event-schedule-title" title="일정·신청" description="행사 기간과 실제 운영 방식, 신청 가능 기간을 구분해 입력하세요." />
          <div className="grid gap-5 sm:grid-cols-2">
            <DateTimeField labelText="행사 시작" name="eventStartAt" defaultValue={dateValue(row, "event_start_at")} />
            <DateTimeField labelText="행사 종료" name="eventEndAt" defaultValue={dateValue(row, "event_end_at")} />
            <label className={`${label} sm:col-span-2`}>
              캘린더 운영 방식
              <select name="scheduleMode" value={scheduleMode} onChange={(event) => selectScheduleMode(event.target.value as "continuous" | "occurrences")} className={input}>
                <option value="continuous">행사기간 동안 계속 운영</option>
                <option value="occurrences">지정한 운영 회차에만 운영</option>
              </select>
              <FieldHelp>매일 이어지는 행사는 행사기간을, 특정 날짜·요일에만 열리면 실제 운영 회차를 선택하세요.</FieldHelp>
            </label>
            {scheduleMode === "occurrences" && (
              <fieldset className="space-y-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:col-span-2">
                <legend className="sr-only">실제 운영 회차</legend>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={label}>실제 운영 회차</p>
                    <p className="mt-1 text-xs font-normal leading-5 text-slate-600">캘린더에는 아래 날짜만 표시됩니다. 같은 날 여러 회차도 각각 입력할 수 있어요.</p>
                  </div>
                  <button type="button" onClick={addOccurrence} className="min-h-11 rounded-xl border border-teal-300 bg-white px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50">회차 추가</button>
                </div>
                {occurrences.length === 0 ? (
                  <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600">회차 추가를 눌러 실제 운영 날짜를 입력해 주세요.</p>
                ) : (
                  <div className="space-y-3">
                    {occurrences.map((occurrence, index) => (
                      <div key={occurrence.key} className="grid gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <DateTimeField labelText={`회차 ${index + 1} 시작`} name="occurrenceStartsAt" defaultValue={occurrence.startsAt} requiredDate />
                        <DateTimeField labelText={`회차 ${index + 1} 종료`} name="occurrenceEndsAt" defaultValue={occurrence.endsAt} />
                        <button type="button" onClick={() => removeOccurrence(occurrence.key)} aria-label={`회차 ${index + 1} 삭제`} className="min-h-11 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">삭제</button>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>
            )}
            <DateTimeField labelText="신청 시작" name="applicationStartAt" defaultValue={dateValue(row, "application_start_at")} />
            <DateTimeField labelText="신청 종료" name="applicationEndAt" defaultValue={dateValue(row, "application_end_at")} />
            <label className={`${label} sm:col-span-2`}>
              운영일정
              <textarea name="operatingHours" defaultValue={text(row, "operating_hours")} rows={4} placeholder={"예:\n매주 수요일 16:00~19:00\n7월 27일은 휴무"} className={input} />
              <FieldHelp>실제 운영일·요일·회차·시간을 일정별로 줄바꿈해 적어 주세요.</FieldHelp>
            </label>
          </div>
        </section>

        <section aria-labelledby="event-location-title" className={section}>
          <SectionHeading id="event-location-title" title="장소·요금" description="장소명과 주소만 입력하면 공개 화면에서 지도 검색 링크를 자동으로 만듭니다." />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={label}>장소명<input name="locationName" defaultValue={text(row, "location_name")} placeholder="예: 속초문화예술회관" className={input} /></label>
            <label className={label}>주소<input name="address" defaultValue={text(row, "address")} placeholder="예: 강원특별자치도 속초시 번영로 155" className={input} /></label>
            <label className={label}>요금 문구<input name="priceText" defaultValue={text(row, "price_text")} placeholder="예: 무료 또는 성인 10,000원" className={input} /></label>
          </div>
        </section>

        <section aria-labelledby="event-links-title" className={section}>
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
            <label className={label}>주최·주관<input name="organizer" defaultValue={text(row, "organizer")} placeholder="예: 속초시·속초문화관광재단" className={input} /></label>
            <label className={label}>
              주최기관 홈페이지
              <input type="url" name="organizerUrl" defaultValue={text(row, "organizer_url")} placeholder="예: https://www.sokcho.go.kr" className={input} />
              <FieldHelp>행사 상세 페이지가 아니라 주최기관의 공식 홈페이지 주소를 입력하세요.</FieldHelp>
            </label>
            <label className={label}>
              출연자
              <textarea name="performerPeople" defaultValue={listText(row, "performer_people")} rows={3} placeholder={"예:\n홍길동\n김속초"} className={input} />
              <FieldHelp>실제로 출연하는 사람을 한 줄에 한 명씩 입력하세요.</FieldHelp>
            </label>
            <label className={label}>
              출연팀
              <textarea name="performerGroups" defaultValue={listText(row, "performer_groups")} rows={3} placeholder={"예:\n속초시립합창단\n설악 앙상블"} className={input} />
              <FieldHelp>실제로 출연하는 팀을 한 줄에 한 팀씩 입력하세요. 출연자가 없는 행사는 두 항목 모두 비워 두세요.</FieldHelp>
            </label>
            <label className={label}>
              문의처 전화번호
              <input type="tel" name="contact" defaultValue={text(row, "contact")} placeholder="예: 033-639-0000" className={input} />
              <FieldHelp>행사 내용과 신청 방법을 문의할 수 있는 주최 기관의 전화번호를 입력하세요.</FieldHelp>
            </label>
            <label className={label}>
              출처 기관<RequiredMark />
              <input required name="sourceName" defaultValue={text(row, "source_name")} placeholder="예: 속초시청" className={input} />
              <FieldHelp>행사 정보를 게시한 시청·시설·주최 기관명을 적어 주세요.</FieldHelp>
            </label>
            <label className={label}>
              행사 안내 URL<RequiredMark />
              <input required type="url" name="sourceUrl" defaultValue={text(row, "source_url")} placeholder="예: https://www.sokcho.go.kr/portal/event/..." aria-describedby="source-url-help" className={input} />
              <FieldHelp id="source-url-help">이 행사를 직접 설명하는 공식 상세 페이지를 권장합니다. 입력한 주소는 공개 화면의 ‘행사 안내’ 버튼으로 연결됩니다.</FieldHelp>
            </label>
            <label className={label}>
              신청·예매 URL
              <input type="url" name="applicationUrl" defaultValue={text(row, "application_url")} placeholder="예: https://booking.example.com/events/123" aria-describedby="application-url-help" className={input} />
              <FieldHelp id="application-url-help">신청이나 예매를 실제로 시작할 수 있는 주소만 입력하세요. 입력한 경우에만 버튼이 나타납니다.</FieldHelp>
            </label>
            <label className={label}>
              대표 이미지 URL
              <input type="url" name="imageUrl" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="예: https://example.com/event-poster.jpg" aria-describedby="image-url-help" className={input} />
              <FieldHelp id="image-url-help" tone="warning">행사 공식 이미지이며 재사용 허가·공공누리 조건을 확인한 경우에만 입력하세요.</FieldHelp>
            </label>
            <ImageUploadField initialUrl={text(row, "image_url")} onUploaded={setImageUrl} />
          </div>
        </section>

        <section aria-labelledby="event-visibility-title" className={section}>
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
        <AdminActionForm action={deleteEventAction} className="space-y-4 rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-200 sm:p-6">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="slug" value={slug} />
          <p className="font-black text-rose-950">행사 삭제</p>
          <p className="mt-1 text-sm leading-6 text-rose-900">행사와 연결된 출처 기록이 영구 삭제됩니다.</p>
          <label className="flex items-center gap-2 text-sm font-bold text-rose-950"><input required type="checkbox" name="confirmation" value="delete" /> 삭제 내용을 확인했습니다.</label>
          <FormSubmitButton idleLabel="행사 삭제" pendingLabel="삭제 중…" className="rounded-xl bg-rose-800 px-4 py-2.5 text-sm font-bold text-white" />
        </AdminActionForm>
      )}
    </div>
  );
}
